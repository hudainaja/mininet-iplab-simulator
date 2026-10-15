'use client';

import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getStraightPath } from '@xyflow/react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { Trash2 } from 'lucide-react';

interface CustomEdgeData {
  sourceHandle?: string;
  targetHandle?: string;
  latency?: number;
  status?: 'up' | 'down';
}

// Strip node name prefix from interface name for compact display
// e.g. "r1-eth0" → "eth0", "s1-eth2" → "eth2", "lo" → "lo"
function shortIntfName(fullName: string): string {
  const dashIdx = fullName.indexOf('-');
  if (dashIdx !== -1) {
    return fullName.substring(dashIdx + 1);
  }
  return fullName;
}

export const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  data,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const removeLink = useNetworkStore(state => state.removeLink);
  const isDarkMode = useNetworkStore(state => state.isDarkMode);

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const edgeData = (data || {}) as CustomEdgeData;
  const isUp = edgeData.status !== 'down';
  const sourceHandle = edgeData.sourceHandle || 'eth1';
  const targetHandle = edgeData.targetHandle || 'eth1';

  // Calculate positions near each endpoint for the interface labels
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  // Perpendicular vector for slight offset so labels do not sit directly on the cable
  const px = -uy;
  const py = ux;

  // Offset distance along the wire from source and target node centers
  // Router nodes have radius ~28px; placing label at 48px ensures clear visibility outside node
  const dOffset = Math.min(dist * 0.35, Math.max(46, dist * 0.22));
  const pOffset = 11;

  const srcLabelX = sourceX + ux * dOffset + px * pOffset;
  const srcLabelY = sourceY + uy * dOffset + py * pOffset;
  const tgtLabelX = targetX - ux * dOffset + px * pOffset;
  const tgtLabelY = targetY - uy * dOffset + py * pOffset;

  const labelBadgeClass = isDarkMode
    ? 'bg-slate-900/90 text-sky-300 border-slate-700/80 shadow-sm shadow-black/30'
    : 'bg-white/95 text-blue-700 border-slate-300 shadow-xs';

  return (
    <>
      {/* Invisible wider stroke for easy hover trigger */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Solid straight slate cable when UP; Dashed crimson cable when DOWN */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className="react-flow__edge-path"
        style={{
          ...style,
          stroke: isUp ? (isHovered ? '#2563eb' : '#64748b') : '#dc2626',
          strokeWidth: isHovered ? 3 : isUp ? 2 : 2.5,
          strokeDasharray: isUp ? undefined : '6,4',
          transition: 'stroke 0.15s, stroke-width 0.15s',
        }}
      />

      <EdgeLabelRenderer>
        {/* Always-visible interface label near SOURCE endpoint */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${srcLabelX}px,${srcLabelY}px)`,
            pointerEvents: 'none',
          }}
          className="z-20"
        >
          <span
            className={`text-[9px] font-mono font-semibold px-1 py-0.5 rounded border shadow-xs select-none backdrop-blur-xs ${labelBadgeClass}`}
          >
            {shortIntfName(sourceHandle)}
          </span>
        </div>

        {/* Always-visible interface label near TARGET endpoint */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${tgtLabelX}px,${tgtLabelY}px)`,
            pointerEvents: 'none',
          }}
          className="z-20"
        >
          <span
            className={`text-[9px] font-mono font-semibold px-1 py-0.5 rounded border shadow-xs select-none backdrop-blur-xs ${labelBadgeClass}`}
          >
            {shortIntfName(targetHandle)}
          </span>
        </div>

        {/* Center label: dot or hover panel */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="transition-all duration-150 z-30"
        >
          {isHovered ? (
            <div
              className={`text-[10px] px-2 py-0.8 rounded-md shadow-md font-mono whitespace-nowrap flex items-center gap-1.5 border backdrop-blur-xs select-none ${
                isDarkMode
                  ? 'bg-slate-900/95 text-slate-200 border-slate-700'
                  : 'bg-white/95 text-slate-800 border-slate-300'
              }`}
            >
              {/* Interface mapping */}
              <span className="font-semibold text-blue-600 dark:text-blue-400">{sourceHandle}</span>
              <span className="text-slate-400">⟷</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{targetHandle}</span>

              {/* Status indicator */}
              {!isUp ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold text-[9px] bg-rose-100 dark:bg-rose-950/60 px-1 py-0.2 rounded border border-rose-300 dark:border-rose-800">
                  DOWN
                </span>
              ) : (
                edgeData.latency && (
                  <span className="text-slate-400 text-[9px] border-l border-slate-200 dark:border-slate-700 pl-1">
                    {edgeData.latency}ms
                  </span>
                )
              )}

              {/* Disconnect cable button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeLink(id);
                }}
                className="ml-1 p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                title="Putus kabel (Hapus link)"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              className={`w-2 h-2 rounded-full transition-transform cursor-pointer ${
                isUp
                  ? 'bg-slate-400 hover:scale-150'
                  : 'bg-rose-500 animate-ping'
              }`}
            />
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
