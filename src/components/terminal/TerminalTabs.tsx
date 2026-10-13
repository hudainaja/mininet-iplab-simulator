'use client';

import React from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { 
  X, 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  Trash2, 
  Maximize2, 
  Minimize2, 
  ChevronRight,
  Terminal as TerminalIcon,
  Server,
  Network,
  Laptop
} from 'lucide-react';

export const TerminalTabs: React.FC = () => {
  const openTerminalTabs = useNetworkStore(state => state.openTerminalTabs);
  const activeTerminalNodeId = useNetworkStore(state => state.activeTerminalNodeId);
  const setActiveTerminal = useNetworkStore(state => state.setActiveTerminal);
  const closeTerminalTab = useNetworkStore(state => state.closeTerminalTab);
  const openTerminal = useNetworkStore(state => state.openTerminal);
  const nodes = useNetworkStore(state => state.nodes);
  const clearTerminalBuffer = useNetworkStore(state => state.clearTerminalBuffer);
  const setTerminalFontSize = useNetworkStore(state => state.setTerminalFontSize);
  const terminalFontSize = useNetworkStore(state => state.terminalFontSize);
  const isTerminalMaximized = useNetworkStore(state => state.isTerminalMaximized);
  const toggleTerminalMaximize = useNetworkStore(state => state.toggleTerminalMaximize);
  const toggleTerminalCollapse = useNetworkStore(state => state.toggleTerminalCollapse);

  const availableNodesToOpen = Object.values(nodes).filter(
    n => !openTerminalTabs.includes(n.id)
  );

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'router':
        return <Server className="w-3.5 h-3.5 text-sky-400" />;
      case 'switch':
        return <Network className="w-3.5 h-3.5 text-amber-400" />;
      case 'host':
        return <Laptop className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <TerminalIcon className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex items-center justify-between bg-slate-900 border-b border-slate-700 px-2 py-1 select-none">
      {/* Scrollable Tab List */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
        {openTerminalTabs.map(nodeId => {
          const node = nodes[nodeId];
          if (!node) return null;
          const isActive = nodeId === activeTerminalNodeId;

          return (
            <div
              key={nodeId}
              onClick={() => setActiveTerminal(nodeId)}
              className={`group flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-slate-800 text-slate-100 border-slate-700 shadow-xs font-semibold'
                  : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              {getNodeIcon(node.type)}
              <span>{node.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminalTab(nodeId);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 rounded p-0.5 transition-opacity"
                title="Close Tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Add Tab Dropdown if any unopened nodes exist */}
        {availableNodesToOpen.length > 0 && (
          <div className="relative group/add">
            <button
              className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Open Node Terminal"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <div className="absolute left-0 top-full mt-1 hidden group-hover/add:flex flex-col bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50 min-w-[140px] max-h-56 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Open Terminal
              </div>
              {availableNodesToOpen.map(node => (
                <button
                  key={node.id}
                  onClick={() => openTerminal(node.id)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-slate-300 hover:bg-slate-800 hover:text-white text-left transition-colors"
                >
                  {getNodeIcon(node.type)}
                  <span>{node.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Terminal Controls: Zoom, Clear, Maximize */}
      <div className="flex items-center gap-1 pl-2 border-l border-slate-800 shrink-0">
        <button
          onClick={() => setTerminalFontSize(-1)}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors"
          title={`Zoom Out (${terminalFontSize}px)`}
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono text-slate-400 min-w-[20px] text-center">
          {terminalFontSize}
        </span>
        <button
          onClick={() => setTerminalFontSize(1)}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors"
          title={`Zoom In (${terminalFontSize}px)`}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            if (activeTerminalNodeId) clearTerminalBuffer(activeTerminalNodeId);
          }}
          className="p-1 ml-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-850 transition-colors"
          title="Clear Buffer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={toggleTerminalMaximize}
          className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
          title={isTerminalMaximized ? "Restore Size" : "Maximize Terminal"}
        >
          {isTerminalMaximized ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          onClick={toggleTerminalCollapse}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Minimize Terminal Panel"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
