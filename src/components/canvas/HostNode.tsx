'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NetworkNode } from '../../engine/types';
import { NodeTooltip } from './NodeTooltip';

interface HostNodeData {
  node: NetworkNode;
  isWiringMode?: boolean;
  isWiringSource?: boolean;
}

interface HostNodeProps {
  data: HostNodeData;
  selected: boolean;
}

export const HostNode: React.FC<HostNodeProps> = ({ data, selected }) => {
  const { node, isWiringMode, isWiringSource } = data;
  const isSelected = selected;

  return (
    <div className="group relative flex flex-col items-center justify-center cursor-pointer select-none">
      {/* Floating Hover Tooltip */}
      <NodeTooltip node={node} />

      {/* Rounded Square Container with 4 Interactive Connection Port Handles */}
      <div className="relative">
        {/* Top Port Handle (Target / IN) */}
        <Handle
          type="target"
          position={Position.Top}
          id="target-top"
          className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-white dark:!border-slate-900 !rounded-full transition-all duration-150 z-20 cursor-crosshair opacity-0 group-hover:opacity-100 group-hover:scale-110 hover:!scale-150 hover:!bg-emerald-300 shadow-xs"
          title="Port IN (Top) - Drop kabel ke sini"
        />

        {/* Right Port Handle (Source / OUT) */}
        <Handle
          type="source"
          position={Position.Right}
          id="source-right"
          className="!w-3 !h-3 !bg-emerald-600 !border-2 !border-white dark:!border-slate-900 !rounded-full transition-all duration-150 z-20 cursor-crosshair opacity-0 group-hover:opacity-100 group-hover:scale-110 hover:!scale-150 hover:!bg-emerald-400 shadow-xs"
          title="Port OUT (Right) - Tarik kabel dari sini"
        />

        {/* Bottom Port Handle (Source / OUT) */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="source-bottom"
          className="!w-3 !h-3 !bg-emerald-600 !border-2 !border-white dark:!border-slate-900 !rounded-full transition-all duration-150 z-20 cursor-crosshair opacity-0 group-hover:opacity-100 group-hover:scale-110 hover:!scale-150 hover:!bg-emerald-400 shadow-xs"
          title="Port OUT (Bottom) - Tarik kabel dari sini"
        />

        {/* Left Port Handle (Target / IN) */}
        <Handle
          type="target"
          position={Position.Left}
          id="target-left"
          className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-white dark:!border-slate-900 !rounded-full transition-all duration-150 z-20 cursor-crosshair opacity-0 group-hover:opacity-100 group-hover:scale-110 hover:!scale-150 hover:!bg-emerald-300 shadow-xs"
          title="Port IN (Left) - Drop kabel ke sini"
        />

        {/* Centered Fallback Handles */}
        <Handle
          type="target"
          position={Position.Top}
          id="target-center"
          className="!w-1 !h-1 !opacity-0 !border-none !pointer-events-none"
          style={{ top: '24px', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="source-center"
          className="!w-1 !h-1 !opacity-0 !border-none !pointer-events-none"
          style={{ top: '24px', left: '50%', transform: 'translate(-50%, -50%)' }}
        />

        {/* Wiring Mode Halo Effect */}
        {isWiringMode && (
          <div className="absolute -inset-1 rounded-2xl border-2 border-dashed border-emerald-400/80 animate-spin-slow pointer-events-none" />
        )}
        {isWiringSource && (
          <div className="absolute -inset-2 rounded-2xl ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-900 animate-pulse pointer-events-none" />
        )}

        {/* Clean 48px Rounded Square in Emerald Green */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-600 border-2 border-emerald-700 text-white shadow-sm transition-all duration-150 group-hover:scale-105 ${
            isWiringSource
              ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-900 scale-110'
              : isSelected
              ? 'ring-3 ring-emerald-500/60 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900'
              : 'hover:shadow-md'
          }`}
        >
          {/* Host PC Desktop Workstation Icon */}
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" strokeWidth="0">
            <path d="M4 4h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2h-6v2h4v2H6v-2h4v-2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v10h16V6H4z" />
            <circle cx="12" cy="11" r="1.5" />
          </svg>
        </div>
      </div>

      {/* Node Name Label Below Square */}
      <div className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white/95 dark:bg-slate-800/95 px-2 py-0.5 rounded shadow-xs border border-slate-200 dark:border-slate-700 tracking-tight select-none text-center whitespace-nowrap">
        {node.name}
      </div>

      {/* Wiring Mode Source Badge */}
      {isWiringSource && (
        <span className="absolute -top-6 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 animate-pulse whitespace-nowrap pointer-events-none">
          Sumber Kabel
        </span>
      )}
    </div>
  );
};
