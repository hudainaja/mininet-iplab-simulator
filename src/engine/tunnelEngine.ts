import { NetworkNode } from './types';

export function addSitTunnel(
  node: NetworkNode,
  tunnelName: string,
  localIp: string,
  remoteIp: string,
  ttl: number = 255
): { success: boolean; message: string } {
  if (node.interfaces[tunnelName]) {
    return { success: false, message: `RTNETLINK answers: File exists` };
  }

  node.interfaces[tunnelName] = {
    name: tunnelName,
    mac: '00:00:00:00:00:00',
    up: false, // starts down until ip link set <tun> up
    isTunnel: true,
    tunnelConfig: {
      mode: 'sit',
      local: localIp,
      remote: remoteIp,
      ttl: ttl,
    },
  };

  return { success: true, message: '' };
}

export function formatTunnelShow(node: NetworkNode): string {
  const lines: string[] = [];
  lines.push(`sit0: ipv6/ip remote any local any ttl 64 nopmtudisc 6rd-prefix 2002::/16`);

  for (const [name, intf] of Object.entries(node.interfaces)) {
    if (intf.isTunnel && intf.tunnelConfig) {
      lines.push(
        `${name}: ipv6/ip remote ${intf.tunnelConfig.remote} local ${intf.tunnelConfig.local} ttl ${intf.tunnelConfig.ttl} 6rd-prefix 2002::/16`
      );
    }
  }

  return lines.join('\n');
}
