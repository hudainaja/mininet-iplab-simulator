'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  applyNodeChanges,
  NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useNetworkStore } from '../../store/useNetworkStore';
import { RouterNode } from './RouterNode';
import { SwitchNode } from './SwitchNode';
import { HostNode } from './HostNode';
import { CustomEdge } from './CustomEdge';
import { 
  Cable, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  X,
} from 'lucide-react';

const nodeTypes = {
  router: RouterNode,
  switch: SwitchNode,
  host: HostNode,
};

const edgeTypes = {
  custom: CustomEdge,
  straight: CustomEdge,
};

export const NetworkCanvas: React.FC = () => {
  const isDarkMode = useNetworkStore(state => state.isDarkMode);
  const nodes = useNetworkStore(state => state.nodes);
  const links = useNetworkStore(state => state.links);
  const selectedNodeId = useNetworkStore(state => state.selectedNodeId);
  const selectNode = useNetworkStore(state => state.selectNode);
  const openTerminal = useNetworkStore(state => state.openTerminal);
  const updateNodePosition = useNetworkStore(state => state.updateNodePosition);
  const isSidebarCollapsed = useNetworkStore(state => state.isSidebarCollapsed);
  const applyAutoLayout = useNetworkStore(state => state.applyAutoLayout);

  // Wiring mode & Quick Connect
  const isWiringMode = useNetworkStore(state => state.isWiringMode);
  const wiringSourceNodeId = useNetworkStore(state => state.wiringSourceNodeId);
  const toggleWiringMode = useNetworkStore(state => state.toggleWiringMode);
  const setWiringMode = useNetworkStore(state => state.setWiringMode);
  const setWiringSourceNodeId = useNetworkStore(state => state.setWiringSourceNodeId);
  const connectNodes = useNetworkStore(state => state.connectNodes);

  // Network Status Synchronization
  const syncNetworkStatus = useNetworkStore(state => state.syncNetworkStatus);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local state for smooth drag & drop of nodes with live edge updates
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);

  // Synchronize local flowNodes with zustand nodes state
  useEffect(() => {
    setFlowNodes(
      Object.values(nodes).map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          node,
          isWiringMode,
          isWiringSource: wiringSourceNodeId === node.id,
        },
        selected: node.id === selectedNodeId,
      }))
    );
  }, [nodes, selectedNodeId, isWiringMode, wiringSourceNodeId]);

  // Handle position changes on every drag frame so edges move dynamically in real-time
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setFlowNodes(nds => applyNodeChanges(changes, nds));
  }, []);

  // Commit final position to zustand store when drag ends
  const onNodeDragStop = useCallback((_: MouseEvent | TouchEvent, node: Node) => {
    updateNodePosition(node.id, {
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
    });
  }, [updateNodePosition]);

  // Convert zustand links to React Flow edges with straight line paths
  const flowEdges: Edge[] = useMemo(() => {
    return links.map(link => ({
      id: link.id,
      source: link.source,
      target: link.target,
      sourceHandle: 'source-center',
      targetHandle: 'target-center',
      type: 'straight',
      style: {
        stroke: link.status === 'down' ? '#dc2626' : '#64748b',
        strokeWidth: link.status === 'down' ? 2.5 : 2,
        strokeDasharray: link.status === 'down' ? '6,4' : undefined,
      },
      data: {
        sourceHandle: link.sourceHandle,
        targetHandle: link.targetHandle,
        status: link.status,
        latency: link.latency,
      },
    }));
  }, [links]);

  // Handle drag-and-drop connections from handles
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    if (connection.source === connection.target) return;

    const success = connectNodes(connection.source, connection.target);
    if (success) {
      const sName = nodes[connection.source]?.name || connection.source;
      const tName = nodes[connection.target]?.name || connection.target;
      setToastMessage(`Kabel tersambung: ${sName} ⟷ ${tName}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  }, [connectNodes, nodes]);

  // Handle node clicks (Distinguishes between click and drag cleanly)
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (isWiringMode) {
      if (!wiringSourceNodeId) {
        // Step 1: select source node
        setWiringSourceNodeId(node.id);
      } else if (wiringSourceNodeId === node.id) {
        // Clicked same node again: deselect
        setWiringSourceNodeId(null);
      } else {
        // Step 2: connect source node to target node
        const sId = wiringSourceNodeId;
        const success = connectNodes(sId, node.id);
        setWiringSourceNodeId(null);
        if (success) {
          const sName = nodes[sId]?.name || sId;
          const tName = nodes[node.id]?.name || node.id;
          setToastMessage(`Kabel tersambung: ${sName} ⟷ ${tName}`);
          setTimeout(() => setToastMessage(null), 3000);
        }
      }
    } else {
      // Normal click: select node and open terminal
      selectNode(node.id);
      openTerminal(node.id);
    }
  }, [isWiringMode, wiringSourceNodeId, setWiringSourceNodeId, connectNodes, selectNode, openTerminal, nodes]);

  // Trigger Network Sync Refresh with spinning animation
  const handleSyncRefresh = () => {
    setIsSyncing(true);
    const res = syncNetworkStatus();
    setToastMessage(res.message);
    setTimeout(() => {
      setIsSyncing(false);
    }, 600);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Keyboard shortcut listener: 'W' for wiring mode, 'Esc' to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'Escape' && isWiringMode) {
        setWiringMode(false);
      } else if ((e.key === 'w' || e.key === 'W') && !e.ctrlKey && !e.metaKey) {
        toggleWiringMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWiringMode, toggleWiringMode, setWiringMode]);

  // Compute live stats
  const downLinksCount = links.filter(l => l.status === 'down').length;
  const activeLinksCount = links.length - downLinksCount;

  return (
    <div className={`w-full h-full relative overflow-hidden ${isWiringMode ? 'cursor-crosshair' : ''}`}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.0}
        defaultEdgeOptions={{
          type: 'straight',
          style: { stroke: '#64748b', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        {/* Real grid lines in canvas background */}
        <Background
          variant={BackgroundVariant.Lines}
          gap={32}
          size={1}
          color={isDarkMode ? '#1e293b' : '#cbd5e1'}
          className={isDarkMode ? 'bg-[#090d16]' : 'bg-[#f8fafc]'}
        />

        {/* Clean Controls docked at bottom-left */}
        <Controls
          position="bottom-left"
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm rounded-md fill-slate-700 dark:fill-slate-200 [&>button]:border-slate-200 dark:[&>button]:border-slate-700 [&>button]:fill-slate-700 dark:[&>button]:fill-slate-200"
        />
      </ReactFlow>

      {/* Wiring Mode Active Banner at Top */}
      {isWiringMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 text-xs border border-blue-500 animate-in fade-in slide-in-from-top-2 duration-200">
          <Cable className="w-4 h-4 animate-pulse" />
          <div>
            {!wiringSourceNodeId ? (
              <span>
                <strong>Mode Wiring Aktif:</strong> Klik node pertama (Switch / Router / Host) atau tarik port untuk menyambungkan kabel.
              </span>
            ) : (
              <span>
                <strong>Node Sumber:</strong>{' '}
                <span className="font-mono bg-blue-700 px-1.5 py-0.5 rounded text-amber-300 font-bold">
                  {nodes[wiringSourceNodeId]?.name || wiringSourceNodeId}
                </span>{' '}
                ➔ Sekarang klik node tujuan untuk menghubungkan kabel.
              </span>
            )}
          </div>
          <button
            onClick={() => setWiringMode(false)}
            className="p-1 hover:bg-blue-700 rounded-md transition-colors cursor-pointer ml-2"
            title="Keluar dari Mode Wiring (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Canvas Quick Action Toolbar at Top-Right */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        {/* Topology Health Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
          {downLinksCount > 0 ? (
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
              <span>{downLinksCount} Link Down</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{activeLinksCount} Link Aktif</span>
            </div>
          )}
        </div>

        {/* Wiring Mode Toggle Button */}
        <button
          onClick={toggleWiringMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer border ${
            isWiringMode
              ? 'bg-blue-600 border-blue-700 text-white ring-2 ring-blue-400/50'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Mode Tarik Kabel: Sambungkan Switch, Router, dan Host lewat klik atau drag (Tombol Pintas: W)"
        >
          <Cable className={`w-3.5 h-3.5 ${isWiringMode ? 'animate-pulse text-amber-300' : 'text-blue-600 dark:text-blue-400'}`} />
          <span>{isWiringMode ? 'Wiring Mode (On)' : 'Tarik Kabel'}</span>
        </button>

        {/* Sync / Refresh Network Status Button */}
        <button
          onClick={handleSyncRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs transition-colors cursor-pointer"
          title="Sinkronisasi Status Jaringan: Perbarui kondisi kabel dengan interface Mininet (UP/DOWN)"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Sync Jaringan</span>
        </button>

        {/* Auto Layout Button */}
        <button
          onClick={applyAutoLayout}
          className="p-1.5 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs transition-colors cursor-pointer"
          title="Rapikan Layout Topologi Otomatis"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
        </button>
      </div>

      {/* Floating Canvas Helper Info in Clean Theme */}
      <div
        className={`absolute bottom-3 ${
          isSidebarCollapsed ? 'left-28' : 'left-24'
        } pointer-events-none select-none bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2 shadow-xs transition-all z-20`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>Drag node untuk geser • Drag port / klik di Mode Kabel untuk sambungkan Switch, Router, Host</span>
      </div>

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-3.5 py-2 rounded-lg shadow-xl text-xs font-medium border border-slate-700 dark:border-slate-300 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
