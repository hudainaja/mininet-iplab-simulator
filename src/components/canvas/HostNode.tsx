'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NetworkNode } from '../../engine/types';
import { useNetworkStore } from '../../store/useNetworkStore';

interface HostNodeProps {
  data: {
    node: NetworkNode;
  };
  selected: boolean;
}

export const HostNode: React.FC<HostNodeProps> = ({ data, selected }) => {
  const { node } = data;
  const selectNode = useNetworkStore(state => state.selectNode);
  const openTerminal = useNetworkStore(state => state.openTerminal);

  const isSelected = selected;
  const mainIntf = Object.values(node.interfaces)[0];

  return (
    <div
      onClick={() => {
        selectNode(node.id);
        openTerminal(node.id);
      }}
      className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 cursor-pointer select-none
        bg-slate-900/90 border-emerald-500/60 shadow-emerald-500/10
        ${isSelected ? 'ring-2 ring-emerald-400 border-transparent shadow-lg scale-105' : 'hover:border-slate-400'}
        border backdrop-blur-md shadow-md min-w-[110px]
      `}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-emerald-400 !border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-emerald-400 !border-slate-900" />
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-emerald-400 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-emerald-400 !border-slate-900" />

      {/* Role Badge */}
      <div className="absolute -top-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border shadow-sm bg-emerald-950 text-emerald-300 border-emerald-600/60">
        Host PC
      </div>

      {/* Mininet-IPLab Green Host PC Icon */}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1.5 shadow-inner transition-transform group-hover:scale-105 bg-gradient-to-tr from-emerald-700 via-green-600 to-teal-500 text-white shadow-emerald-600/50">
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" strokeWidth="0">
          <path d="M4 4h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2h-6v2h4v2H6v-2h4v-2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v10h16V6H4z" />
          <circle cx="12" cy="11" r="1.5" />
        </svg>
      </div>

      {/* Node Name */}
      <div className="text-sm font-black tracking-wide text-slate-100">
        {node.name}
      </div>

      {/* IP Address */}
      <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
        {mainIntf?.ip || 'Unassigned'}
      </div>

      {/* Gateway or IPv6 indicator */}
      {mainIntf?.ipv6 && (
        <div className="text-[8px] font-mono text-cyan-400 bg-cyan-950/60 px-1 py-0.5 rounded mt-1 border border-cyan-800/40">
          IPv6 Active
        </div>
      )}
    </div>
  );
};
