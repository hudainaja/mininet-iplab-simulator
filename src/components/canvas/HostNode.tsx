'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NetworkNode } from '../../engine/types';
import { useNetworkStore } from '../../store/useNetworkStore';
import { NodeTooltip } from './NodeTooltip';

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

  return (
    <div
      onClick={() => {
        selectNode(node.id);
        openTerminal(node.id);
      }}
      className="group relative flex flex-col items-center justify-center cursor-pointer select-none"
    >
      {/* Floating Hover Tooltip */}
      <NodeTooltip node={node} />

      {/* Cardinal Handles for Link Connections */}
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-400 !border-white hover:!bg-emerald-600 transition-colors" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-400 !border-white hover:!bg-emerald-600 transition-colors" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-slate-400 !border-white hover:!bg-emerald-600 transition-colors" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-slate-400 !border-white hover:!bg-emerald-600 transition-colors" />

      {/* Clean 48px Rounded Square in Emerald Green */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-600 border-2 border-emerald-700 text-white shadow-sm transition-all duration-150 group-hover:scale-105 ${
          isSelected
            ? 'ring-3 ring-emerald-500/60 ring-offset-2 ring-offset-slate-50'
            : 'hover:shadow-md'
        }`}
      >
        {/* Host PC Desktop Workstation Icon */}
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" strokeWidth="0">
          <path d="M4 4h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2h-6v2h4v2H6v-2h4v-2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v10h16V6H4z" />
          <circle cx="12" cy="11" r="1.5" />
        </svg>
      </div>

      {/* Node Name Label Below Square */}
      <div className="mt-2.5 text-xs font-semibold text-slate-800 bg-white/95 px-2 py-0.5 rounded shadow-xs border border-slate-200 tracking-tight select-none text-center whitespace-nowrap">
        {node.name}
      </div>
    </div>
  );
};
