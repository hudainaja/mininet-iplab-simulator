'use client';

import React, { useState, useEffect } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  AlertCircle, 
  FileCode, 
  Terminal, 
  CheckCircle2, 
  Play,
  FileText
} from 'lucide-react';

export const ConfigModal: React.FC = () => {
  const isConfigModalOpen = useNetworkStore(state => state.isConfigModalOpen);
  const setIsConfigModalOpen = useNetworkStore(state => state.setIsConfigModalOpen);
  const exportTopologyJson = useNetworkStore(state => state.exportTopologyJson);
  const importTopologyJson = useNetworkStore(state => state.importTopologyJson);
  const exportAllConfigsDump = useNetworkStore(state => state.exportAllConfigsDump);
  const applyBatchCliCommands = useNetworkStore(state => state.applyBatchCliCommands);
  const currentPresetId = useNetworkStore(state => state.currentPresetId);
  const nodes = useNetworkStore(state => state.nodes);

  const [activeTab, setActiveTab] = useState<'json-export' | 'json-import' | 'node-dumps' | 'apply-batch'>('node-dumps');
  const [importJsonText, setImportJsonText] = useState('');
  const [batchCliText, setBatchCliText] = useState('');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reset local state when modal opens
  useEffect(() => {
    if (isConfigModalOpen) {
      setStatusMessage(null);
    }
  }, [isConfigModalOpen]);

  if (!isConfigModalOpen) return null;

  const nodeCount = Object.keys(nodes).length;
  const currentJsonDump = exportTopologyJson();
  const currentConfigsDump = exportAllConfigsDump();

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([currentJsonDump], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mininet-lab-${currentPresetId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadConfigDump = () => {
    const blob = new Blob([currentConfigsDump], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mininet-all-nodes-config-${Date.now()}.cfg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    setStatusMessage(null);
    if (!importJsonText.trim()) {
      setStatusMessage({ type: 'error', text: 'Silakan tempel (paste) kode JSON terlebih dahulu.' });
      return;
    }
    const success = importTopologyJson(importJsonText);
    if (success) {
      setStatusMessage({ type: 'success', text: 'Topologi dan konfigurasi node berhasil di-restore!' });
      setTimeout(() => {
        setIsConfigModalOpen(false);
        setImportJsonText('');
      }, 1000);
    } else {
      setStatusMessage({ type: 'error', text: 'Format JSON tidak valid atau struktur nodes/links tidak lengkap.' });
    }
  };

  const handleApplyBatchCli = () => {
    setStatusMessage(null);
    if (!batchCliText.trim()) {
      setStatusMessage({ type: 'error', text: 'Silakan masukkan perintah CLI atau konfigurasi terlebih dahulu.' });
      return;
    }
    const result = applyBatchCliCommands(batchCliText);
    if (result.errors.length === 0) {
      setStatusMessage({
        type: 'success',
        text: `Sukses! Berhasil menerapkan ${result.successCount} konfigurasi/perintah ke seluruh node terkait.`
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: `Diterapkan sebagian (${result.successCount} perintah). Kendala: ${result.errors.join(', ')}`
      });
    }
  };

  const handleLoadSampleBatch = () => {
    const sample = `! Contoh Batch Configuration untuk Multi-Node
! Format yang didukung:
!   "! Node: <nama_node>" atau "# Node: <nama_node>" atau "[<nama_node>]"

! Node: r1
conf t
interface eth0
ip address 10.12.0.1/24
no shutdown
exit
router ospf 1
network 10.12.0.0/24 area 0
end

! Node: h1
ip addr add 192.168.1.10/24 dev eth0
ip route add default via 192.168.1.1
`;
    setBatchCliText(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-colors">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Lab Configuration & Persistence Manager
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  {nodeCount} Nodes
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Backup snapshot JSON, lihat running-config seluruh node, atau Apply batch config sekaligus
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsConfigModalOpen(false)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/90 px-4 pt-1.5 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('node-dumps')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'node-dumps'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-white dark:bg-slate-850 rounded-t-md'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>All Node Configs Dump</span>
          </button>

          <button
            onClick={() => setActiveTab('apply-batch')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'apply-batch'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-white dark:bg-slate-850 rounded-t-md'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Apply / Paste All Config</span>
          </button>

          <button
            onClick={() => setActiveTab('json-export')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'json-export'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-white dark:bg-slate-850 rounded-t-md'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Snapshot JSON</span>
          </button>

          <button
            onClick={() => setActiveTab('json-import')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'json-import'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-white dark:bg-slate-850 rounded-t-md'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Snapshot JSON</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* Status Alert if any */}
          {statusMessage && (
            <div
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: ALL NODE CONFIGS DUMP */}
          {activeTab === 'node-dumps' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Running-Config & State Dump Seluruh Node
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kompilasi CLI config aktif (FRR Cisco format untuk router, OVS command untuk switch, Linux ip untuk host).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(currentConfigsDump, 'dump')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedType === 'dump' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy All</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadConfigDump}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .cfg</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={currentConfigsDump}
                className="w-full h-80 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none resize-none select-all focus:ring-1 focus:ring-blue-500 leading-relaxed"
              />
            </div>
          )}

          {/* TAB 2: APPLY / PASTE BATCH CONFIG */}
          {activeTab === 'apply-batch' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Paste / Terapkan Konfigurasi Sekali Klik
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tempelkan batch script CLI (dengan tag <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">! Node: r1</code>) atau tempelkan JSON snapshot langsung.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSampleBatch}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Muat Contoh Format
                </button>
              </div>

              <textarea
                placeholder={`! Tempelkan baris konfigurasi CLI di sini...
! Node: r1
conf t
interface eth0
ip address 10.12.0.1/24
no shutdown
exit
end`}
                value={batchCliText}
                onChange={(e) => setBatchCliText(e.target.value)}
                className="w-full h-72 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none resize-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tip: Perintah akan dieksekusi secara otomatis dan disinkronkan ke canvas serta auto-save.
                </div>
                <button
                  onClick={handleApplyBatchCli}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Apply All Configs to Lab</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: EXPORT SNAPSHOT JSON */}
          {activeTab === 'json-export' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Snapshot JSON Topologi & State Lab
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Menyimpan koordinat (x, y), links, interface ports, routing tables, dan riwayat terminal buffer.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(currentJsonDump, 'json')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedType === 'json' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .json</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={currentJsonDump}
                className="w-full h-80 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none resize-none select-all focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* TAB 4: IMPORT SNAPSHOT JSON */}
          {activeTab === 'json-import' && (
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Restore Lab dari JSON
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tempelkan file JSON backup topologi di bawah ini untuk me-restore seluruh topologi dan konfigurasi seketika.
                </p>
              </div>

              <textarea
                placeholder='Tempelkan JSON snapshot di sini...'
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="w-full h-72 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none resize-none focus:ring-1 focus:ring-blue-500"
              />

              <div className="flex items-center justify-end">
                <button
                  onClick={handleImportJson}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restore Lab Topology</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Info */}
        <div className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/40 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Auto-Save localStorage aktif (~500ms debounce)</span>
          </div>
          <button
            onClick={() => setIsConfigModalOpen(false)}
            className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
