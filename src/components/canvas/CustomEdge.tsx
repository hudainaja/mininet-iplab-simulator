'use client';

import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from '@xyflow/react';

interface CustomEdgeData {
  sourceHandle?: string;
  targetHandle?: string;
  sourceNodeName?: string;
  targetNodeName?: string;
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
    borderRadius: 16,
  });

  const edgeData = (data || {}) as CustomEdgeData;
  const isUp = edgeData.status !== 'down';
  const sourceHandle = edgeData.sourceHandle || 'eth1';
  const targetHandle = edgeData.targetHandle || 'eth1';

  return (
    <>
      {/* Invisible wider stroke for easier hover */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Actual rendered edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isUp ? (isHovered ? '#38bdf8' : '#22c55e') : '#ef4444',
          strokeWidth: isHovered ? 3 : 2,
          transition: 'stroke 0.2s, stroke-width 0.2s',
          filter: isUp ? 'drop-shadow(0 0 3px rgba(34, 197, 94, 0.4))' : 'none',
        }}
      />

      {/* Edge label & hover interface tooltip */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="transition-all duration-200"
        >
          {isHovered ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl text-[10px] font-mono text-slate-200 backdrop-blur-md z-50 whitespace-nowrap">
              <span className="text-emerald-400 font-semibold">{sourceHandle}</span>
              <span className="text-slate-500">⟷</span>
              <span className="text-emerald-400 font-semibold">{targetHandle}</span>
              <span className="text-slate-400 text-[9px] border-l border-slate-700 pl-1.5">
                {edgeData.latency ? `${edgeData.latency}ms` : '0.4ms'}
              </span>
            </div>
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-emerald-500/80 shadow-sm flex items-center justify-center cursor-pointer hover:scale-125 transition-transform" />
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
