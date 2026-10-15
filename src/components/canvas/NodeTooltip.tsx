'use client';

import React from 'react';
import { NetworkNode } from '../../engine/types';
import { useNetworkStore } from '../../store/useNetworkStore';

interface NodeTooltipProps {
  node: NetworkNode;
}

export const NodeTooltip = React.memo<NodeTooltipProps>(({ node }) => {
  const isDarkMode = useNetworkStore(state => state.isDarkMode);
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
    <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 pointer-events-none z-[99999] opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none">
      <div
        className={`p-3 rounded-lg shadow-2xl border text-xs min-w-[220px] max-w-[280px] whitespace-normal backdrop-blur-md relative ${
          isDarkMode
            ? 'bg-slate-900/95 text-slate-100 border-slate-700'
            : 'bg-white/95 text-slate-900 border-slate-300'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between gap-2 border-b pb-1.5 mb-2 ${
            isDarkMode ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          <div className="font-bold flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-sm">{node.name}</span>
            <span className="text-slate-400">•</span>
            <span
              className={`text-[11px] font-medium ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
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
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono border ${
                  isDarkMode
                    ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {b}
              </span>
            ))}
          </div>
        )}

        {/* Interfaces & IP Addressing List */}
        <div className="space-y-1">
          <div
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {node.type === 'switch' ? 'Ports & VLANs:' : 'Interfaces & IPs:'}
          </div>
          <div className="max-h-28 overflow-y-auto space-y-0.5 font-mono text-[11px]">
            {interfaces.length === 0 ? (
              <span className="text-slate-400 italic">No interfaces</span>
            ) : (
              interfaces.map(iface => (
                <div
                  key={iface.name}
                  className={`flex items-center justify-between gap-1.5 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  <span
                    className={`font-medium shrink-0 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {iface.name}:
                  </span>
                  <span
                    className={`font-semibold text-right truncate ${
                      isDarkMode ? 'text-slate-100' : 'text-slate-900'
                    }`}
                  >
                    {iface.ip || iface.ipv6 || (iface.vlanTag ? `Tag ${iface.vlanTag}` : 'Trunk/Link')}
                  </span>
                </div>
              ))
            )}
            {node.defaultGateway && (
              <div
                className={`flex items-center justify-between pt-1 border-t mt-1 ${
                  isDarkMode
                    ? 'text-slate-300 border-slate-800'
                    : 'text-slate-600 border-slate-100'
                }`}
              >
                <span className="text-slate-400">GW:</span>
                <span className="font-semibold">{node.defaultGateway}</span>
              </div>
            )}
          </div>
        </div>

        {/* Downward triangle arrow */}
        <div
          className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${
            isDarkMode ? 'border-t-slate-700' : 'border-t-slate-300'
          }`}
        />
      </div>
    </div>
  );
});

NodeTooltip.displayName = 'NodeTooltip';

