import { NetworkNode } from './types';

export interface VlanPortInfo {
  portName: string;
  tag?: number;
  type: 'access' | 'trunk';
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
    if (intf.vlanTag) {
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
  return true;
}

export function removeSwitchPortVlan(node: NetworkNode, portName: string): boolean {
  if (node.type !== 'switch') return false;
  if (!node.interfaces[portName]) return false;
  delete node.interfaces[portName].vlanTag;
  return true;
}

export function canSwitchForward(node: NetworkNode, inPortName: string, outPortName: string): boolean {
  if (node.type !== 'switch') return false;
  const inPort = node.interfaces[inPortName];
  const outPort = node.interfaces[outPortName];
  if (!inPort || !outPort) return false;

  const inTag = inPort.vlanTag || 1;
  const outTag = outPort.vlanTag || 1;

  return inTag === outTag;
}
