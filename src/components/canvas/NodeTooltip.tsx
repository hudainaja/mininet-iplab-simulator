'use client';

import React from 'react';
import { NetworkNode } from '../../engine/types';

interface NodeTooltipProps {
  node: NetworkNode;
}

export const NodeTooltip: React.FC<NodeTooltipProps> = ({ node }) => {
  const isCore = node.role === 'core';
  const interfaces = Object.values(node.interfaces || {});

  // Extract active feature badges
  const badges: string[] = [];
  if (node.ospfEnabled) badges.push('OSPF Area 0');
  if (node.bgpEnabled) badges.push(`iBGP AS ${node.bgpAsNumber || 65000}`);

  // Check for VLAN tags on interfaces
  const vlanTags = interfaces
    .filter(iface => iface.vlanTag !== undefined)
    .map(iface => `VLAN ${iface.vlanTag}`);
  if (vlanTags.length > 0) badges.push(vlanTags.join(', '));

  // Check for tunnels
  const hasTunnel = interfaces.some(iface => iface.isTunnel);
  if (hasTunnel) badges.push('6in4 SIT Tunnel');

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none">
      <div className="bg-white/98 backdrop-blur-md border border-slate-300 shadow-xl rounded-xl p-3 min-w-[210px] max-w-[260px] text-left text-xs text-slate-800 relative">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 mb-2">
          <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-sm">{node.name}</span>
            <span className="text-slate-400">•</span>
            <span className="text-[11px] font-medium text-slate-600">
              {node.type === 'router'
                ? isCore
                  ? `Core Router ${node.bgpAsNumber ? `[AS ${node.bgpAsNumber}]` : ''}`
                  : 'Edge Router'
                : node.type === 'switch'
                ? 'Open vSwitch'
                : 'Host PC'}
            </span>
          </div>
        </div>

        {/* Active Protocol / Feature Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {badges.map((b, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold font-mono"
              >
                {b}
              </span>
            ))}
          </div>
        )}

        {/* Interfaces & IP Addressing List */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {node.type === 'switch' ? 'Ports & VLANs:' : 'Interfaces & IPs:'}
          </div>
          <div className="max-h-28 overflow-y-auto space-y-0.5 font-mono text-[11px]">
            {interfaces.length === 0 ? (
              <span className="text-slate-400 italic">No interfaces</span>
            ) : (
              interfaces.map(iface => (
                <div key={iface.name} className="flex items-center justify-between text-slate-700 gap-1.5">
                  <span className="text-slate-500 font-medium shrink-0">{iface.name}:</span>
                  <span className="font-semibold text-slate-900 text-right truncate">
                    {iface.ip || iface.ipv6 || (iface.vlanTag ? `Tag ${iface.vlanTag}` : 'Trunk/Link')}
                  </span>
                </div>
              ))
            )}
            {node.defaultGateway && (
              <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100 mt-1">
                <span className="text-slate-400">GW:</span>
                <span className="font-semibold">{node.defaultGateway}</span>
              </div>
            )}
          </div>
        </div>

        {/* Downward triangle arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
      </div>
    </div>
  );
};
