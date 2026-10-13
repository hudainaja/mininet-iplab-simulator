'use client';

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useNetworkStore } from '../../store/useNetworkStore';
import { RouterNode } from './RouterNode';
import { SwitchNode } from './SwitchNode';
import { HostNode } from './HostNode';
import { CustomEdge } from './CustomEdge';

const nodeTypes = {
  router: RouterNode,
  switch: SwitchNode,
  host: HostNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

export const NetworkCanvas: React.FC = () => {
  const nodes = useNetworkStore(state => state.nodes);
  const links = useNetworkStore(state => state.links);
  const selectedNodeId = useNetworkStore(state => state.selectedNodeId);
  const selectNode = useNetworkStore(state => state.selectNode);
  const openTerminal = useNetworkStore(state => state.openTerminal);
  const updateNodePosition = useNetworkStore(state => state.updateNodePosition);
  const addLink = useNetworkStore(state => state.addLink);

  // Convert zustand nodes to React Flow nodes
  const flowNodes: Node[] = useMemo(() => {
    return Object.values(nodes).map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: { node },
      selected: node.id === selectedNodeId,
    }));
  }, [nodes, selectedNodeId]);

  // Convert zustand links to React Flow edges
  const flowEdges: Edge[] = useMemo(() => {
    return links.map(link => ({
      id: link.id,
      source: link.source,
      target: link.target,
      type: 'custom',
      data: {
        sourceHandle: link.sourceHandle,
        targetHandle: link.targetHandle,
        status: link.status,
        latency: link.latency,
      },
    }));
  }, [links]);

  const onNodeDragStop = useCallback((_: MouseEvent | TouchEvent, node: Node) => {
    updateNodePosition(node.id, { x: Math.round(node.position.x), y: Math.round(node.position.y) });
  }, [updateNodePosition]);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const newLinkId = `link-${connection.source}-${connection.target}-${Date.now().toString().slice(-4)}`;
    addLink({
      id: newLinkId,
      source: connection.source,
      sourceHandle: connection.sourceHandle || 'eth1',
      target: connection.target,
      targetHandle: connection.targetHandle || 'eth1',
      status: 'up',
      latency: 0.4,
    });
  }, [addLink]);

  return (
    <div className="w-full h-full relative bg-slate-50 overflow-hidden">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodeClick={(_, node) => {
          selectNode(node.id);
          openTerminal(node.id);
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.0}
        defaultEdgeOptions={{ type: 'custom' }}
        proOptions={{ hideAttribution: true }}
      >
        {/* Subtle slate grid dots */}
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#CBD5E1" />

        {/* Clean Controls docked at bottom-left */}
        <Controls
          position="bottom-left"
          className="bg-white border border-slate-300 shadow-sm rounded-md fill-slate-700 [&>button]:border-slate-200 [&>button]:fill-slate-700"
        />
      </ReactFlow>

      {/* Floating Canvas Helper Info in Clean Light Theme */}
      <div className="absolute top-3 left-3 pointer-events-none select-none bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2 shadow-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>Click node to open terminal • Hover links for interface mappings</span>
      </div>
    </div>
  );
};
