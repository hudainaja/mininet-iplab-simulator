import { NetworkNode, NetworkLink, BgpNeighbor, BgpRoute } from './types';
import { parseIpv4Cidr, isIpv4InSubnet } from './ipUtils';
import { computeOspfRoutes } from './ospfEngine';

export function getBgpRouterId(node: NetworkNode): string {
  if (node.bgpRouterId) return node.bgpRouterId;
  if (node.ospfRouterId) return node.ospfRouterId;
  if (node.interfaces['lo']?.ip) {
    const p = parseIpv4Cidr(node.interfaces['lo'].ip);
    if (p) return p.ip;
  }
  return '1.1.1.1';
}

// Check if a target IP is reachable via Connected or OSPF route
export function isIpReachable(
  sourceNodeId: string,
  targetIp: string,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): boolean {
  const sourceNode = nodes[sourceNodeId];
  if (!sourceNode) return false;

  // 1. Check directly connected
  for (const intf of Object.values(sourceNode.interfaces)) {
    if (intf.ip && intf.up) {
      const parsed = parseIpv4Cidr(intf.ip);
      if (parsed && isIpv4InSubnet(targetIp, parsed.network, parsed.prefix)) {
        return true;
      }
    }
  }

  // 2. Check OSPF routes
  const ospfRoutes = computeOspfRoutes(sourceNodeId, nodes, links);
  for (const rt of ospfRoutes) {
    if (isIpv4InSubnet(targetIp, rt.destination, rt.prefix)) {
      return true;
    }
  }

  // 3. Check static routes
  for (const s of sourceNode.staticRoutes) {
    if (isIpv4InSubnet(targetIp, s.destination, s.prefix)) {
      return true;
    }
  }

  return false;
}

// Compute live BGP neighbor states
export function computeBgpNeighbors(
  nodeId: string,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): Record<string, BgpNeighbor> {
  const node = nodes[nodeId];
  if (!node || !node.bgpEnabled || !node.bgpAsNumber) return {};

  const updatedNeighbors: Record<string, BgpNeighbor> = {};

  for (const [neighborIp, config] of Object.entries(node.bgpNeighbors)) {
    let state: BgpNeighbor['state'] = 'Active';
    let prefixesCount = 0;

    // Is neighbor reachable?
    const reachable = isIpReachable(nodeId, neighborIp, nodes, links);

    if (reachable) {
      // Find which node owns neighborIp
      let peerNode: NetworkNode | null = null;
      let peerIntfName: string | null = null;

      for (const other of Object.values(nodes)) {
        if (other.id === nodeId) continue;
        for (const [intfName, intf] of Object.entries(other.interfaces)) {
          if (intf.ip && intf.up) {
            const p = parseIpv4Cidr(intf.ip);
            if (p && p.ip === neighborIp) {
              peerNode = other;
              peerIntfName = intfName;
              break;
            }
          }
        }
        if (peerNode) break;
      }

      if (peerNode && peerNode.bgpEnabled && peerNode.bgpAsNumber) {
        // Check reciprocal peering
        // What IP is local router using to reach peer?
        let localSourceIp = '';
        if (config.updateSource && node.interfaces[config.updateSource]?.ip) {
          const p = parseIpv4Cidr(node.interfaces[config.updateSource].ip!);
          if (p) localSourceIp = p.ip;
        } else {
          // find closest interface IP
          for (const intf of Object.values(node.interfaces)) {
            if (intf.ip && intf.up) {
              const p = parseIpv4Cidr(intf.ip);
              if (p) { localSourceIp = p.ip; break; }
            }
          }
        }

        // Check if peerNode has configured neighbor to localSourceIp
        let reciprocalConfig = peerNode.bgpNeighbors[localSourceIp];
        
        // If not found by localSourceIp, check any neighbor configured matching any of our IPs
        if (!reciprocalConfig) {
          for (const myIntf of Object.values(node.interfaces)) {
            if (myIntf.ip) {
              const p = parseIpv4Cidr(myIntf.ip);
              if (p && peerNode.bgpNeighbors[p.ip]) {
                reciprocalConfig = peerNode.bgpNeighbors[p.ip];
                break;
              }
            }
          }
        }

        if (reciprocalConfig) {
          // Check AS matching
          if (config.remoteAs === peerNode.bgpAsNumber && reciprocalConfig.remoteAs === node.bgpAsNumber) {
            state = 'Established';
            prefixesCount = peerNode.bgpNetworks.length;
          }
        }
      }
    } else {
      state = 'Idle';
    }

    updatedNeighbors[neighborIp] = {
      ...config,
      state,
      upDownTime: state === 'Established' ? '00:12:35' : 'never',
      prefixesReceived: prefixesCount,
    };
  }

  return updatedNeighbors;
}

// Compute BGP routing table entries
export function computeBgpRoutes(
  nodeId: string,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): BgpRoute[] {
  const node = nodes[nodeId];
  if (!node || !node.bgpEnabled || !node.bgpAsNumber) return [];

  const neighbors = computeBgpNeighbors(nodeId, nodes, links);
  const bgpRoutes: BgpRoute[] = [];

  // Local networks advertised
  for (const net of node.bgpNetworks) {
    bgpRoutes.push({
      prefix: `${net.network}/${net.prefix}`,
      nextHop: '0.0.0.0',
      metric: 0,
      locPrf: 100,
      weight: 32768,
      path: 'i',
      status: '*>',
    });
  }

  // Networks received from Established peers
  for (const [neighborIp, nConfig] of Object.entries(neighbors)) {
    if (nConfig.state !== 'Established') continue;

    // Find peer node
    let peerNode: NetworkNode | null = null;
    for (const other of Object.values(nodes)) {
      if (other.id === nodeId) continue;
      for (const intf of Object.values(other.interfaces)) {
        if (intf.ip && intf.up) {
          const p = parseIpv4Cidr(intf.ip);
          if (p && p.ip === neighborIp) {
            peerNode = other;
            break;
          }
        }
      }
      if (peerNode) break;
    }

    if (!peerNode) continue;

    const isIbgp = node.bgpAsNumber === nConfig.remoteAs;
    const path = isIbgp ? 'i' : `${nConfig.remoteAs} i`;

    // Next-hop calculation:
    // If peer has next-hop-self configured or peer's update-source/IP is used
    const nextHop = nConfig.nextHopSelf ? neighborIp : neighborIp;

    for (const net of peerNode.bgpNetworks) {
      bgpRoutes.push({
        prefix: `${net.network}/${net.prefix}`,
        nextHop: nextHop,
        metric: 0,
        locPrf: 100,
        weight: 0,
        path: path,
        status: isIbgp ? '*>i' : '*>',
      });
    }
  }

  return bgpRoutes;
}
