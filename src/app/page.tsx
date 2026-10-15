'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/navbar/Navbar';
import { Sidebar } from '../components/sidebar/Sidebar';
import { NetworkCanvas } from '../components/canvas/NetworkCanvas';
import { TerminalWindow } from '../components/terminal/TerminalWindow';
import { ConfigModal } from '../components/navbar/ConfigModal';
import { VerificationModal } from '../components/navbar/VerificationModal';
import { useNetworkStore } from '../store/useNetworkStore';
import { PanelLeftOpen, Terminal } from 'lucide-react';

export default function Home() {
  const isTerminalMaximized = useNetworkStore(state => state.isTerminalMaximized);
  const isSidebarCollapsed = useNetworkStore(state => state.isSidebarCollapsed);
  const sidebarWidth = useNetworkStore(state => state.sidebarWidth);
  const setSidebarWidth = useNetworkStore(state => state.setSidebarWidth);
  const toggleSidebarCollapse = useNetworkStore(state => state.toggleSidebarCollapse);

  const isTerminalCollapsed = useNetworkStore(state => state.isTerminalCollapsed);
  const terminalWidth = useNetworkStore(state => state.terminalWidth);
  const setTerminalWidth = useNetworkStore(state => state.setTerminalWidth);
  const toggleTerminalCollapse = useNetworkStore(state => state.toggleTerminalCollapse);
  const activeTerminalNodeId = useNetworkStore(state => state.activeTerminalNodeId);

  const restoreAutoSave = useNetworkStore(state => state.restoreAutoSave);

  const [mounted, setMounted] = useState(false);
  const [isResizing, setIsResizing] = useState<'sidebar' | 'terminal' | null>(null);

  useEffect(() => {
    restoreAutoSave();
    setMounted(true);
  }, [restoreAutoSave]);

  // Drag-to-resize Sidebar (range: 240px to 450px)
  const startResizeSidebar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing('sidebar');

    const onMouseMove = (moveEvent: MouseEvent) => {
      setSidebarWidth(moveEvent.clientX);
    };

    const onMouseUp = () => {
      setIsResizing(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [setSidebarWidth]);

  // Drag-to-resize Terminal (range: 350px to 700px)
  const startResizeTerminal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing('terminal');

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = window.innerWidth - moveEvent.clientX;
      setTerminalWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsResizing(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [setTerminalWidth]);

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-600 font-mono text-sm">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-blue-600 animate-ping" />
          <span>Initializing Mininet-IPLab Virtual Topology & CLI Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans transition-colors ${
      isResizing ? 'select-none cursor-col-resize' : ''
    }`}>
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar Panel (Collapsible & Resizable) */}
        {!isSidebarCollapsed && (
          <div
            style={{ width: `${sidebarWidth}px` }}
            className="h-full shrink-0 relative flex"
          >
            <Sidebar />
            {/* Drag Handle on right edge */}
            <div
              onMouseDown={startResizeSidebar}
              className="absolute -right-1 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-blue-500/30 transition-colors z-20 flex items-center justify-center group"
              title="Drag to resize sidebar"
            >
              <div className="w-0.5 h-8 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-500 transition-colors" />
            </div>
          </div>
        )}

        {/* Center Area: Topology Canvas (Fills 100% when side panels are collapsed) */}
        <div className="flex-1 h-full relative overflow-hidden">
          <NetworkCanvas />

          {/* Floating Expand Sidebar Button when collapsed */}
          {isSidebarCollapsed && (
            <button
              onClick={toggleSidebarCollapse}
              title="Expand Sidebar"
              className="absolute top-3 left-3 z-30 px-2.5 py-1.5 bg-white/95 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <PanelLeftOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Sidebar</span>
            </button>
          )}

          {/* Floating Quick-Open Terminal Button when collapsed */}
          {isTerminalCollapsed && (
            <button
              onClick={toggleTerminalCollapse}
              title="Open Terminal Panel"
              className="absolute bottom-4 right-4 z-30 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 rounded-lg shadow-lg flex items-center gap-2 text-xs font-mono font-medium cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Terminal className="w-4 h-4 text-sky-400" />
              <span>Open Terminal {activeTerminalNodeId ? `[${activeTerminalNodeId}]` : ''}</span>
            </button>
          )}
        </div>

        {/* Right Side: Terminal Window (Collapsible, Resizable, or Fullscreen when maximized) */}
        {!isTerminalCollapsed && (
          <div
            style={{ width: isTerminalMaximized ? '100%' : `${terminalWidth}px` }}
            className={`${
              isTerminalMaximized
                ? 'fixed inset-0 z-50'
                : 'h-full border-l border-slate-200 dark:border-slate-800 shrink-0 relative flex'
            }`}
          >
            {/* Drag Handle on left edge */}
            {!isTerminalMaximized && (
              <div
                onMouseDown={startResizeTerminal}
                className="absolute -left-1.5 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-blue-500/30 transition-colors z-20 flex items-center justify-center group"
                title="Drag to resize terminal"
              >
                <div className="w-0.5 h-8 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-500 transition-colors" />
              </div>
            )}
            <TerminalWindow />
          </div>
        )}
      </div>

      {/* Global Modals */}
      <ConfigModal />
      <VerificationModal />
    </div>
  );
}
