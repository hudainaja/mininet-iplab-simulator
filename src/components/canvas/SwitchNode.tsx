'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NetworkNode } from '../../engine/types';
import { useNetworkStore } from '../../store/useNetworkStore';

interface SwitchNodeProps {
  data: {
    node: NetworkNode;
  };
  selected: boolean;
}

export const SwitchNode: React.FC<SwitchNodeProps> = ({ data, selected }) => {
  const { node } = data;
  const selectNode = useNetworkStore(state => state.selectNode);
  const openTerminal = useNetworkStore(state => state.openTerminal);

  const isSelected = selected;
  const intfEntries = Object.entries(node.interfaces);

  return (
    <div
      onClick={() => {
        selectNode(node.id);
        openTerminal(node.id);
      }}
      className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 cursor-pointer select-none
        bg-slate-900/90 border-purple-500/60 shadow-purple-500/10
        ${isSelected ? 'ring-2 ring-purple-400 border-transparent shadow-lg scale-105' : 'hover:border-slate-400'}
        border backdrop-blur-md shadow-md min-w-[110px]
      `}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-purple-400 !border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-purple-400 !border-slate-900" />
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-purple-400 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-purple-400 !border-slate-900" />

      {/* Role Badge */}
      <div className="absolute -top-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border shadow-sm bg-purple-950 text-purple-300 border-purple-600/60">
        OVS Switch
      </div>

      {/* Mininet-IPLab Switch Icon (Rectangular with horizontal crossing arrows) */}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1.5 shadow-inner transition-transform group-hover:scale-105 bg-gradient-to-tr from-purple-700 via-indigo-600 to-violet-500 text-white shadow-purple-600/50">
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" strokeWidth="0">
          <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm0 2v8h16V8H4z" />
          <path d="M6 10h4v1.5H6zm8 0h4v1.5h-4zm-8 3h4v1.5H6zm8 0h4v1.5h-4z" />
        </svg>
      </div>

      {/* Node Name */}
      <div className="text-sm font-black tracking-wide text-slate-100">
        {node.name}
      </div>

      {/* VLAN port tags */}
      <div className="flex flex-col gap-0.5 justify-center mt-1.5 max-w-[120px]">
        {intfEntries.map(([intfName, intf]) => (
          <div
            key={intfName}
            className="flex items-center justify-between text-[8px] font-mono px-1 py-0.5 rounded bg-slate-800/80 text-purple-300 border border-purple-900/50"
          >
            <span>{intfName.split('-').pop()}</span>
            {intf.vlanTag ? (
              <span className="font-bold text-amber-300 ml-1">VLAN {intf.vlanTag}</span>
            ) : (
              <span className="text-slate-500 ml-1">trunk</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
