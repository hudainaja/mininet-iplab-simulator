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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Export / Import Topology</h3>
          </div>
          <button
            onClick={() => setIsConfigModalOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Export JSON
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Import JSON
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {activeTab === 'export' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                You can save your current lab topology and node configurations by copying or downloading this JSON:
              </p>
              <textarea
                readOnly
                value={exportText}
                className="w-full h-64 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-800 outline-none resize-none select-all"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Paste an exported Mininet-IPLab topology JSON below to load it into the canvas:
              </p>
              <textarea
                placeholder='Paste JSON here...'
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full h-64 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-800 outline-none resize-none"
              />
              {importError && (
                <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-md">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
              <div className="flex items-center justify-end">
                <button
                  onClick={handleImportSubmit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
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
