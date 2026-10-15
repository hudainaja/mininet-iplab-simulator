import { NetworkNode } from './types';

export interface VlanPortInfo {
  portName: string;
  tag?: number;
  type: 'access' | 'trunk';
  trunks?: number[];
}

export function parseOvsShow(node: NetworkNode): string {
  if (node.type !== 'switch') return 'Error: Not a switch node.';

  const lines: string[] = [];
  lines.push(`d89c0201-3f1a-4d43-85dc-${node.id.padStart(12, '0')}`);
  lines.push(`    Bridge ${node.name}`);
  lines.push(`        Port ${node.name}`);
  lines.push(`            Interface ${node.name}`);
  lines.push(`                type: internal`);

  for (const [intfName, intf] of Object.entries(node.interfaces)) {
    lines.push(`        Port ${intfName}`);
    if (intf.vlanMode === 'trunk') {
      lines.push(`            vlan_mode: trunk`);
      if (intf.vlanTrunks && intf.vlanTrunks.length > 0) {
        lines.push(`            trunks: [${intf.vlanTrunks.join(', ')}]`);
      }
    } else if (intf.vlanTag) {
      lines.push(`            tag: ${intf.vlanTag}`);
    }
    lines.push(`            Interface ${intfName}`);
  }

  lines.push(`    ovs_version: "2.17.0"`);
  return lines.join('\n');
}

export function setSwitchPortVlan(node: NetworkNode, portName: string, tag: number): boolean {
  if (node.type !== 'switch') return false;
  if (!node.interfaces[portName]) return false;
  node.interfaces[portName].vlanTag = tag;
  node.interfaces[portName].vlanMode = 'access';
  return true;
}

export function setSwitchPortTrunk(node: NetworkNode, portName: string, trunks?: number[]): boolean {
  if (node.type !== 'switch') return false;
  if (!node.interfaces[portName]) return false;
  node.interfaces[portName].vlanMode = 'trunk';
  if (trunks && trunks.length > 0) {
    node.interfaces[portName].vlanTrunks = trunks;
  }
  return true;
}

export function removeSwitchPortVlan(node: NetworkNode, portName: string): boolean {
  if (node.type !== 'switch') return false;
  if (!node.interfaces[portName]) return false;
  delete node.interfaces[portName].vlanTag;
  delete node.interfaces[portName].vlanMode;
  delete node.interfaces[portName].vlanTrunks;
  return true;
}

export function canSwitchForward(node: NetworkNode, inPortName: string, outPortName: string): boolean {
  if (node.type !== 'switch') return false;
  const inPort = node.interfaces[inPortName];
  const outPort = node.interfaces[outPortName];
  if (!inPort || !outPort) return false;

  const inIsTrunk = inPort.vlanMode === 'trunk';
  const outIsTrunk = outPort.vlanMode === 'trunk';

  // Both are trunk ports: forward all traffic
  if (inIsTrunk && outIsTrunk) {
    return true;
  }

  // Trunk into Access: check if trunk allows the access port's tag
  if (inIsTrunk && !outIsTrunk) {
    const outTag = outPort.vlanTag || 1;
    if (inPort.vlanTrunks && inPort.vlanTrunks.length > 0) {
      return inPort.vlanTrunks.includes(outTag);
    }
    return true; // Trunk permits all if no specific trunks list
  }

  // Access into Trunk: check if trunk allows the access port's tag
  if (!inIsTrunk && outIsTrunk) {
    const inTag = inPort.vlanTag || 1;
    if (outPort.vlanTrunks && outPort.vlanTrunks.length > 0) {
      return outPort.vlanTrunks.includes(inTag);
    }
    return true;
  }

  // Both are Access ports (or untagged default VLAN 1)
  const inTag = inPort.vlanTag || 1;
  const outTag = outPort.vlanTag || 1;
  return inTag === outTag;
}
