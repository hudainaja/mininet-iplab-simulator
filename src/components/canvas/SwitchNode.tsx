'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NetworkNode } from '../../engine/types';
import { useNetworkStore } from '../../store/useNetworkStore';
import { NodeTooltip } from './NodeTooltip';

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
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-400 !border-white hover:!bg-amber-600 transition-colors" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-400 !border-white hover:!bg-amber-600 transition-colors" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-slate-400 !border-white hover:!bg-amber-600 transition-colors" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-slate-400 !border-white hover:!bg-amber-600 transition-colors" />

      {/* Clean 48px Circle in Mininet Amber/Orange */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center bg-amber-500 border-2 border-amber-600 text-white shadow-sm transition-all duration-150 group-hover:scale-105 ${
          isSelected
            ? 'ring-3 ring-amber-500/60 ring-offset-2 ring-offset-slate-50'
            : 'hover:shadow-md'
        }`}
      >
        {/* Switch Icon: Horizontal Bi-directional Arrows */}
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" strokeWidth="0">
          <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm0 2v8h16V8H4z" />
          <path d="M6 10h4v1.5H6zm8 0h4v1.5h-4zm-8 3h4v1.5H6zm8 0h4v1.5h-4z" />
        </svg>
      </div>

      {/* Node Name Label Below Circle */}
      <div className="mt-2.5 text-xs font-semibold text-slate-800 bg-white/95 px-2 py-0.5 rounded shadow-xs border border-slate-200 tracking-tight select-none text-center whitespace-nowrap">
        {node.name}
      </div>
    </div>
  );
};
