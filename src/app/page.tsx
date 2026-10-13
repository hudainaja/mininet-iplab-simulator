'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/navbar/Navbar';
import { Sidebar } from '../components/sidebar/Sidebar';
import { NetworkCanvas } from '../components/canvas/NetworkCanvas';
import { TerminalWindow } from '../components/terminal/TerminalWindow';
import { ConfigModal } from '../components/navbar/ConfigModal';
import { VerificationModal } from '../components/navbar/VerificationModal';
import { useNetworkStore } from '../store/useNetworkStore';

export default function Home() {
  const isTerminalMaximized = useNetworkStore(state => state.isTerminalMaximized);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center Area: Topology Canvas */}
        <div className="flex-1 h-full relative overflow-hidden">
          <NetworkCanvas />
        </div>

        {/* Right Side: Terminal Window (or Fullscreen when maximized) */}
        <div
          className={`${
            isTerminalMaximized
              ? 'fixed inset-0 z-50'
              : 'w-[480px] xl:w-[560px] h-full border-l border-slate-200 shrink-0'
          }`}
        >
          <TerminalWindow />
        </div>
      </div>

      {/* Global Modals */}
      <ConfigModal />
      <VerificationModal />
    </div>
  );
}
