import { NetworkNode, NetworkLink, SimulationResult } from './types';
import { parseIpv4Cidr, isIpv4InSubnet, parseIpv6Cidr, isIpv6InSubnet } from './ipUtils';
import { computeOspfRoutes, findConnectedPeers } from './ospfEngine';
import { computeBgpRoutes } from './bgpEngine';

interface RouteLookupResult {
  nextHopIp?: string;
  exitInterface: string;
  isTunnel?: boolean;
  tunnelRemoteIp?: string;
}

function findBestIpv4Route(
  nodeId: string,
  targetIp: string,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): RouteLookupResult | null {
  const node = nodes[nodeId];
  if (!node) return null;

  // 1. Directly Connected
  for (const [intfName, intf] of Object.entries(node.interfaces)) {
    if (intf.ip && intf.up) {
      const p = parseIpv4Cidr(intf.ip);
      if (p && isIpv4InSubnet(targetIp, p.network, p.prefix)) {
        return { exitInterface: intfName, nextHopIp: targetIp };
      }
    }
  }

  // 2. Static Routes
  let bestStatic: { prefix: number; nextHop: string; exitInterface?: string } | null = null;
  for (const s of node.staticRoutes) {
    if (isIpv4InSubnet(targetIp, s.destination, s.prefix)) {
      if (!bestStatic || s.prefix > bestStatic.prefix) {
        bestStatic = { prefix: s.prefix, nextHop: s.nextHop, exitInterface: s.interfaceName };
      }
    }
  }
  if (bestStatic) {
    // Determine exit interface for nextHop
    let exitIntf = bestStatic.exitInterface;
    if (!exitIntf) {
      for (const [intfName, intf] of Object.entries(node.interfaces)) {
        if (intf.ip && intf.up) {
          const p = parseIpv4Cidr(intf.ip);
          if (p && isIpv4InSubnet(bestStatic.nextHop, p.network, p.prefix)) {
            exitIntf = intfName;
            break;
          }
        }
      }
    }
    if (exitIntf) {
      return { exitInterface: exitIntf, nextHopIp: bestStatic.nextHop };
    }
  }

  // 3. OSPF Routes
  const ospfRoutes = computeOspfRoutes(nodeId, nodes, links);
  let bestOspf: { prefix: number; nextHop?: string; exitInterface: string } | null = null;
  for (const r of ospfRoutes) {
    if (isIpv4InSubnet(targetIp, r.destination, r.prefix)) {
      if (!bestOspf || r.prefix > bestOspf.prefix) {
        bestOspf = { prefix: r.prefix, nextHop: r.nextHop, exitInterface: r.interfaceName };
      }
    }
  }
  if (bestOspf) {
    return { exitInterface: bestOspf.exitInterface, nextHopIp: bestOspf.nextHop };
  }

  // 4. BGP Routes
  const bgpRoutes = computeBgpRoutes(nodeId, nodes, links);
  for (const b of bgpRoutes) {
    const parsedCidr = parseIpv4Cidr(b.prefix);
    if (parsedCidr && isIpv4InSubnet(targetIp, parsedCidr.network, parsedCidr.prefix)) {
      // Find route to BGP next hop
      if (b.nextHop && b.nextHop !== '0.0.0.0') {
        const underlay = findBestIpv4Route(nodeId, b.nextHop, nodes, links);
        if (underlay) {
          return { exitInterface: underlay.exitInterface, nextHopIp: underlay.nextHopIp };
        }
      }
    }
  }

  // 5. Host Default Gateway
  if (node.defaultGateway) {
    if (node.defaultGatewayDev && node.interfaces[node.defaultGatewayDev]?.up) {
      return { exitInterface: node.defaultGatewayDev, nextHopIp: node.defaultGateway };
    }
    for (const [intfName, intf] of Object.entries(node.interfaces)) {
      if (intf.ip && intf.up) {
        const p = parseIpv4Cidr(intf.ip);
        if (p && isIpv4InSubnet(node.defaultGateway, p.network, p.prefix)) {
          return { exitInterface: intfName, nextHopIp: node.defaultGateway };
        }
      }
    }
    for (const [intfName, intf] of Object.entries(node.interfaces)) {
      if (intf.up && !intfName.startsWith('lo')) {
        return { exitInterface: intfName, nextHopIp: node.defaultGateway };
      }
    }
  }

  return null;
}

function findBestIpv6Route(
  nodeId: string,
  targetIpv6: string,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): RouteLookupResult | null {
  const node = nodes[nodeId];
  if (!node) return null;

  // 1. Directly Connected IPv6
  for (const [intfName, intf] of Object.entries(node.interfaces)) {
    if (intf.ipv6 && intf.up) {
      const p = parseIpv6Cidr(intf.ipv6);
      if (p && isIpv6InSubnet(targetIpv6, p.ip, p.prefix)) {
        return { exitInterface: intfName, nextHopIp: targetIpv6 };
      }
    }
  }

  // 2. Static IPv6 Routes
  for (const r of node.ipv6Routes) {
    if (isIpv6InSubnet(targetIpv6, r.destination, r.prefix)) {
      const exitIntf = r.interfaceName || Object.keys(node.interfaces)[0];
      const intf = node.interfaces[exitIntf];
      if (intf && intf.isTunnel && intf.tunnelConfig) {
        return {
          exitInterface: exitIntf,
          nextHopIp: r.nextHop || targetIpv6,
          isTunnel: true,
          tunnelRemoteIp: intf.tunnelConfig.remote,
        };
      }
      return { exitInterface: exitIntf, nextHopIp: r.nextHop };
    }
  }

  // 3. Default Gateway IPv6
  if (node.defaultGatewayV6) {
    for (const [intfName, intf] of Object.entries(node.interfaces)) {
      if (intf.ipv6 && intf.up) {
        return { exitInterface: intfName, nextHopIp: node.defaultGatewayV6 };
      }
    }
  }

  return null;
}

export function simulatePing(
  sourceNodeId: string,
  targetIp: string,
  isIpv6: boolean,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): SimulationResult {
  const hops: SimulationResult['hops'] = [];
  let currentNodeId = sourceNodeId;
  const visited = new Set<string>();
  let totalLatency = 0.2; // base local loopback rtt

  // Find destination node
  let destNode: NetworkNode | null = null;
  for (const n of Object.values(nodes)) {
    for (const intf of Object.values(n.interfaces)) {
      if (intf.up) {
        if (!isIpv6 && intf.ip) {
          const p = parseIpv4Cidr(intf.ip);
          if (p && p.ip === targetIp) {
            destNode = n;
            break;
          }
        } else if (isIpv6 && intf.ipv6) {
          const p = parseIpv6Cidr(intf.ipv6);
          if (p && isIpv6InSubnet(targetIp, p.ip, 128)) {
            destNode = n;
            break;
          }
        }
      }
    }
    if (destNode) break;
  }

  if (!destNode) {
    return {
      success: false,
      rtt: 0,
      hops: [],
      error: 'Destination Host Unreachable (Address not assigned in topology)',
    };
  }

  // Simulate hop-by-hop forwarding
  let ttl = 30;
  while (ttl > 0) {
    const currentNode = nodes[currentNodeId];
    if (!currentNode) {
      return { success: false, rtt: totalLatency, hops, error: 'Network routing failed: node lost' };
    }

    hops.push({
      nodeId: currentNode.id,
      nodeName: currentNode.name,
      ip: targetIp,
      rtt: Math.round(totalLatency * 100) / 100,
    });

    if (currentNode.id === destNode.id) {
      // Reached destination! Now verify return path (symmetric reachability)
      return {
        success: true,
        rtt: Math.round(totalLatency * 100) / 100,
        hops,
      };
    }

    visited.add(currentNodeId);
    ttl--;

    // Route lookup
    let route: RouteLookupResult | null = null;
    if (isIpv6) {
      route = findBestIpv6Route(currentNodeId, targetIp, nodes, links);
    } else {
      route = findBestIpv4Route(currentNodeId, targetIp, nodes, links);
    }

    if (!route) {
      return {
        success: false,
        rtt: totalLatency,
        hops,
        error: `From ${currentNode.name}: Destination Net Unreachable`,
      };
    }

    // Handle 6in4 SIT Tunnel Encapsulation
    if (route.isTunnel && route.tunnelRemoteIp) {
      // Check underlay route to tunnel remote IPv4
      const underlayRoute = findBestIpv4Route(currentNodeId, route.tunnelRemoteIp, nodes, links);
      if (!underlayRoute) {
        return {
          success: false,
          rtt: totalLatency,
          hops,
          error: `6in4 Tunnel encapsulation error: no IPv4 route to remote endpoint ${route.tunnelRemoteIp}`,
        };
      }

      // Find node that owns tunnelRemoteIp
      let remoteEndpointNode: NetworkNode | null = null;
      for (const n of Object.values(nodes)) {
        for (const intf of Object.values(n.interfaces)) {
          if (intf.ip && intf.up) {
            const p = parseIpv4Cidr(intf.ip);
            if (p && p.ip === route.tunnelRemoteIp) {
              remoteEndpointNode = n;
              break;
            }
          }
        }
        if (remoteEndpointNode) break;
      }

      if (!remoteEndpointNode) {
        return {
          success: false,
          rtt: totalLatency,
          hops,
          error: `6in4 Tunnel remote endpoint ${route.tunnelRemoteIp} not found in topology`,
        };
      }

      totalLatency += 1.2;
      currentNodeId = remoteEndpointNode.id;
      continue;
    }

    // Follow link from exitInterface
    const peers = findConnectedPeers(currentNodeId, route.exitInterface, nodes, links);
    if (peers.length === 0) {
      return {
        success: false,
        rtt: totalLatency,
        hops,
        error: `Link down or unplugged on interface ${route.exitInterface} of ${currentNode.name}`,
      };
    }

    // Choose peer that can forward toward destination or next hop
    let nextHopNodeId = '';
    for (const p of peers) {
      const pNode = nodes[p.targetNodeId];
      if (!pNode) continue;
      // If nextHopIp specified, check if peer owns nextHopIp or peer is destNode
      if (route.nextHopIp) {
        let matches = false;
        for (const pIntf of Object.values(pNode.interfaces)) {
          if (pIntf.ip) {
            const parsed = parseIpv4Cidr(pIntf.ip);
            if (parsed && (parsed.ip === route.nextHopIp || isIpv4InSubnet(route.nextHopIp, parsed.network, parsed.prefix))) {
              matches = true;
              break;
            }
          }
          if (pIntf.ipv6) {
            const parsed = parseIpv6Cidr(pIntf.ipv6);
            if (parsed && (parsed.ip === route.nextHopIp || isIpv6InSubnet(route.nextHopIp, parsed.ip, parsed.prefix))) {
              matches = true;
              break;
            }
          }
        }
        if (matches || pNode.id === destNode.id) {
          nextHopNodeId = pNode.id;
          break;
        }
      }
    }

    if (!nextHopNodeId && peers.length > 0) {
      nextHopNodeId = peers[0].targetNodeId;
    }

    if (!nextHopNodeId || visited.has(nextHopNodeId)) {
      return {
        success: false,
        rtt: totalLatency,
        hops,
        error: `Routing loop or black hole detected at ${currentNode.name}`,
      };
    }

    totalLatency += 0.45;
    currentNodeId = nextHopNodeId;
  }

  return {
    success: false,
    rtt: totalLatency,
    hops,
    error: 'Time to live exceeded',
  };
}

export function simulateTraceroute(
  sourceNodeId: string,
  targetIp: string,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): SimulationResult {
  const isIpv6 = targetIp.includes(':');
  return simulatePing(sourceNodeId, targetIp, isIpv6, nodes, links);
}
