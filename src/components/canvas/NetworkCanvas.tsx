'use client';

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
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
      sourceHandle: link.sourceHandle,
      target: link.target,
      targetHandle: link.targetHandle,
      type: 'custom',
      data: {
        sourceHandle: link.sourceHandle,
        targetHandle: link.targetHandle,
        status: link.status,
        latency: link.latency,
      },
      animated: link.status === 'up',
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
    <div className="w-full h-full relative bg-slate-950 overflow-hidden">
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
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2.0}
        defaultEdgeOptions={{ type: 'custom' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#1e293b" />
        <Controls className="!bg-slate-900/90 !border-slate-800 !text-slate-300 !fill-slate-300 shadow-xl rounded-xl overflow-hidden [&>button]:!border-slate-800" />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'router') return '#3b82f6';
            if (n.type === 'switch') return '#a855f7';
            return '#10b981';
          }}
          maskColor="rgba(15, 23, 42, 0.75)"
          className="!bg-slate-900/90 !border !border-slate-800 !rounded-xl overflow-hidden shadow-2xl !bottom-4 !left-4"
        />
      </ReactFlow>

      {/* Floating Canvas Helper Info */}
      <div className="absolute top-4 left-4 pointer-events-none select-none bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Click node to open terminal • Hover links for interface mappings</span>
      </div>
    </div>
  );
};
