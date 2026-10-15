'use client';

import React, { useState, useRef } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { 
  Network, 
  RotateCcw, 
  FileCode, 
  BookOpen, 
  ChevronDown, 
  Activity,
  Sun,
  Moon,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import { getCustomPresets, deleteCustomPreset } from '../../engine/dynamicLayoutEngine';

export const Navbar: React.FC = () => {
  const isDarkMode = useNetworkStore(state => state.isDarkMode);
  const toggleDarkMode = useNetworkStore(state => state.toggleDarkMode);
  const currentPresetName = useNetworkStore(state => state.currentPresetName);
  const currentPresetId = useNetworkStore(state => state.currentPresetId);
  const loadPreset = useNetworkStore(state => state.loadPreset);
  const resetLab = useNetworkStore(state => state.resetLab);
  const setIsConfigModalOpen = useNetworkStore(state => state.setIsConfigModalOpen);
  const runVerificationCheck = useNetworkStore(state => state.runVerificationCheck);
  const setActiveSidebarTab = useNetworkStore(state => state.setActiveSidebarTab);
  const exportTopologyJson = useNetworkStore(state => state.exportTopologyJson);
  const importTopologyJson = useNetworkStore(state => state.importTopologyJson);

  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = [
    { id: 'utp-exam-18', name: 'UTP Exam Topology (18 Nodes)', desc: '3 Core Routers triangle mesh, 3 Switches, 6 Edge Routers, 6 Hosts' },
    { id: 'static-routing-4', name: 'Static Routing Lab (4 Nodes)', desc: 'Linear h1 - r1 - r2 - h2 topology' },
    { id: 'blank-canvas', name: 'Blank Canvas / Custom Mode', desc: 'Empty canvas to build custom networks' }
  ];

  // Handle instant Export Lab download
  const handleExportLab = () => {
    const json = exportTopologyJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mininet-lab-${currentPresetId}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage(`Snapshot lab berhasil di-unduh (${a.download})`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle instant Import Lab upload
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importTopologyJson(content);
        if (ok) {
          setToastMessage(`Lab berhasil di-restore dari "${file.name}"!`);
          setTimeout(() => setToastMessage(null), 3500);
        } else {
          alert('Gagal meng-import lab: Format file JSON tidak valid atau struktur nodes/links rusak.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between select-none z-30 shrink-0 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Brand & Unified Lab Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Network className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100">Mininet-IPLab</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                v2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">Computer Network Exam Simulator</p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Unified Lab Dropdown Selector */}
        <div className="relative">
          <button
            onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-all shadow-2xs cursor-pointer"
            title="Pilih Topologi Lab / Preset"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 hidden md:inline">Lab:</span>
            <span className="font-semibold truncate max-w-[160px] sm:max-w-[220px]">{currentPresetName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {presetDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                Pilih Preset Topologi Lab
              </div>
              {presets.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    loadPreset(p.id);
                    setPresetDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors my-0.5 cursor-pointer ${
                    currentPresetId === p.id
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="font-medium">{p.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{p.desc}</div>
                </button>
              ))}

              {(() => {
                const customPresets = getCustomPresets();
                if (customPresets.length === 0) return null;
                return (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-t border-slate-100 dark:border-slate-800 mt-1.5">
                      Preset Kustom Tersimpan
                    </div>
                    {customPresets.map(cp => (
                      <div
                        key={cp.id}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-md my-0.5 transition-colors ${
                          currentPresetId === cp.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <button
                          onClick={() => {
                            loadPreset(cp.id);
                            setPresetDropdownOpen(false);
                          }}
                          className="text-left text-xs flex-1 truncate cursor-pointer mr-2"
                        >
                          <div className="font-medium truncate">{cp.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                            {cp.description || `${Object.keys(cp.nodes).length} Nodes`}
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomPreset(cp.id);
                            setPresetDropdownOpen(false);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                          title="Hapus Preset Kustom"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Verify Connectivity Button - Primary CTA */}
        <button
          onClick={runVerificationCheck}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          title="Uji konektivitas otomatis (Ping, OSPF, BGP, VLAN)"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Verify Lab</span>
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Export Lab Button (Download JSON Snapshot) */}
        <button
          onClick={handleExportLab}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          title="Export Lab: Download snapshot state lengkap (posisi topologi, link, IP, routing, riwayat)"
        >
          <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden md:inline">Export Lab</span>
        </button>

        {/* Import Lab Button (Upload JSON Backup) */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          title="Import Lab: Upload file JSON backup untuk restore seluruh topologi dan konfigurasi"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden md:inline">Import Lab</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportFileChange}
          className="hidden"
        />

        {/* Config / JSON Modal */}
        <button
          onClick={() => setIsConfigModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          title="Buka Config Manager: Lihat snapshot JSON, dump running-config seluruh node, atau Apply Batch CLI"
        >
          <FileCode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span className="hidden sm:inline">Config</span>
        </button>

        {/* Guide Button */}
        <button
          onClick={() => setActiveSidebarTab('guide')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          title="Buka Panduan Modul Lab & Addressing"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Guide</span>
        </button>

        {/* Auto-Save Indicator */}
        <span
          className="hidden lg:inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium rounded-md border border-emerald-200 dark:border-emerald-800/50 select-none"
          title="Auto-Save aktif: Perubahan posisi topologi, IP, dan routing otomatis tersimpan di browser (localStorage)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Auto-Saved
        </span>

        {/* Reset Lab Button (Clears localStorage auto-save) */}
        <button
          onClick={() => {
            if (window.confirm('Reset Lab?\nSemua konfigurasi IP, routing, dan posisi node akan dihapus.\nState tersimpan di localStorage juga akan dihapus dan dikembalikan ke topologi awal.')) {
              resetLab();
              setToastMessage('Lab berhasil di-reset ke kondisi awal.');
              setTimeout(() => setToastMessage(null), 3000);
            }
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          title="Reset Lab — Hapus semua konfigurasi dan kembalikan topologi ke kondisi awal (termasuk auto-save)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Lab</span>
        </button>

        {/* Dark Mode Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
        </button>
      </div>

      {/* Floating Toast Notification Alert */}
      {toastMessage && (
        <div className="absolute top-16 right-4 z-50 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-3.5 py-2 rounded-lg shadow-xl text-xs font-medium border border-slate-700 dark:border-slate-300 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </header>
  );
};
