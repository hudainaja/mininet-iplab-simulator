'use client';

import React from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { X, CheckCircle2, XCircle, AlertTriangle, Activity, RefreshCw } from 'lucide-react';

export const VerificationModal: React.FC = () => {
  const isVerificationModalOpen = useNetworkStore(state => state.isVerificationModalOpen);
  const setIsVerificationModalOpen = useNetworkStore(state => state.setIsVerificationModalOpen);
  const verificationResults = useNetworkStore(state => state.verificationResults);
  const runVerificationCheck = useNetworkStore(state => state.runVerificationCheck);

  if (!isVerificationModalOpen) return null;

  const passedCount = verificationResults.filter(r => r.status === 'passed').length;
  const totalCount = verificationResults.length;
  const isAllPassed = passedCount === totalCount && totalCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg border ${isAllPassed ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Automated Network Verification</h3>
              <p className="text-[11px] text-slate-500">
                End-to-end multi-hop connectivity, OSPF neighbor reachability, and 6in4 SIT Tunnel check
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsVerificationModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score Summary */}
        <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Test Score:</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold font-mono ${isAllPassed ? 'text-emerald-600' : 'text-amber-600'}`}>
                {passedCount} / {totalCount} Passed
              </span>
              <span className="text-xs text-slate-500">
                ({totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0}%)
              </span>
            </div>
          </div>

          <button
            onClick={runVerificationCheck}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-run Tests</span>
          </button>
        </div>

        {/* Results List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-2.5 bg-slate-50/50">
          {verificationResults.map((r, idx) => (
            <div
              key={idx}
              className={`flex items-start justify-between p-3 rounded-lg border text-xs transition-all ${
                r.status === 'passed'
                  ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                  : 'bg-rose-50/60 border-rose-200 text-slate-800'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {r.status === 'passed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-800">{r.test}</div>
                  <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                    Source: <span className="text-slate-900 font-bold">{r.source}</span> ➔ Target IP:{' '}
                    <span className="text-slate-900 font-bold">{r.target}</span>
                  </div>
                  <div className="text-[11px] mt-1 text-slate-500">{r.detail}</div>
                </div>
              </div>

              <div className={`shrink-0 font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border ml-3 ${
                r.status === 'passed' 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                  : 'bg-rose-100 text-rose-800 border-rose-200'
              }`}>
                {r.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
