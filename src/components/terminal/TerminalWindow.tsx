'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { getPrompt } from '../../engine/cliParser';
import { TerminalTabs } from './TerminalTabs';
import { Terminal as TerminalIcon } from 'lucide-react';

export const TerminalWindow: React.FC = () => {
  const activeTerminalNodeId = useNetworkStore(state => state.activeTerminalNodeId);
  const nodes = useNetworkStore(state => state.nodes);
  const terminalFontSize = useNetworkStore(state => state.terminalFontSize);
  const executeTerminalCommand = useNetworkStore(state => state.executeTerminalCommand);
  const isTerminalMaximized = useNetworkStore(state => state.isTerminalMaximized);

  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeNode = activeTerminalNodeId ? nodes[activeTerminalNodeId] : null;

  // Auto-scroll on new buffer items
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeNode?.terminalBuffer.length]);

  // Focus input on active tab change
  useEffect(() => {
    inputRef.current?.focus();
    setInputVal('');
    setHistoryIndex(null);
  }, [activeTerminalNodeId]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeNode) return;
    executeTerminalCommand(inputVal);
    setInputVal('');
    setHistoryIndex(null);
  }, [activeNode, executeTerminalCommand, inputVal]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!activeNode) return;

    // Up Arrow (History Backwards)
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const history = activeNode.commandHistory;
      if (history.length === 0) return;

      if (historyIndex === null) {
        const newIdx = history.length - 1;
        setHistoryIndex(newIdx);
        setInputVal(history[newIdx]);
      } else if (historyIndex > 0) {
        const newIdx = historyIndex - 1;
        setHistoryIndex(newIdx);
        setInputVal(history[newIdx]);
      }
    }

    // Down Arrow (History Forwards)
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const history = activeNode.commandHistory;
      if (historyIndex !== null) {
        if (historyIndex < history.length - 1) {
          const newIdx = historyIndex + 1;
          setHistoryIndex(newIdx);
          setInputVal(history[newIdx]);
        } else {
          setHistoryIndex(null);
          setInputVal('');
        }
      }
    }

    // Tab (Autocompletion)
    if (e.key === 'Tab') {
      e.preventDefault();
      const current = inputVal.trim().toLowerCase();
      let candidates: string[] = [];

      if (activeNode.type === 'router') {
        candidates = [
          'enable', 'disable', 'configure terminal', 'conf t',
          'interface', 'ip address', 'no shutdown', 'shutdown',
          'ip ospf cost', 'router ospf', 'ospf router-id', 'network',
          'router bgp', 'bgp router-id', 'neighbor',
          'show interface brief', 'show ip route', 'show ip route ospf',
          'show ip ospf neighbor', 'show ip bgp summary', 'show ip bgp',
          'show running-config', 'write memory', 'ping', 'traceroute', 'exit', 'end'
        ];
      } else if (activeNode.type === 'switch') {
        candidates = [
          'ovs-vsctl show', 'ovs-vsctl set port', 'ovs-vsctl remove port',
          'ovs-ofctl dump-flows', 'show interface', 'clear', 'help'
        ];
      } else {
        candidates = [
          'ip addr show', 'ip addr add', 'ip -6 addr add', 'ip link set',
          'ip route add default via', 'ip route add', 'ip -6 route add',
          'ip tunnel add', 'ip tunnel show', 'ping', 'ping6', 'traceroute', 'clear', 'help'
        ];
      }

      const match = candidates.find(c => c.toLowerCase().startsWith(current));
      if (match) {
        setInputVal(match + ' ');
      }
    }

    // Ctrl+L (Clear Screen)
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      executeTerminalCommand('clear');
    }
  }, [activeNode, historyIndex, inputVal, executeTerminalCommand]);

  if (!activeNode) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 dark:bg-slate-950 text-slate-400 font-mono text-sm p-4">
        <TerminalIcon className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
        <p>No active terminal selected.</p>
        <p className="text-xs text-slate-500 mt-1">Click any node on the topology to open its console.</p>
      </div>
    );
  }

  const prompt = getPrompt(activeNode);

  // Quick Command Snippets based on node type
  const quickSnippets = activeNode.type === 'router'
    ? [
        { label: 'sh ip ospf neigh', cmd: 'show ip ospf neighbor' },
        { label: 'sh ip route ospf', cmd: 'show ip route ospf' },
        { label: 'sh ip bgp sum', cmd: 'show ip bgp summary' },
        { label: 'sh ip bgp', cmd: 'show ip bgp' },
        { label: 'sh int br', cmd: 'show interface brief' },
        { label: 'sh run', cmd: 'show running-config' },
        { label: 'ping 192.168.31.2', cmd: 'ping 192.168.31.2' },
      ]
    : activeNode.type === 'switch'
    ? [
        { label: 'ovs-vsctl show', cmd: 'ovs-vsctl show' },
        { label: 'tag port eth2=10', cmd: 'ovs-vsctl set port ' + activeNode.name + '-eth2 tag=10' },
        { label: 'tag port eth3=20', cmd: 'ovs-vsctl set port ' + activeNode.name + '-eth3 tag=20' },
        { label: 'ovs-ofctl dump-flows', cmd: 'ovs-ofctl dump-flows ' + activeNode.name },
        { label: 'show interface', cmd: 'show interface' },
      ]
    : [
        { label: 'ip addr show', cmd: 'ip addr show' },
        { label: 'ip route show', cmd: 'ip route show' },
        { label: 'ping 192.168.31.2', cmd: 'ping 192.168.31.2' },
        { label: 'ping6 2001:db8:200::10', cmd: 'ping6 2001:db8:200::10' },
        { label: 'traceroute 192.168.31.2', cmd: 'traceroute 192.168.31.2' },
        { label: 'ip tunnel show', cmd: 'ip tunnel show' },
      ];

  return (
    <div className={`w-full h-full flex flex-col bg-slate-900 dark:bg-slate-950 border-l border-slate-700 dark:border-slate-800 text-slate-100 font-mono select-text transition-colors ${
      isTerminalMaximized ? 'fixed inset-0 z-50 shadow-2xl' : ''
    }`}>
      {/* Top Tab Bar */}
      <TerminalTabs />

      {/* Terminal Output Area */}
      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        style={{ fontSize: `${terminalFontSize}px`, lineHeight: 1.5 }}
        className="flex-1 p-3.5 overflow-y-auto space-y-1 bg-slate-900 dark:bg-slate-950 cursor-text select-text scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent text-slate-100"
      >
        {activeNode.terminalBuffer.map((item, index) => {
          let colorClass = 'text-slate-100';
          if (item.type === 'error' || item.text.startsWith('%')) {
            colorClass = 'text-rose-400 font-medium';
          } else if (item.type === 'success') {
            colorClass = 'text-emerald-400';
          } else if (item.type === 'system') {
            colorClass = 'text-sky-300';
          } else if (item.type === 'banner') {
            colorClass = 'text-slate-400 italic border-l border-slate-600 pl-2 my-1';
          }

          return (
            <div key={index} className={`whitespace-pre-wrap break-all ${colorClass}`}>
              {item.text}
            </div>
          );
        })}

        {/* Live Input Line with clear muted prompt colors */}
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5 pt-1">
          <span className={`shrink-0 font-bold select-none ${
            activeNode.type === 'router'
              ? 'text-sky-400'
              : activeNode.type === 'switch'
              ? 'text-amber-400'
              : 'text-emerald-400'
          }`}>
            {prompt}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent text-slate-100 border-none outline-none font-mono caret-sky-400 p-0 m-0 text-inherit"
          />
        </form>
      </div>

      {/* Quick Action Snippets Bar (Slate pill buttons) */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-950 border-t border-slate-700 dark:border-slate-800 overflow-x-auto scrollbar-none text-xs">
        <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold shrink-0">Quick:</span>
        {quickSnippets.map((item, i) => (
          <button
            key={i}
            onClick={() => executeTerminalCommand(item.cmd)}
            className="px-2 py-0.5 rounded bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 text-slate-300 hover:text-white transition-colors shrink-0 font-mono border border-slate-700 dark:border-slate-800 text-xs cursor-pointer"
            title={`Run: ${item.cmd}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
