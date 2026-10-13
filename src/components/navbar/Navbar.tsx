'use client';

import React, { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { 
  Network, 
  RotateCcw, 
  FileCode, 
  BookOpen, 
  ChevronDown, 
  Terminal,
  Activity,
  Layers,
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
    { id: 'utp-exam-18', name: 'UTP Exam Topology (18 Nodes)', desc: '3 Core Routers triangle mesh, 3 Switches, 6 Edge Routers, 6 Hosts' },
    { id: 'static-routing-4', name: 'Static Routing Lab (4 Nodes)', desc: 'Linear h1 - r1 - r2 - h2 topology' },
    { id: 'blank-canvas', name: 'Blank Canvas / Custom Mode', desc: 'Empty canvas to build custom networks' }
  ];

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand & Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-800">Mininet-IPLab</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Web v2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-none">Computer Network Exam Simulator</p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />

        {/* Status Indicators */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          {/* Active Lab */}
          <div className="px-2.5 py-1 rounded-md bg-slate-100/80 border border-slate-200 text-slate-700 flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px] font-semibold uppercase">Lab:</span>
            <span className="font-medium text-slate-800 truncate max-w-[140px]">{currentPresetName}</span>
          </div>

          {/* Node Count */}
          <div className="px-2.5 py-1 rounded-md bg-slate-100/80 border border-slate-200 text-slate-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-400 text-[10px] font-semibold uppercase">Nodes:</span>
            <span className="font-mono font-bold text-slate-800">{Object.keys(nodes).length}</span>
          </div>

          {/* Active Terminals */}
          <div className="px-2.5 py-1 rounded-md bg-slate-100/80 border border-slate-200 text-slate-700 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-400 text-[10px] font-semibold uppercase">Terminals:</span>
            <span className="font-mono font-bold text-slate-800">{openTerminalTabs.length}</span>
          </div>

          {/* Status Live */}
          <div className="px-2.5 py-1 rounded-md bg-slate-100/80 border border-slate-200 text-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600 text-xs font-medium">Ready</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Preset Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md border border-slate-300 transition-colors shadow-2xs"
          >
            <span>Lab Presets</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {presetDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-lg shadow-lg p-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Choose Topology Preset
              </div>
              {presets.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    loadPreset(p.id);
                    setPresetDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors my-0.5 ${
                    currentPresetId === p.id
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-medium">{p.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{p.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Verify Connectivity Button */}
        <button
          onClick={runVerificationCheck}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          title="Run automated ping and routing verification"
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Verify Lab</span>
        </button>

        {/* Export / Import Button */}
        <button
          onClick={() => setIsConfigModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md border border-slate-300 transition-colors"
          title="Export or Import Topology JSON"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Config</span>
        </button>

        {/* Guide Button */}
        <button
          onClick={() => setActiveSidebarTab('guide')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md border border-slate-300 transition-colors"
          title="Open Lab Objectives & Addressing Guide"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden md:inline">Guide</span>
        </button>

        {/* Reset Lab Button */}
        <button
          onClick={resetLab}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-medium rounded-md border border-slate-300 transition-colors"
          title="Reset current lab topology to default"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Reset</span>
        </button>
      </div>
    </header>
  );
};
