'use client';

import React, { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { LAB_GUIDES } from '../../docs/labGuides';
import { 
  Server, 
  Network, 
  Laptop, 
  BookOpen, 
  Layers, 
  PlusCircle, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const activeSidebarTab = useNetworkStore(state => state.activeSidebarTab);
  const setActiveSidebarTab = useNetworkStore(state => state.setActiveSidebarTab);
  const nodes = useNetworkStore(state => state.nodes);
  const selectedNodeId = useNetworkStore(state => state.selectedNodeId);
  const selectNode = useNetworkStore(state => state.selectNode);
  const openTerminal = useNetworkStore(state => state.openTerminal);
  const selectedGuideId = useNetworkStore(state => state.selectedGuideId);
  const setSelectedGuide = useNetworkStore(state => state.setSelectedGuide);
  const addNode = useNetworkStore(state => state.addNode);

  // Accordion state
  const [coreOpen, setCoreOpen] = useState(true);
  const [edgeOpen, setEdgeOpen] = useState(true);
  const [switchOpen, setSwitchOpen] = useState(true);
  const [hostOpen, setHostOpen] = useState(true);

  // New Node Form State
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<'router' | 'switch' | 'host'>('router');
  const [newNodeRole, setNewNodeRole] = useState<'core' | 'edge'>('core');

  // Copy code snippet feedback
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const coreRouters = Object.values(nodes).filter(n => n.type === 'router' && n.role === 'core');
  const edgeRouters = Object.values(nodes).filter(n => n.type === 'router' && n.role !== 'core');
  const switches = Object.values(nodes).filter(n => n.type === 'switch');
  const hosts = Object.values(nodes).filter(n => n.type === 'host');

  const selectedGuide = LAB_GUIDES.find(g => g.id === selectedGuideId) || LAB_GUIDES[0];

  const handleAddNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newNodeName.trim() || `${newNodeType[0]}${Date.now().toString().slice(-3)}`;
    const id = name.toLowerCase();

    addNode({
      id,
      name,
      type: newNodeType,
      role: newNodeType === 'router' ? newNodeRole : undefined,
      position: { x: 500 + Math.random() * 100, y: 300 + Math.random() * 100 },
      cliMode: 'priv',
      ospfEnabled: false,
      ospfNetworks: [],
      bgpEnabled: false,
      bgpNeighbors: {},
      bgpNetworks: [],
      staticRoutes: [],
      ipv6Routes: [],
      commandHistory: [],
      terminalBuffer: [
        { text: `Started node ${name} on Mininet-IPLab Web.`, type: 'banner' }
      ],
      interfaces: {
        [`${name}-eth1`]: {
          name: `${name}-eth1`,
          mac: `00:00:${Math.floor(Math.random()*90+10)}:01:00:01`,
          up: true,
          ospfCost: 10
        }
      }
    });

    setNewNodeName('');
  };

  return (
    <div className="w-80 h-full flex flex-col bg-slate-900 border-r border-slate-800 select-none">
      {/* Sidebar Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1">
        <button
          onClick={() => setActiveSidebarTab('nodes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeSidebarTab === 'nodes'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Nodes</span>
          <span className="text-[10px] px-1 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
            {Object.keys(nodes).length}
          </span>
        </button>

        <button
          onClick={() => setActiveSidebarTab('guide')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeSidebarTab === 'guide'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Guide</span>
        </button>

        <button
          onClick={() => setActiveSidebarTab('palette')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeSidebarTab === 'palette'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Node</span>
        </button>
      </div>

      {/* Tab 1: Nodes Accordion */}
      {activeSidebarTab === 'nodes' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {/* Core Routers Group */}
          {coreRouters.length > 0 && (
            <div className="bg-slate-950/40 rounded-xl border border-slate-800/80 overflow-hidden">
              <button
                onClick={() => setCoreOpen(!coreOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-blue-400 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400" />
                  <span>Core Routers</span>
                  <span className="text-[10px] text-slate-500 font-mono">({coreRouters.length})</span>
                </div>
                {coreOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {coreOpen && (
                <div className="p-1 space-y-0.5 border-t border-slate-800/60">
                  {coreRouters.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        selectNode(n.id);
                        openTerminal(n.id);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        selectedNodeId === n.id
                          ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{n.name}</span>
                        {n.ospfEnabled && (
                          <span className="text-[9px] px-1 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded font-mono">
                            OSPF
                          </span>
                        )}
                        {n.bgpEnabled && (
                          <span className="text-[9px] px-1 py-0.2 bg-indigo-950 text-indigo-400 border border-indigo-800/50 rounded font-mono">
                            BGP
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {n.interfaces['lo']?.ip?.split('/')[0] || '1.1.1.1'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Edge Routers Group */}
          {edgeRouters.length > 0 && (
            <div className="bg-slate-950/40 rounded-xl border border-slate-800/80 overflow-hidden">
              <button
                onClick={() => setEdgeOpen(!edgeOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-teal-400 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-teal-400" />
                  <span>Edge Routers</span>
                  <span className="text-[10px] text-slate-500 font-mono">({edgeRouters.length})</span>
                </div>
                {edgeOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {edgeOpen && (
                <div className="p-1 space-y-0.5 border-t border-slate-800/60">
                  {edgeRouters.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        selectNode(n.id);
                        openTerminal(n.id);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        selectedNodeId === n.id
                          ? 'bg-teal-600/20 text-teal-200 border border-teal-500/40'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="font-mono font-bold">{n.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {Object.values(n.interfaces)[0]?.ip?.split('/')[0] || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Switches Group */}
          {switches.length > 0 && (
            <div className="bg-slate-950/40 rounded-xl border border-slate-800/80 overflow-hidden">
              <button
                onClick={() => setSwitchOpen(!switchOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-purple-400 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-purple-400" />
                  <span>Switches (Open vSwitch)</span>
                  <span className="text-[10px] text-slate-500 font-mono">({switches.length})</span>
                </div>
                {switchOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {switchOpen && (
                <div className="p-1 space-y-0.5 border-t border-slate-800/60">
                  {switches.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        selectNode(n.id);
                        openTerminal(n.id);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        selectedNodeId === n.id
                          ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="font-mono font-bold">{n.name}</span>
                      <span className="text-[10px] font-mono text-amber-400">
                        VLANs {Object.values(n.interfaces).map(i => i.vlanTag).filter(Boolean).join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hosts Group */}
          {hosts.length > 0 && (
            <div className="bg-slate-950/40 rounded-xl border border-slate-800/80 overflow-hidden">
              <button
                onClick={() => setHostOpen(!hostOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  <span>Host PCs</span>
                  <span className="text-[10px] text-slate-500 font-mono">({hosts.length})</span>
                </div>
                {hostOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {hostOpen && (
                <div className="p-1 space-y-0.5 border-t border-slate-800/60">
                  {hosts.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        selectNode(n.id);
                        openTerminal(n.id);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        selectedNodeId === n.id
                          ? 'bg-emerald-600/20 text-emerald-200 border border-emerald-500/40'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="font-mono font-bold">{n.name}</span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {Object.values(n.interfaces)[0]?.ip?.split('/')[0] || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Guide Viewer */}
      {activeSidebarTab === 'guide' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Guide Selector */}
          <div className="p-2 border-b border-slate-800 bg-slate-950/40">
            <select
              value={selectedGuideId}
              onChange={(e) => setSelectedGuide(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 font-medium"
            >
              {LAB_GUIDES.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          {/* Guide Markdown Content */}
          <div className="flex-1 overflow-y-auto p-3 text-xs text-slate-300 space-y-3 font-sans leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 select-text">
            <div className="prose prose-invert prose-xs max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-slate-300 text-xs">
                {selectedGuide.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Custom Node Palette */}
      {activeSidebarTab === 'palette' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Add New Node to Canvas
            </h4>
            <form onSubmit={handleAddNodeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Node Type</label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setNewNodeType('router')}
                    className={`py-1 rounded font-medium border text-center transition-all ${
                      newNodeType === 'router'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Router
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewNodeType('switch')}
                    className={`py-1 rounded font-medium border text-center transition-all ${
                      newNodeType === 'switch'
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Switch
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewNodeType('host')}
                    className={`py-1 rounded font-medium border text-center transition-all ${
                      newNodeType === 'host'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Host
                  </button>
                </div>
              </div>

              {newNodeType === 'router' && (
                <div>
                  <label className="block text-slate-400 mb-1">Router Role</label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setNewNodeRole('core')}
                      className={`py-1 rounded font-medium border text-center transition-all ${
                        newNodeRole === 'core'
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Core Router
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewNodeRole('edge')}
                      className={`py-1 rounded font-medium border text-center transition-all ${
                        newNodeRole === 'edge'
                          ? 'bg-teal-600 text-white border-teal-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Edge Router
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Node Identifier / Hostname</label>
                <input
                  type="text"
                  placeholder="e.g. r4, s4, c41"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-md transition-all active:scale-95"
              >
                Place Node on Canvas
              </button>
            </form>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 space-y-2">
            <div className="font-semibold text-slate-300">Tips Menggambar Topologi:</div>
            <p>1. Tarik garis dari handle bulat di sisi node untuk membuat link.</p>
            <p>2. Hubungkan switch ke edge router untuk simulasi VLAN.</p>
            <p>3. Buka tab console untuk mengkonfigurasi IP dengan command CLI.</p>
          </div>
        </div>
      )}
    </div>
  );
};
