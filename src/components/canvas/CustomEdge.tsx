'use client';

import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from '@xyflow/react';

interface CustomEdgeData {
  sourceHandle?: string;
  targetHandle?: string;
  latency?: number;
  status?: 'up' | 'down';
}

export const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const edgeData = (data || {}) as CustomEdgeData;
  const isUp = edgeData.status !== 'down';
  const sourceHandle = edgeData.sourceHandle || 'eth1';
  const targetHandle = edgeData.targetHandle || 'eth1';

  return (
    <>
      {/* Invisible wider stroke for easy hover trigger */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={16}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Solid slate cable (slate-600 strokeWidth 2.5) */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isUp ? (isHovered ? '#1d4ed8' : '#475569') : '#dc2626',
          strokeWidth: isHovered ? 3 : 2.5,
          transition: 'stroke 0.15s, stroke-width 0.15s',
        }}
      />

      {/* Edge interface mapping label on hover */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="transition-all duration-150 z-20"
        >
          {isHovered ? (
            <div className="bg-white/90 text-slate-700 border border-slate-300 text-[10px] px-1.5 py-0.5 rounded shadow-sm font-mono whitespace-nowrap flex items-center gap-1.5">
              <span className="font-semibold text-blue-700">{sourceHandle}</span>
              <span className="text-slate-400">⟷</span>
              <span className="font-semibold text-blue-700">{targetHandle}</span>
              {edgeData.latency && (
                <span className="text-slate-400 text-[9px] border-l border-slate-200 pl-1">
                  {edgeData.latency}ms
                </span>
              )}
            </div>
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 hover:scale-150 transition-transform cursor-pointer" />
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
