'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NetworkNode } from '../../engine/types';
import { NodeTooltip } from './NodeTooltip';

interface SwitchNodeData {
  node: NetworkNode;
  isWiringMode?: boolean;
  isWiringSource?: boolean;
}

interface SwitchNodeProps {
  data: SwitchNodeData;
  selected: boolean;
}

export const SwitchNode: React.FC<SwitchNodeProps> = ({ data, selected }) => {
  const { node, isWiringMode, isWiringSource } = data;
  const isSelected = selected;

  return (
    <div className="group relative flex flex-col items-center justify-center cursor-pointer select-none">
      {/* Floating Hover Tooltip */}
      <NodeTooltip node={node} />

      {/* Circle Icon Container with 4 Interactive Connection Port Handles */}
      <div className="relative">
        {/* Top Port Handle (Target / IN) */}
        <Handle
          type="target"
          position={Position.Top}
          id="target-top"
          className="!w-3 !h-3 !bg-amber-400 !border-2 !border-white dark:!border-slate-900 !rounded-full transition-all duration-150 z-20 cursor-crosshair opacity-0 group-hover:opacity-100 group-hover:scale-110 hover:!scale-150 hover:!bg-amber-300 shadow-xs"
          title="Port IN (Top) - Drop kabel ke sini"
        />

        {/* Right Port Handle (Source / OUT) */}
        <Handle
          type="source"
          position={Position.Right}
          id="source-right"
          className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white dark:!border-slate-900 !rounded-full transition-all duration-150 z-20 cursor-crosshair opacity-0 group-hover:opacity-100 group-hover:scale-110 hover:!scale-150 hover:!bg-amber-300 shadow-xs"
          title="Port OUT (Right) - Tarik kabel dari sini"
        />

        {/* Bottom Port Handle (Source / OUT) */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="source-bottom"
          className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white dark:!border-slate-900 !rounded-full transition-all duration-150 z-20 cursor-crosshair opacity-0 group-hover:opacity-100 group-hover:scale-110 hover:!scale-150 hover:!bg-amber-300 shadow-xs"
          title="Port OUT (Bottom) - Tarik kabel dari sini"
        />

        {/* Left Port Handle (Target / IN) */}
        <Handle
          type="target"
          position={Position.Left}
          id="target-left"
          className="!w-3 !h-3 !bg-amber-400 !border-2 !border-white dark:!border-slate-900 !rounded-full transition-all duration-150 z-20 cursor-crosshair opacity-0 group-hover:opacity-100 group-hover:scale-110 hover:!scale-150 hover:!bg-amber-300 shadow-xs"
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
          <div className="absolute -inset-1 rounded-full border-2 border-dashed border-amber-400/80 animate-spin-slow pointer-events-none" />
        )}
        {isWiringSource && (
          <div className="absolute -inset-2 rounded-full ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 animate-pulse pointer-events-none" />
        )}

        {/* Clean 48px Circle in Mininet Amber/Orange */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center bg-amber-500 border-2 border-amber-600 text-white shadow-sm transition-all duration-150 group-hover:scale-105 ${
            isWiringSource
              ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-110'
              : isSelected
              ? 'ring-3 ring-amber-500/60 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900'
              : 'hover:shadow-md'
          }`}
        >
          {/* Switch Icon: Horizontal Bi-directional Arrows */}
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" strokeWidth="0">
            <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm0 2v8h16V8H4z" />
            <path d="M6 10h4v1.5H6zm8 0h4v1.5h-4zm-8 3h4v1.5H6zm8 0h4v1.5h-4z" />
          </svg>
        </div>
      </div>

      {/* Node Name Label Below Circle */}
      <div className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white/95 dark:bg-slate-800/95 px-2 py-0.5 rounded shadow-xs border border-slate-200 dark:border-slate-700 tracking-tight select-none text-center whitespace-nowrap">
        {node.name}
      </div>

      {/* Wiring Mode Source Badge */}
      {isWiringSource && (
        <span className="absolute -top-6 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700 animate-pulse whitespace-nowrap pointer-events-none">
          Sumber Kabel
        </span>
      )}
    </div>
  );
};
