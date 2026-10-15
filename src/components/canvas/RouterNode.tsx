'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NetworkNode } from '../../engine/types';
import { NodeTooltip } from './NodeTooltip';

interface RouterNodeData {
  node: NetworkNode;
  isWiringMode?: boolean;
  isWiringSource?: boolean;
}

interface RouterNodeProps {
  data: RouterNodeData;
  selected: boolean;
}

export const RouterNode: React.FC<RouterNodeProps> = ({ data, selected }) => {
  const { node, isWiringMode, isWiringSource } = data;
  const isCore = node.role === 'core';
  const isSelected = selected;

  return (
    <div className="group relative flex flex-col items-center justify-center cursor-pointer select-none">
      {/* Floating Hover Tooltip */}
      <NodeTooltip node={node} />

      {/* Circle Icon Container */}
      <div className="relative">
        {/* Centered Connection Handles for Straight Center-to-Center Cables */}
        <Handle
          type="target"
          position={Position.Top}
          id="target-center"
          className="!w-1 !h-1 !opacity-0 !border-none !pointer-events-none"
          style={{ top: isCore ? '26px' : '24px', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="source-center"
          className="!w-1 !h-1 !opacity-0 !border-none !pointer-events-none"
          style={{ top: isCore ? '26px' : '24px', left: '50%', transform: 'translate(-50%, -50%)' }}
        />

        {/* Interactive Port Handles for Drag-and-Drop Cable Connection */}
        <Handle
          type="target"
          position={Position.Top}
          id="target-port"
          className={`!w-3 !h-3 !bg-sky-400 !border-2 !border-white dark:!border-slate-900 !rounded-full transition-all duration-150 z-20 cursor-crosshair ${
            isWiringMode ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-100'
          } hover:!scale-150 hover:!bg-sky-300 shadow-xs`}
          style={{ top: '-4px', left: '50%', transform: 'translateX(-50%)' }}
          title="Port IN - Drop kabel ke sini"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="source-port"
          className={`!w-3 !h-3 !bg-blue-500 !border-2 !border-white dark:!border-slate-900 !rounded-full transition-all duration-150 z-20 cursor-crosshair ${
            isWiringMode ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-100'
          } hover:!scale-150 hover:!bg-blue-400 shadow-xs`}
          style={{ bottom: '-4px', left: '50%', transform: 'translateX(-50%)' }}
          title="Port OUT - Tarik kabel ke node lain"
        />

        {/* Wiring Mode Halo Effect */}
        {isWiringMode && (
          <div className="absolute -inset-1 rounded-full border-2 border-dashed border-sky-400/80 animate-spin-slow pointer-events-none" />
        )}
        {isWiringSource && (
          <div className="absolute -inset-2 rounded-full ring-4 ring-sky-400 ring-offset-2 ring-offset-slate-900 animate-pulse pointer-events-none" />
        )}

        {/* Clean Circular Node (Core 52px, Edge 48px) */}
        <div
          className={`flex items-center justify-center rounded-full text-white shadow-sm transition-all duration-150 group-hover:scale-105 ${
            isCore
              ? 'w-[52px] h-[52px] bg-blue-600 border-2 border-blue-700'
              : 'w-12 h-12 bg-sky-500 border-2 border-sky-600'
          } ${
            isWiringSource
              ? 'ring-4 ring-sky-400 ring-offset-2 ring-offset-slate-900 scale-110'
              : isSelected
              ? 'ring-3 ring-blue-500/60 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900'
              : 'hover:shadow-md'
          }`}
        >
          {/* Classic Router 4-Arrow Icon */}
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" strokeWidth="0">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            <path d="M7 11h3.59L8.3 8.71 9.71 7.3 14.41 12l-4.7 4.7-1.41-1.41L10.59 13H7v-2zm10 2h-3.59l2.29 2.29-1.41 1.41L9.59 12l4.7-4.7 1.41 1.41L13.41 11H17v2z" />
          </svg>
        </div>
      </div>

      {/* Node Name Label Below Circle */}
      <div className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white/95 dark:bg-slate-800/95 px-2 py-0.5 rounded shadow-xs border border-slate-200 dark:border-slate-700 tracking-tight select-none text-center whitespace-nowrap">
        {node.name}
      </div>

      {/* Wiring Mode Source Badge */}
      {isWiringSource && (
        <span className="absolute -top-6 text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-300 dark:border-sky-700 animate-pulse whitespace-nowrap pointer-events-none">
          Sumber Kabel
        </span>
      )}
    </div>
  );
};
