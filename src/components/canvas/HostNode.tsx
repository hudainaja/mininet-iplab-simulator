'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NetworkNode } from '../../engine/types';
import { useNetworkStore } from '../../store/useNetworkStore';
import { NodeTooltip } from './NodeTooltip';
import { X } from 'lucide-react';

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
  const removeNode = useNetworkStore(state => state.removeNode);
  const isSelected = selected;

  return (
    <div className="group relative flex flex-col items-center justify-center cursor-pointer select-none">
      {/* Floating Hover Tooltip */}
      <NodeTooltip node={node} />

      {/* Rounded Square Container */}
      <div className="relative">
        {/* Centered Connection Handles for Straight Center-to-Center Cables */}
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

        {/* Interactive Port Handles for Drag-and-Drop Cable Connection */}
        <Handle
          type="target"
          position={Position.Top}
          id="target-port"
          className={`!w-3 !h-3 !bg-emerald-400 !border-2 !border-white dark:!border-slate-900 !rounded-full transition-all duration-150 z-20 cursor-crosshair ${
            isWiringMode ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-100'
          } hover:!scale-150 hover:!bg-emerald-300 shadow-xs`}
          style={{ top: '-4px', left: '50%', transform: 'translateX(-50%)' }}
          title="Port IN - Drop kabel ke sini"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="source-port"
          className={`!w-3 !h-3 !bg-emerald-600 !border-2 !border-white dark:!border-slate-900 !rounded-full transition-all duration-150 z-20 cursor-crosshair ${
            isWiringMode ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-100'
          } hover:!scale-150 hover:!bg-emerald-400 shadow-xs`}
          style={{ bottom: '-4px', left: '50%', transform: 'translateX(-50%)' }}
          title="Port OUT - Tarik kabel ke node lain"
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

        {/* Quick Delete Node Button when Selected */}
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeNode(node.id);
            }}
            className="absolute -top-1.5 -right-1.5 z-40 w-5 h-5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110 border-2 border-white dark:border-slate-900"
            title={`Hapus host ${node.name} (Delete)`}
          >
            <X className="w-3 h-3 stroke-[2.5]" />
          </button>
        )}
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
