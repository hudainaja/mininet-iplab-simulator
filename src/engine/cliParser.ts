import { NetworkNode, NetworkLink } from './types';
import { parseIpv4Cidr, parseIpv6Cidr, netmaskToPrefix } from './ipUtils';
import { computeOspfNeighbors, computeOspfRoutes, getRouterId } from './ospfEngine';
import { computeBgpNeighbors, computeBgpRoutes, getBgpRouterId } from './bgpEngine';
import { parseOvsShow, setSwitchPortVlan, removeSwitchPortVlan } from './vlanEngine';
import { addSitTunnel, formatTunnelShow } from './tunnelEngine';
import { simulatePing, simulateTraceroute } from './packetSimulator';

export interface CliExecutionResult {
  output: string;
  type?: 'output' | 'error' | 'success' | 'info' | 'system';
  clear?: boolean;
}

export function getPrompt(node: NetworkNode): string {
  if (node.type === 'host') {
    return `root@${node.name}:~# `;
  }
  if (node.type === 'switch') {
    return `${node.name}# `;
  }
  // Router
  switch (node.cliMode) {
    case 'exec':
      return `${node.name}> `;
    case 'priv':
      return `${node.name}# `;
    case 'config':
      return `${node.name}(config)# `;
    case 'config-if':
      return `${node.name}(config-if)# `;
    case 'config-router-ospf':
    case 'config-router-bgp':
      return `${node.name}(config-router)# `;
    default:
      return `${node.name}# `;
  }
}

export function executeCommand(
  rawCommand: string,
  nodeId: string,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): CliExecutionResult {
  const node = nodes[nodeId];
  if (!node) return { output: 'Node not found', type: 'error' };

  const trimmed = rawCommand.trim();
  if (!trimmed) return { output: '' };

  node.commandHistory.push(trimmed);

  // Router CLI
  if (node.type === 'router') {
    return handleRouterCommand(trimmed, node, nodes, links);
  }

  // Switch CLI (Open vSwitch)
  if (node.type === 'switch') {
    return handleSwitchCommand(trimmed, node, nodes, links);
  }

  // Host CLI (Linux)
  return handleHostCommand(trimmed, node, nodes, links);
}

// -------------------------------------------------------------
// ROUTER CLI HANDLER (FRRouting vtysh style)
// -------------------------------------------------------------
function handleRouterCommand(
  cmd: string,
  node: NetworkNode,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): CliExecutionResult {
  const parts = cmd.split(/\s+/);
  const verb = parts[0].toLowerCase();

  // Handle 'do <cmd>' in config modes
  if (verb === 'do') {
    const doCmd = parts.slice(1).join(' ');
    const originalMode = node.cliMode;
    node.cliMode = 'priv';
    const res = handleRouterCommand(doCmd, node, nodes, links);
    node.cliMode = originalMode;
    return res;
  }

  // Clear screen
  if (verb === 'clear' && parts.length === 1) {
    return { output: '', clear: true };
  }

  // Mode navigation
  if (verb === 'enable') {
    node.cliMode = 'priv';
    return { output: '' };
  }
  if (verb === 'disable') {
    node.cliMode = 'exec';
    return { output: '' };
  }
  if (cmd.match(/^conf(igure)?(\s+t(erminal)?)?$/i)) {
    if (node.cliMode === 'exec') return { output: '% Command not authorized in User EXEC mode', type: 'error' };
    node.cliMode = 'config';
    return { output: '' };
  }
  if (verb === 'exit') {
    if (node.cliMode === 'config-if' || node.cliMode === 'config-router-ospf' || node.cliMode === 'config-router-bgp') {
      node.cliMode = 'config';
      return { output: '' };
    }
    if (node.cliMode === 'config') {
      node.cliMode = 'priv';
      return { output: '' };
    }
    if (node.cliMode === 'priv') {
      node.cliMode = 'exec';
      return { output: '' };
    }
    return { output: '' };
  }
  if (verb === 'end') {
    node.cliMode = 'priv';
    return { output: '' };
  }

  // Interface Selection: `interface <name>` / `int <name>`
  if ((verb === 'interface' || verb === 'int') && parts.length >= 2) {
    if (node.cliMode !== 'config') {
      return { output: '% Command incomplete or invalid in this mode', type: 'error' };
    }
    let intfName = parts[1];
    // Normalize interface name, e.g. "eth1" -> "r1-eth1" if needed
    if (!node.interfaces[intfName]) {
      const match = Object.keys(node.interfaces).find(k => k.endsWith(intfName) || k === intfName);
      if (match) intfName = match;
      else {
        // Create interface dynamically if doesn't exist
        node.interfaces[intfName] = {
          name: intfName,
          mac: `00:00:00:${Math.floor(Math.random()*90+10)}:${Math.floor(Math.random()*90+10)}:01`,
          up: true,
          ospfCost: 10
        };
      }
    }
    node.selectedInterface = intfName;
    node.cliMode = 'config-if';
    return { output: '' };
  }

  // Interface Configuration Mode
  if (node.cliMode === 'config-if' && node.selectedInterface) {
    const intf = node.interfaces[node.selectedInterface];

    // `ip address <ip>/<prefix>` or `ip address <ip> <netmask>`
    if (cmd.match(/^ip\s+addr(ess)?/i)) {
      if (parts.length >= 3) {
        let ipCidr = parts[2];
        if (parts.length >= 4 && !ipCidr.includes('/')) {
          const prefix = netmaskToPrefix(parts[3]);
          ipCidr = `${parts[2]}/${prefix}`;
        }
        const parsed = parseIpv4Cidr(ipCidr);
        if (parsed) {
          intf.ip = ipCidr;
          return { output: '', type: 'success' };
        } else {
          return { output: '% Malformed IPv4 address/prefix', type: 'error' };
        }
      }
    }

    // `ipv6 address <ip>/<prefix>`
    if (cmd.match(/^ipv6\s+addr(ess)?/i) && parts.length >= 3) {
      const parsed = parseIpv6Cidr(parts[2]);
      if (parsed) {
        intf.ipv6 = parts[2];
        return { output: '', type: 'success' };
      }
      return { output: '% Malformed IPv6 address/prefix', type: 'error' };
    }

    // `no ip address`
    if (cmd.match(/^no\s+ip\s+addr(ess)?/i)) {
      delete intf.ip;
      return { output: '' };
    }

    // `no shutdown` / `shutdown`
    if (cmd.match(/^no\s+shut(down)?/i)) {
      intf.up = true;
      return { output: `% Interface ${node.selectedInterface} state changed to UP` };
    }
    if (cmd.match(/^shut(down)?/i)) {
      intf.up = false;
      return { output: `% Interface ${node.selectedInterface} state changed to DOWN` };
    }

    // `ip ospf cost <cost>`
    if (cmd.match(/^ip\s+ospf\s+cost/i) && parts.length >= 4) {
      const cost = parseInt(parts[3], 10);
      if (!isNaN(cost) && cost > 0) {
        intf.ospfCost = cost;
        return { output: '' };
      }
      return { output: '% Invalid OSPF cost', type: 'error' };
    }
  }

  // Router OSPF command: `router ospf`
  if (cmd.match(/^router\s+ospf/i)) {
    if (node.cliMode !== 'config') return { output: '% Configure terminal first', type: 'error' };
    node.ospfEnabled = true;
    node.cliMode = 'config-router-ospf';
    return { output: '' };
  }

  // OSPF Configuration Mode
  if (node.cliMode === 'config-router-ospf') {
    // `ospf router-id <id>`
    if (cmd.match(/^ospf\s+router-id/i) && parts.length >= 3) {
      node.ospfRouterId = parts[2];
      return { output: '' };
    }

    // `network <net>/<prefix> area <area>` or `network <ip> <wildcard> area <area>`
    if (cmd.match(/^network/i)) {
      const areaIdx = parts.findIndex(p => p.toLowerCase() === 'area');
      if (areaIdx >= 2 && areaIdx + 1 < parts.length) {
        const areaNum = parseInt(parts[areaIdx + 1], 10);
        let netCidr = parts[1];
        if (!netCidr.includes('/') && areaIdx === 3) {
          // Wildcard mask e.g. 0.0.0.3 -> prefix 30
          const wildcard = parts[2].split('.').map(Number);
          const mask = wildcard.map(w => 255 - w).join('.');
          const prefix = netmaskToPrefix(mask);
          netCidr = `${parts[1]}/${prefix}`;
        }
        const parsed = parseIpv4Cidr(netCidr);
        if (parsed) {
          node.ospfNetworks.push({ network: parsed.network, prefix: parsed.prefix, area: areaNum });
          return { output: '' };
        }
      }
      return { output: '% Incomplete or malformed network command', type: 'error' };
    }

    // `no network ...`
    if (cmd.match(/^no\s+network/i)) {
      node.ospfNetworks = [];
      return { output: '' };
    }
  }

  // Router BGP command: `router bgp <asn>`
  if (cmd.match(/^router\s+bgp/i) && parts.length >= 3) {
    if (node.cliMode !== 'config') return { output: '% Configure terminal first', type: 'error' };
    const asn = parseInt(parts[2], 10);
    if (isNaN(asn)) return { output: '% Invalid AS number', type: 'error' };
    node.bgpEnabled = true;
    node.bgpAsNumber = asn;
    node.cliMode = 'config-router-bgp';
    return { output: '' };
  }

  // BGP Configuration Mode
  if (node.cliMode === 'config-router-bgp') {
    // `bgp router-id <id>`
    if (cmd.match(/^bgp\s+router-id/i) && parts.length >= 3) {
      node.bgpRouterId = parts[2];
      return { output: '' };
    }

    // `neighbor <ip> remote-as <asn>`
    if (cmd.match(/^neighbor\s+[\d\.]+\s+remote-as/i) && parts.length >= 4) {
      const ip = parts[1];
      const remoteAs = parseInt(parts[3], 10);
      if (!node.bgpNeighbors[ip]) {
        node.bgpNeighbors[ip] = { ip, remoteAs, state: 'Active' };
      } else {
        node.bgpNeighbors[ip].remoteAs = remoteAs;
      }
      return { output: '' };
    }

    // `neighbor <ip> update-source <intf>`
    if (cmd.match(/^neighbor\s+[\d\.]+\s+update-source/i) && parts.length >= 4) {
      const ip = parts[1];
      const sourceIntf = parts[3];
      if (node.bgpNeighbors[ip]) {
        node.bgpNeighbors[ip].updateSource = sourceIntf;
      }
      return { output: '' };
    }

    // `neighbor <ip> next-hop-self`
    if (cmd.match(/^neighbor\s+[\d\.]+\s+next-hop-self/i)) {
      const ip = parts[1];
      if (node.bgpNeighbors[ip]) {
        node.bgpNeighbors[ip].nextHopSelf = true;
      }
      return { output: '' };
    }

    // `network <net>/<prefix>` or `network <ip> mask <netmask>`
    if (cmd.match(/^network/i)) {
      let netCidr = parts[1];
      if (parts.length >= 4 && parts[2].toLowerCase() === 'mask') {
        const prefix = netmaskToPrefix(parts[3]);
        netCidr = `${parts[1]}/${prefix}`;
      }
      const parsed = parseIpv4Cidr(netCidr);
      if (parsed) {
        node.bgpNetworks.push({ network: parsed.network, prefix: parsed.prefix });
        return { output: '' };
      }
      return { output: '% Malformed network command', type: 'error' };
    }
  }

  // Static Routing: `ip route <dest>/<prefix> <next_hop>` or `ip route <dest> <mask> <next_hop>`
  if (cmd.match(/^ip\s+route/i) && parts.length >= 4) {
    let destCidr = parts[2];
    let nextHop = parts[3];
    if (parts.length >= 5 && !destCidr.includes('/')) {
      const prefix = netmaskToPrefix(parts[3]);
      destCidr = `${parts[2]}/${prefix}`;
      nextHop = parts[4];
    }
    const parsed = parseIpv4Cidr(destCidr);
    if (parsed) {
      node.staticRoutes.push({ destination: parsed.network, prefix: parsed.prefix, nextHop });
      return { output: '' };
    }
    return { output: '% Invalid IP route syntax', type: 'error' };
  }

  // SHOW COMMANDS
  if (verb === 'show' || verb === 'sh') {
    const sub = parts.slice(1).join(' ').toLowerCase();

    // `show ip interface brief` / `show int br` / `show interface brief`
    if (sub.includes('int') && sub.includes('br')) {
      return { output: formatShowInterfaceBrief(node) };
    }
    if (sub === 'interface' || sub === 'int') {
      return { output: formatShowInterfaceBrief(node) };
    }

    // `show ip ospf neighbor`
    if (sub.includes('ospf') && sub.includes('neigh')) {
      return { output: formatShowOspfNeighbors(node, nodes, links) };
    }

    // `show ip route ospf`
    if (sub.includes('route') && sub.includes('ospf')) {
      return { output: formatShowIpRoute(node, nodes, links, 'ospf') };
    }

    // `show ip route`
    if (sub.includes('route')) {
      return { output: formatShowIpRoute(node, nodes, links) };
    }

    // `show ip bgp summary`
    if (sub.includes('bgp') && sub.includes('sum')) {
      return { output: formatShowBgpSummary(node, nodes, links) };
    }

    // `show ip bgp`
    if (sub.includes('bgp')) {
      return { output: formatShowBgp(node, nodes, links) };
    }

    // `show running-config` / `show run`
    if (sub.includes('run')) {
      return { output: formatShowRunningConfig(node) };
    }
  }

  // Ping & Traceroute
  if (verb === 'ping' && parts.length >= 2) {
    return handlePingCommand(parts[1], false, node, nodes, links);
  }
  if (verb === 'ping6' && parts.length >= 2) {
    return handlePingCommand(parts[1], true, node, nodes, links);
  }
  if (verb === 'traceroute' && parts.length >= 2) {
    return handleTracerouteCommand(parts[1], node, nodes, links);
  }

  // Write memory
  if (cmd.match(/^wr(ite)?(\s+m(emory)?)?$/i)) {
    return { output: '[OK] Configuration saved to /etc/frr/frr.conf' };
  }

  // Help
  if (cmd === '?' || cmd === 'help') {
    return { output: formatRouterHelp(node.cliMode) };
  }

  return { output: `% Unknown command: "${cmd}". Type '?' or 'help' for options.`, type: 'error' };
}

// -------------------------------------------------------------
// SWITCH CLI HANDLER (Open vSwitch)
// -------------------------------------------------------------
function handleSwitchCommand(
  cmd: string,
  node: NetworkNode,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): CliExecutionResult {
  const parts = cmd.split(/\s+/);
  const verb = parts[0].toLowerCase();

  if (verb === 'clear') return { output: '', clear: true };

  // `ovs-vsctl show`
  if (cmd.match(/^ovs-vsctl\s+show/i)) {
    return { output: parseOvsShow(node) };
  }

  // `ovs-vsctl set port <port> tag=<id>`
  if (cmd.match(/^ovs-vsctl\s+set\s+port/i)) {
    const portName = parts[3];
    const tagArg = parts[4];
    if (portName && tagArg && tagArg.startsWith('tag=')) {
      const tag = parseInt(tagArg.replace('tag=', ''), 10);
      if (!isNaN(tag)) {
        const ok = setSwitchPortVlan(node, portName, tag);
        if (ok) return { output: '', type: 'success' };
        return { output: `ovs-vsctl: no port named ${portName}`, type: 'error' };
      }
    }
    return { output: 'ovs-vsctl: invalid arguments for set port', type: 'error' };
  }

  // `ovs-vsctl remove port <port> tag <id>`
  if (cmd.match(/^ovs-vsctl\s+remove\s+port/i)) {
    const portName = parts[3];
    removeSwitchPortVlan(node, portName);
    return { output: '' };
  }

  // `ovs-ofctl dump-flows <bridge>`
  if (cmd.match(/^ovs-ofctl\s+dump-flows/i)) {
    return {
      output: `NXST_FLOW reply (xid=0x4):
 cookie=0x0, duration=234.12s, table=0, n_packets=82, n_bytes=6888, actions=NORMAL`
    };
  }

  // `show interface` / `ifconfig`
  if (cmd.match(/^show\s+int/i) || cmd === 'ifconfig') {
    return { output: formatShowInterfaceBrief(node) };
  }

  if (cmd === 'help' || cmd === '?') {
    return {
      output: `Open vSwitch Commands:
  ovs-vsctl show                           - Show OVS bridges and ports
  ovs-vsctl set port <port> tag=<vlan_id>   - Set VLAN tag on port (e.g. s1-eth2 tag=10)
  ovs-vsctl remove port <port> tag <id>    - Remove VLAN tag from port
  ovs-ofctl dump-flows <bridge>            - Dump OpenFlow table flows
  show interface                           - View port states and tags
  clear                                    - Clear screen`
    };
  }

  return { output: `${verb}: command not found. Type 'help' for available commands.`, type: 'error' };
}

// -------------------------------------------------------------
// HOST CLI HANDLER (Linux Bash)
// -------------------------------------------------------------
function handleHostCommand(
  cmd: string,
  node: NetworkNode,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): CliExecutionResult {
  const parts = cmd.split(/\s+/);
  const verb = parts[0].toLowerCase();

  if (verb === 'clear') return { output: '', clear: true };

  // `ip addr add <ip>/<prefix> dev <intf>`
  if (cmd.match(/^ip\s+(addr|a)\s+add/i)) {
    const ipCidr = parts[3];
    const devIdx = parts.indexOf('dev');
    const devName = devIdx !== -1 ? parts[devIdx + 1] : Object.keys(node.interfaces)[0];

    if (ipCidr.includes(':')) {
      // IPv6
      const parsed = parseIpv6Cidr(ipCidr);
      if (parsed && node.interfaces[devName]) {
        node.interfaces[devName].ipv6 = ipCidr;
        return { output: '' };
      }
    } else {
      // IPv4
      const parsed = parseIpv4Cidr(ipCidr);
      if (parsed && node.interfaces[devName]) {
        node.interfaces[devName].ip = ipCidr;
        return { output: '' };
      }
    }
    return { output: `RTNETLINK answers: Invalid argument`, type: 'error' };
  }

  // `ip -6 addr add <ip>/<prefix> dev <intf>`
  if (cmd.match(/^ip\s+-6\s+(addr|a)\s+add/i)) {
    const ipCidr = parts[4];
    const devIdx = parts.indexOf('dev');
    const devName = devIdx !== -1 ? parts[devIdx + 1] : Object.keys(node.interfaces)[0];
    const parsed = parseIpv6Cidr(ipCidr);
    if (parsed && node.interfaces[devName]) {
      node.interfaces[devName].ipv6 = ipCidr;
      return { output: '' };
    }
    return { output: `RTNETLINK answers: Invalid argument`, type: 'error' };
  }

  // `ip link set <intf> up/down`
  if (cmd.match(/^ip\s+link\s+set/i)) {
    const dev = parts[3];
    const action = parts[4];
    if (node.interfaces[dev]) {
      node.interfaces[dev].up = action === 'up';
      return { output: '' };
    }
    return { output: `Cannot find device "${dev}"`, type: 'error' };
  }

  // `ip route add default via <ip>`
  if (cmd.match(/^ip\s+route\s+add\s+default\s+via/i)) {
    node.defaultGateway = parts[4];
    return { output: '' };
  }

  // `ip route add <dest>/<prefix> via <next_hop>`
  if (cmd.match(/^ip\s+route\s+add\s+[\d\.]+\/\d+\s+via/i)) {
    const p = parseIpv4Cidr(parts[3]);
    if (p) {
      node.staticRoutes.push({ destination: p.network, prefix: p.prefix, nextHop: parts[5] });
      return { output: '' };
    }
  }

  // `ip -6 route add <ipv6_prefix> dev <tun_name>` / `ip route add <ipv6_prefix> dev <tun_name>`
  if (cmd.match(/^(ip\s+-6\s+route\s+add|ip\s+route\s+add)\s+[0-9a-fA-F:]+\/\d+\s+dev/i)) {
    const destIpv6 = parts[cmd.includes('-6') ? 4 : 3];
    const devIdx = parts.indexOf('dev');
    const devName = devIdx !== -1 ? parts[devIdx + 1] : '';
    const parsed = parseIpv6Cidr(destIpv6);
    if (parsed && node.interfaces[devName]) {
      node.ipv6Routes.push({ destination: parsed.ip, prefix: parsed.prefix, interfaceName: devName });
      return { output: '' };
    }
    return { output: `RTNETLINK answers: No such device or route`, type: 'error' };
  }

  // `ip tunnel add <tun_name> mode sit remote <remote_ip> local <local_ip> ttl 255`
  if (cmd.match(/^ip\s+tunnel\s+add/i)) {
    const tunName = parts[3];
    const modeIdx = parts.indexOf('mode');
    const remoteIdx = parts.indexOf('remote');
    const localIdx = parts.indexOf('local');
    const ttlIdx = parts.indexOf('ttl');

    const remoteIp = remoteIdx !== -1 ? parts[remoteIdx + 1] : '';
    const localIp = localIdx !== -1 ? parts[localIdx + 1] : '';
    const ttl = ttlIdx !== -1 ? parseInt(parts[ttlIdx + 1], 10) : 255;

    if (tunName && remoteIp && localIp) {
      const res = addSitTunnel(node, tunName, localIp, remoteIp, ttl);
      return { output: res.message, type: res.success ? 'success' : 'error' };
    }
    return { output: 'ip tunnel: invalid arguments', type: 'error' };
  }

  // `ip tunnel show`
  if (cmd.match(/^ip\s+tunnel\s+show/i)) {
    return { output: formatTunnelShow(node) };
  }

  // `ip addr show` / `ip a` / `ifconfig`
  if (cmd.match(/^ip\s+(addr|a)/i) || cmd === 'ifconfig') {
    return { output: formatHostIpAddrShow(node) };
  }

  // `ip route show` / `ip r` / `route -n`
  if (cmd.match(/^ip\s+(route|r)/i) || cmd.match(/^route/i)) {
    return { output: formatHostIpRouteShow(node) };
  }

  // `ip -6 addr show`
  if (cmd.match(/^ip\s+-6\s+(addr|a)/i)) {
    return { output: formatHostIpv6AddrShow(node) };
  }

  // `ip -6 route show`
  if (cmd.match(/^ip\s+-6\s+(route|r)/i)) {
    return { output: formatHostIpv6RouteShow(node) };
  }

  // Ping & Traceroute
  if (verb === 'ping' && parts.length >= 2) {
    // support optional -c 4
    let target = parts[1];
    if (target === '-c' && parts.length >= 4) target = parts[3];
    return handlePingCommand(target, false, node, nodes, links);
  }
  if (verb === 'ping6' && parts.length >= 2) {
    let target = parts[1];
    if (target === '-c' && parts.length >= 4) target = parts[3];
    return handlePingCommand(target, true, node, nodes, links);
  }
  if (verb === 'traceroute' && parts.length >= 2) {
    return handleTracerouteCommand(parts[1], node, nodes, links);
  }

  if (verb === 'cat' || verb === 'ls' || verb === 'uname') {
    if (verb === 'uname') return { output: 'Linux ' + node.name + ' 5.15.0-89-generic #99-Ubuntu SMP' };
    if (verb === 'ls') return { output: 'lab_config.sh  notes.txt' };
    if (verb === 'cat') return { output: '# Mininet-IPLab host simulation active.' };
  }

  if (verb === 'help') {
    return {
      output: `Linux Host Commands:
  ip addr add <ip>/<prefix> dev <intf>                     - Configure IPv4 address
  ip -6 addr add <ipv6>/<prefix> dev <intf>                - Configure IPv6 address
  ip link set <intf> up                                   - Bring up interface
  ip route add default via <ip>                            - Set default gateway
  ip tunnel add <tun> mode sit remote <rem> local <loc>    - Create 6in4 SIT Tunnel
  ip route add <ipv6_prefix> dev <tun>                     - Route IPv6 prefix through tunnel
  ping <ip> / ping6 <ipv6>                                 - Test ICMP reachability
  traceroute <ip>                                          - Trace network hops
  ip addr show / ip route show / ip -6 route show          - Display network configurations`
    };
  }

  return { output: `bash: ${verb}: command not found. Type 'help' for options.`, type: 'error' };
}

// -------------------------------------------------------------
// PING & TRACEROUTE SIMULATION RUNNERS
// -------------------------------------------------------------
function handlePingCommand(
  target: string,
  isIpv6: boolean,
  node: NetworkNode,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): CliExecutionResult {
  const sim = simulatePing(node.id, target, isIpv6, nodes, links);

  if (!sim.success) {
    return {
      output: `PING ${target} (${target}) 56(84) bytes of data.\nFrom ${node.name}: ${sim.error || 'Destination Host Unreachable'}\n--- ${target} ping statistics ---\n4 packets transmitted, 0 received, 100% packet loss`,
      type: 'error'
    };
  }

  const lines: string[] = [
    `PING ${target} (${target}) 56(84) bytes of data.`,
    `64 bytes from ${target}: icmp_seq=1 ttl=64 time=${sim.rtt.toFixed(2)} ms`,
    `64 bytes from ${target}: icmp_seq=2 ttl=64 time=${(sim.rtt * 0.95).toFixed(2)} ms`,
    `64 bytes from ${target}: icmp_seq=3 ttl=64 time=${(sim.rtt * 1.02).toFixed(2)} ms`,
    `64 bytes from ${target}: icmp_seq=4 ttl=64 time=${(sim.rtt * 0.98).toFixed(2)} ms`,
    ``,
    `--- ${target} ping statistics ---`,
    `4 packets transmitted, 4 received, 0% packet loss, time 3004ms`,
    `rtt min/avg/max/mdev = ${(sim.rtt * 0.95).toFixed(2)}/${sim.rtt.toFixed(2)}/${(sim.rtt * 1.02).toFixed(2)}/0.04 ms`
  ];

  return { output: lines.join('\n'), type: 'success' };
}

function handleTracerouteCommand(
  target: string,
  node: NetworkNode,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): CliExecutionResult {
  const sim = simulateTraceroute(node.id, target, nodes, links);

  const lines: string[] = [
    `traceroute to ${target} (${target}), 30 hops max, 60 byte packets`
  ];

  if (sim.hops.length <= 1) {
    lines.push(` 1  ${target} (${target})  0.214 ms  0.198 ms  0.185 ms`);
    return { output: lines.join('\n'), type: 'success' };
  }

  for (let i = 1; i < sim.hops.length; i++) {
    const hop = sim.hops[i];
    const ms = hop.rtt.toFixed(3);
    lines.push(` ${i}  ${hop.nodeName} (${hop.ip})  ${ms} ms  ${ms} ms  ${ms} ms`);
  }

  if (!sim.success) {
    lines.push(` ${sim.hops.length}  * * * Request timed out`);
  }

  return { output: lines.join('\n'), type: sim.success ? 'success' : 'error' };
}

// -------------------------------------------------------------
// OUTPUT FORMATTERS
// -------------------------------------------------------------
function formatShowInterfaceBrief(node: NetworkNode): string {
  const lines: string[] = [
    'Interface       IP-Address      OK? Method Status                Protocol',
  ];

  for (const [name, intf] of Object.entries(node.interfaces)) {
    const ip = intf.ip ? intf.ip.split('/')[0] : 'unassigned';
    const status = intf.up ? 'up' : 'administratively down';
    const proto = intf.up ? 'up' : 'down';
    lines.push(
      `${name.padEnd(16)} ${ip.padEnd(15)} YES manual ${status.padEnd(21)} ${proto}`
    );
  }

  return lines.join('\n');
}

function formatShowOspfNeighbors(
  node: NetworkNode,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): string {
  const neighbors = computeOspfNeighbors(node.id, nodes, links);
  if (neighbors.length === 0) {
    return 'Neighbor ID     Pri State           Dead Time Address         Interface\n% No OSPF neighbors in FULL state yet';
  }

  const lines: string[] = [
    'Neighbor ID     Pri State           Dead Time Address         Interface'
  ];

  for (const n of neighbors) {
    lines.push(
      `${n.neighborId.padEnd(16)}${n.priority.toString().padEnd(4)}${n.state.padEnd(16)}${n.deadTime.padEnd(10)}${n.address.padEnd(16)}${n.interfaceName}`
    );
  }

  return lines.join('\n');
}

function formatShowIpRoute(
  node: NetworkNode,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[],
  filter?: 'ospf' | 'bgp'
): string {
  const lines: string[] = [
    'Codes: K - kernel, C - connected, S - static, R - RIP, O - OSPF,',
    '       I - IS-IS, B - BGP, E - EIGRP, N - NHRP, T - Table, v - VNC',
    ''
  ];

  // Connected routes
  if (!filter) {
    for (const [intfName, intf] of Object.entries(node.interfaces)) {
      if (intf.ip && intf.up) {
        const p = parseIpv4Cidr(intf.ip);
        if (p) {
          lines.push(`C>* ${p.network}/${p.prefix} is directly connected, ${intfName}`);
        }
      }
    }
    // Static routes
    for (const s of node.staticRoutes) {
      lines.push(`S>* ${s.destination}/${s.prefix} [1/0] via ${s.nextHop}`);
    }
  }

  // OSPF routes
  if (!filter || filter === 'ospf') {
    const ospfRoutes = computeOspfRoutes(node.id, nodes, links);
    for (const o of ospfRoutes) {
      lines.push(`O>* ${o.destination}/${o.prefix} [110/${o.metric || 10}] via ${o.nextHop}, ${o.interfaceName}`);
    }
  }

  // BGP routes
  if (!filter || filter === 'bgp') {
    const bgpRoutes = computeBgpRoutes(node.id, nodes, links);
    for (const b of bgpRoutes) {
      lines.push(`B>* ${b.prefix} [200/${b.metric}] via ${b.nextHop}`);
    }
  }

  return lines.join('\n');
}

function formatShowBgpSummary(
  node: NetworkNode,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): string {
  const routerId = getBgpRouterId(node);
  const asn = node.bgpAsNumber || 65000;
  const neighbors = computeBgpNeighbors(node.id, nodes, links);

  const lines: string[] = [
    `BGP router identifier ${routerId}, local AS number ${asn} vrf-id 0`,
    `BGP table version 3`,
    `RIB entries 5, using 960 bytes of memory`,
    `Peers ${Object.keys(neighbors).length}, using ${Object.keys(neighbors).length * 21} KiB of memory`,
    ``,
    `Neighbor        V         AS   MsgRcvd   MsgSent   TblVer  InQ OutQ  Up/Down State/PfxRcd`,
  ];

  if (Object.keys(neighbors).length === 0) {
    lines.push(`% No BGP neighbors configured`);
    return lines.join('\n');
  }

  for (const [ip, n] of Object.entries(neighbors)) {
    const stateStr = n.state === 'Established' ? (n.prefixesReceived?.toString() || '0') : n.state;
    lines.push(
      `${ip.padEnd(16)}4 ${n.remoteAs.toString().padStart(10)}        24        26        0    0    0 ${n.upDownTime || 'never'} ${stateStr}`
    );
  }

  return lines.join('\n');
}

function formatShowBgp(
  node: NetworkNode,
  nodes: Record<string, NetworkNode>,
  links: NetworkLink[]
): string {
  const routerId = getBgpRouterId(node);
  const asn = node.bgpAsNumber || 65000;
  const routes = computeBgpRoutes(node.id, nodes, links);

  const lines: string[] = [
    `BGP table version is 2, local router ID is ${routerId}`,
    `Status codes: s suppressed, d damped, h history, * valid, > best, = multipath,`,
    `              i internal, r RIB-failure, S Stale, R Removed`,
    `Origin codes: i - IGP, e - EGP, ? - incomplete`,
    ``,
    `   Network          Next Hop            Metric LocPrf Weight Path`,
  ];

  for (const r of routes) {
    lines.push(
      `${r.status.padEnd(3)} ${r.prefix.padEnd(16)} ${r.nextHop.padEnd(19)} ${r.metric.toString().padStart(6)} ${r.locPrf.toString().padStart(6)} ${r.weight.toString().padStart(6)} ${r.path}`
    );
  }

  return lines.join('\n');
}

function formatShowRunningConfig(node: NetworkNode): string {
  const lines: string[] = [
    `! Current configuration on ${node.name}:`,
    `! FRRouting Configuration Version 8.1`,
    `frr version 8.1`,
    `frr defaults traditional`,
    `hostname ${node.name}`,
    `!`
  ];

  for (const [name, intf] of Object.entries(node.interfaces)) {
    lines.push(`interface ${name}`);
    if (intf.ip) lines.push(` ip address ${intf.ip}`);
    if (intf.ipv6) lines.push(` ipv6 address ${intf.ipv6}`);
    if (intf.ospfCost) lines.push(` ip ospf cost ${intf.ospfCost}`);
    if (!intf.up) lines.push(` shutdown`);
    lines.push(`!`);
  }

  if (node.ospfEnabled) {
    lines.push(`router ospf`);
    if (node.ospfRouterId) lines.push(` ospf router-id ${node.ospfRouterId}`);
    for (const net of node.ospfNetworks) {
      lines.push(` network ${net.network}/${net.prefix} area ${net.area}`);
    }
    lines.push(`!`);
  }

  if (node.bgpEnabled && node.bgpAsNumber) {
    lines.push(`router bgp ${node.bgpAsNumber}`);
    if (node.bgpRouterId) lines.push(` bgp router-id ${node.bgpRouterId}`);
    for (const [ip, n] of Object.entries(node.bgpNeighbors)) {
      lines.push(` neighbor ${ip} remote-as ${n.remoteAs}`);
      if (n.updateSource) lines.push(` neighbor ${ip} update-source ${n.updateSource}`);
      if (n.nextHopSelf) lines.push(` neighbor ${ip} next-hop-self`);
    }
    for (const net of node.bgpNetworks) {
      lines.push(` network ${net.network}/${net.prefix}`);
    }
    lines.push(`!`);
  }

  for (const s of node.staticRoutes) {
    lines.push(`ip route ${s.destination}/${s.prefix} ${s.nextHop}`);
  }

  lines.push(`end`);
  return lines.join('\n');
}

function formatHostIpAddrShow(node: NetworkNode): string {
  const lines: string[] = [];
  let idx = 1;
  for (const [name, intf] of Object.entries(node.interfaces)) {
    const status = intf.up ? 'UP,LOWER_UP' : 'DOWN';
    lines.push(`${idx}: ${name}: <BROADCAST,MULTICAST,${status}> mtu 1500 qdisc noqueue state ${intf.up ? 'UP' : 'DOWN'}`);
    lines.push(`    link/ether ${intf.mac} brd ff:ff:ff:ff:ff:ff`);
    if (intf.ip) {
      lines.push(`    inet ${intf.ip} scope global ${name}`);
    }
    if (intf.ipv6) {
      lines.push(`    inet6 ${intf.ipv6} scope global`);
    }
    idx++;
  }
  return lines.join('\n');
}

function formatHostIpRouteShow(node: NetworkNode): string {
  const lines: string[] = [];
  if (node.defaultGateway) {
    lines.push(`default via ${node.defaultGateway} dev ${Object.keys(node.interfaces)[0] || 'eth0'}`);
  }
  for (const [name, intf] of Object.entries(node.interfaces)) {
    if (intf.ip && intf.up) {
      const p = parseIpv4Cidr(intf.ip);
      if (p) lines.push(`${p.network}/${p.prefix} dev ${name} proto kernel scope link src ${p.ip}`);
    }
  }
  for (const s of node.staticRoutes) {
    lines.push(`${s.destination}/${s.prefix} via ${s.nextHop}`);
  }
  return lines.join('\n');
}

function formatHostIpv6AddrShow(node: NetworkNode): string {
  const lines: string[] = [];
  for (const [name, intf] of Object.entries(node.interfaces)) {
    if (intf.ipv6) {
      lines.push(`${name}: inet6 ${intf.ipv6} scope global`);
    }
  }
  return lines.join('\n') || '% No IPv6 addresses configured';
}

function formatHostIpv6RouteShow(node: NetworkNode): string {
  const lines: string[] = [];
  for (const r of node.ipv6Routes) {
    lines.push(`${r.destination}/${r.prefix} dev ${r.interfaceName || 'sit1'} metric 1024`);
  }
  return lines.join('\n') || '% No IPv6 routes in table';
}

function formatRouterHelp(mode: string): string {
  return `FRRouting Commands for [${mode}]:
  enable / disable               - Enter/exit Privileged EXEC mode
  configure terminal (conf t)    - Enter Global Configuration mode
  interface <intf>               - Configure interface (e.g. eth1, lo)
  ip address <ip>/<prefix>       - Assign IPv4 address to interface
  no shutdown / shutdown         - Enable / disable interface
  router ospf                    - Enter OSPF configuration mode
    network <net>/<prefix> area 0- Advertise network in OSPF Area
    ospf router-id <id>          - Set OSPF Router ID
  router bgp <asn>               - Enter BGP configuration mode
    neighbor <ip> remote-as <asn>- Configure iBGP/eBGP neighbor
    neighbor <ip> update-source  - Set peering source interface
    neighbor <ip> next-hop-self  - Advertise local IP as next hop
  show ip ospf neighbor          - Check OSPF neighbor states (FULL/DR)
  show ip route [ospf|bgp]       - Check routing table
  show ip bgp summary            - Check iBGP peering state (Established)
  show interface brief           - View interface statuses and IPs
  ping <ip> / traceroute <ip>    - Test connectivity across topology
  do <command>                   - Execute EXEC command from config mode`;
}
