'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NetworkNode } from '../../engine/types';
import { useNetworkStore } from '../../store/useNetworkStore';

interface RouterNodeProps {
  data: {
    node: NetworkNode;
  };
  selected: boolean;
}

export const RouterNode: React.FC<RouterNodeProps> = ({ data, selected }) => {
  const { node } = data;
  const selectNode = useNetworkStore(state => state.selectNode);
  const openTerminal = useNetworkStore(state => state.openTerminal);

  const isCore = node.role === 'core';
  const isSelected = selected;

  const intfEntries = Object.entries(node.interfaces).filter(([name]) => name !== 'lo' && !name.startsWith('tunnel'));

  return (
    <div
      onClick={() => {
        selectNode(node.id);
        openTerminal(node.id);
      }}
      className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 cursor-pointer select-none
        ${isCore ? 'bg-slate-900/90 border-blue-500/60 shadow-blue-500/10' : 'bg-slate-900/90 border-teal-500/60 shadow-teal-500/10'}
        ${isSelected ? 'ring-2 ring-blue-400 border-transparent shadow-lg scale-105' : 'hover:border-slate-400'}
        border backdrop-blur-md shadow-md min-w-[110px]
      `}
    >
      {/* Handles for Links */}
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-blue-400 !border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-blue-400 !border-slate-900" />
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-blue-400 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-blue-400 !border-slate-900" />

      {/* Role Badge */}
      <div className="absolute -top-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border shadow-sm
        ${isCore ? 'bg-blue-950 text-blue-300 border-blue-600/60' : 'bg-teal-950 text-teal-300 border-teal-600/60'}
      ">
        {isCore ? 'Core Router' : 'Edge Router'}
      </div>

      {/* Mininet-IPLab Router Icon (Cisco-style cylindrical cross-arrows) */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1.5 shadow-inner transition-transform group-hover:scale-105
        ${isCore ? 'bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 text-white shadow-blue-600/50' : 'bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 text-white shadow-teal-600/50'}
      `}>
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" strokeWidth="0">
          {/* Circular router with 4 arrows pointing in/out */}
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          <path d="M7 11h3.59L8.3 8.71 9.71 7.3 14.41 12l-4.7 4.7-1.41-1.41L10.59 13H7v-2zm10 2h-3.59l2.29 2.29-1.41 1.41L9.59 12l4.7-4.7 1.41 1.41L13.41 11H17v2z" />
        </svg>
      </div>

      {/* Node Name */}
      <div className="text-sm font-black tracking-wide text-slate-100 flex items-center gap-1">
        <span>{node.name}</span>
        {node.ospfEnabled && (
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="OSPF Active" />
        )}
      </div>

      {/* Primary IP or Router-ID */}
      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
        {node.interfaces['lo']?.ip?.split('/')[0] || (intfEntries[0] ? intfEntries[0][1].ip?.split('/')[0] : 'No IP')}
      </div>

      {/* Interfaces list preview */}
      <div className="flex flex-wrap gap-1 justify-center mt-2 max-w-[120px]">
        {intfEntries.map(([intfName, intf]) => (
          <div
            key={intfName}
            className={`text-[8px] font-mono px-1 py-0.2 rounded border ${
              intf.up ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-red-950/60 text-red-400 border-red-800'
            }`}
            title={`${intfName}: ${intf.ip || 'no ip'}`}
          >
            {intfName.split('-').pop()}
          </div>
        ))}
      </div>
    </div>
  );
};
