export type NodeType = 'router' | 'switch' | 'host';
export type RouterRole = 'core' | 'edge' | 'standard';

export type CliMode = 
  | 'exec'               // r1>
  | 'priv'               // r1#
  | 'config'             // r1(config)#
  | 'config-if'          // r1(config-if)#
  | 'config-router-ospf' // r1(config-router)#
  | 'config-router-bgp'; // r1(config-router)#

export interface InterfaceConfig {
  name: string;
  ip?: string;         // e.g. "10.12.0.1/30"
  ipv6?: string;       // e.g. "2001:db8:1::1/64"
  mac: string;
  up: boolean;
  ospfCost?: number;   // default 10
  vlanTag?: number;    // Open vSwitch port tag e.g. 10
  isTunnel?: boolean;
  tunnelConfig?: {
    mode: 'sit';
    remote: string;
    local: string;
    ttl: number;
  };
}

export interface OspfNetwork {
  network: string; // e.g. "10.0.0.0"
  prefix: number;  // e.g. 24 or 30
  area: number;    // e.g. 0
}

export interface OspfNeighbor {
  neighborId: string;
  priority: number;
  state: 'Init' | '2-Way' | 'ExStart' | 'Exchange' | 'Loading' | 'Full/DR' | 'Full/BDR' | 'Full/DROther';
  deadTime: string;
  address: string;
  interfaceName: string;
}

export interface BgpNeighbor {
  ip: string;
  remoteAs: number;
  updateSource?: string;
  nextHopSelf?: boolean;
  state: 'Idle' | 'Connect' | 'Active' | 'OpenSent' | 'OpenConfirm' | 'Established';
  upDownTime?: string;
  prefixesReceived?: number;
}

export interface BgpRoute {
  prefix: string;
  nextHop: string;
  metric: number;
  locPrf: number;
  weight: number;
  path: string;
  status: '*>i' | '*>' | '*i' | '*';
}

export interface RouteEntry {
  type: 'C' | 'S' | 'O' | 'B';
  destination: string;
  prefix: number;
  nextHop?: string;
  interfaceName: string;
  metric?: number;
}

export interface Ipv6RouteEntry {
  destination: string;
  prefix: number;
  nextHop?: string;
  interfaceName: string;
  metric?: number;
}

export interface NetworkNode {
  id: string;
  name: string;
  type: NodeType;
  role?: RouterRole;
  position: { x: number; y: number };
  interfaces: Record<string, InterfaceConfig>;
  cliMode: CliMode;
  selectedInterface?: string;
  
  // OSPF
  ospfEnabled: boolean;
  ospfRouterId?: string;
  ospfNetworks: OspfNetwork[];
  
  // BGP
  bgpEnabled: boolean;
  bgpAsNumber?: number;
  bgpRouterId?: string;
  bgpNeighbors: Record<string, BgpNeighbor>;
  bgpNetworks: Array<{ network: string; prefix: number }>;

  // Static Routing
  staticRoutes: Array<{ destination: string; prefix: number; nextHop: string; interfaceName?: string }>;
  
  // IPv6
  ipv6Routes: Array<{ destination: string; prefix: number; nextHop?: string; interfaceName?: string }>;
  defaultGateway?: string;
  defaultGatewayV6?: string;

  // Terminal & Shell State
  commandHistory: string[];
  terminalBuffer: Array<{ text: string; type?: 'output' | 'error' | 'success' | 'info' | 'system' | 'banner' }>;
}

export interface NetworkLink {
  id: string;
  source: string;          // node id
  sourceHandle: string;    // interface name e.g. "eth1"
  target: string;          // node id
  targetHandle: string;    // interface name e.g. "eth1"
  status: 'up' | 'down';
  latency: number;
}

export interface SimulationResult {
  success: boolean;
  rtt: number;
  hops: Array<{
    nodeId: string;
    nodeName: string;
    ip: string;
    rtt: number;
    interfaceIn?: string;
    interfaceOut?: string;
  }>;
  error?: string;
  details?: string[];
}
