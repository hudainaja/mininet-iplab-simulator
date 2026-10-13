'use client';

import React, { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { X, Copy, Check, Download, Upload, AlertCircle } from 'lucide-react';

export const ConfigModal: React.FC = () => {
  const isConfigModalOpen = useNetworkStore(state => state.isConfigModalOpen);
  const setIsConfigModalOpen = useNetworkStore(state => state.setIsConfigModalOpen);
  const exportTopologyJson = useNetworkStore(state => state.exportTopologyJson);
  const importTopologyJson = useNetworkStore(state => state.importTopologyJson);

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState('');

  if (!isConfigModalOpen) return null;

  const exportText = exportTopologyJson();

  const handleCopy = () => {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mininet-iplab-topology-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    setImportError('');
    const ok = importTopologyJson(importText);
    if (ok) {
      setIsConfigModalOpen(false);
      setImportText('');
    } else {
      setImportError('Invalid JSON format or missing nodes/links structure.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100">Export / Import Topology</h3>
          </div>
          <button
            onClick={() => setIsConfigModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Export JSON
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Import JSON
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {activeTab === 'export' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                You can save your current lab topology and node configurations by copying or downloading this JSON:
              </p>
              <textarea
                readOnly
                value={exportText}
                className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 outline-none resize-none select-all scrollbar-thin scrollbar-thumb-slate-800"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Paste a exported Mininet-IPLab topology JSON below to load it into the canvas:
              </p>
              <textarea
                placeholder='Paste JSON here...'
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 outline-none resize-none scrollbar-thin scrollbar-thumb-slate-800"
              />
              {importError && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
              <div className="flex items-center justify-end">
                <button
                  onClick={handleImportSubmit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Load Topology</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
