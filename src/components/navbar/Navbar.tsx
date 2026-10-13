'use client';

import React, { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { 
  Network, 
  RotateCcw, 
  CheckCircle, 
  FileCode, 
  BookOpen, 
  ChevronDown, 
  Terminal,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const currentPresetName = useNetworkStore(state => state.currentPresetName);
  const currentPresetId = useNetworkStore(state => state.currentPresetId);
  const loadPreset = useNetworkStore(state => state.loadPreset);
  const resetLab = useNetworkStore(state => state.resetLab);
  const nodes = useNetworkStore(state => state.nodes);
  const openTerminalTabs = useNetworkStore(state => state.openTerminalTabs);
  const setIsConfigModalOpen = useNetworkStore(state => state.setIsConfigModalOpen);
  const runVerificationCheck = useNetworkStore(state => state.runVerificationCheck);
  const setActiveSidebarTab = useNetworkStore(state => state.setActiveSidebarTab);

  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);

  const presets = [
    { id: 'utp-exam-18', name: 'UTP Exam Topology (18 Nodes)', desc: 'Full Mesh 3 Core Routers, 3 Switches, 6 Edge Routers, 6 Hosts' },
    { id: 'static-routing-4', name: 'Static Routing Lab (4 Nodes)', desc: 'Linear h1 - r1 - r2 - h2 topology' },
    { id: 'blank-canvas', name: 'Blank Canvas / Custom Mode', desc: 'Empty canvas to build custom networks' }
  ];

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand & Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white">Mininet-IPLab</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Web v2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-none">UB Computer Network Exam Simulator</p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-slate-800 mx-1 hidden md:block" />

        {/* Status Indicators */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          {/* Active Lab */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-300 flex items-center gap-1.5">
            <span className="text-slate-500 text-[10px] font-semibold uppercase">Lab:</span>
            <span className="font-medium text-slate-200 truncate max-w-[140px]">{currentPresetName}</span>
          </div>

          {/* Node Count */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-500 text-[10px] font-semibold uppercase">Nodes:</span>
            <span className="font-mono font-bold text-slate-200">{Object.keys(nodes).length}</span>
          </div>

          {/* Active Terminals */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-300 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-500 text-[10px] font-semibold uppercase">Terminals:</span>
            <span className="font-mono font-bold text-slate-200">{openTerminalTabs.length}</span>
          </div>

          {/* Status Live */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-xs font-medium">Simulation Active</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Preset Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700/60 transition-colors shadow-sm"
          >
            <span>Lab Presets</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {presetDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800">
                Choose Topology Preset
              </div>
              {presets.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    loadPreset(p.id);
                    setPresetDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors my-0.5 ${
                    currentPresetId === p.id
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold">{p.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{p.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Verify Connectivity Button */}
        <button
          onClick={runVerificationCheck}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-600/20 transition-all active:scale-95"
          title="Run automated ping and routing verification"
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Verify Lab</span>
        </button>

        {/* Export / Import Button */}
        <button
          onClick={() => setIsConfigModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700/60 transition-colors"
          title="Export or Import Topology JSON"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Config</span>
        </button>

        {/* Guide Button */}
        <button
          onClick={() => setActiveSidebarTab('guide')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700/60 transition-colors"
          title="Open Lab Objectives & Addressing Guide"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline">Guide</span>
        </button>

        {/* Reset Lab Button */}
        <button
          onClick={resetLab}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 text-xs font-medium rounded-lg border border-slate-700/60 transition-colors"
          title="Reset current lab topology to default"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Reset</span>
        </button>
      </div>
    </header>
  );
};
