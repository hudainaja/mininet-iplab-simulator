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
      position: { x: 500 + Math.random() * 80, y: 300 + Math.random() * 80 },
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
    <div className="w-80 h-full flex flex-col bg-white border-r border-slate-200 select-none">
      {/* Sidebar Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1">
        <button
          onClick={() => setActiveSidebarTab('nodes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeSidebarTab === 'nodes'
              ? 'bg-white text-blue-700 border border-slate-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Nodes</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono border border-slate-200">
            {Object.keys(nodes).length}
          </span>
        </button>

        <button
          onClick={() => setActiveSidebarTab('guide')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeSidebarTab === 'guide'
              ? 'bg-white text-blue-700 border border-slate-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>Guide</span>
        </button>

        <button
          onClick={() => setActiveSidebarTab('palette')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeSidebarTab === 'palette'
              ? 'bg-white text-blue-700 border border-slate-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Add Node</span>
        </button>
      </div>

      {/* Tab 1: Nodes Accordion */}
      {activeSidebarTab === 'nodes' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {/* Core Routers Group */}
          {coreRouters.length > 0 && (
            <div className="bg-slate-50/70 rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setCoreOpen(!coreOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Core Routers</span>
                  <span className="text-[10px] text-slate-400 font-mono">({coreRouters.length})</span>
                </div>
                {coreOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {coreOpen && (
                <div className="p-1 space-y-0.5 border-t border-slate-200 bg-white">
                  {coreRouters.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        selectNode(n.id);
                        openTerminal(n.id);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                        selectedNodeId === n.id
                          ? 'bg-blue-50 text-blue-800 font-semibold border border-blue-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{n.name}</span>
                        {n.ospfEnabled && (
                          <span className="text-[9px] px-1 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono">
                            OSPF
                          </span>
                        )}
                        {n.bgpEnabled && (
                          <span className="text-[9px] px-1 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono">
                            BGP
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
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
            <div className="bg-slate-50/70 rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setEdgeOpen(!edgeOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span>Edge Routers</span>
                  <span className="text-[10px] text-slate-400 font-mono">({edgeRouters.length})</span>
                </div>
                {edgeOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {edgeOpen && (
                <div className="p-1 space-y-0.5 border-t border-slate-200 bg-white">
                  {edgeRouters.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        selectNode(n.id);
                        openTerminal(n.id);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                        selectedNodeId === n.id
                          ? 'bg-sky-50 text-sky-800 font-semibold border border-sky-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-mono">{n.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">
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
            <div className="bg-slate-50/70 rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setSwitchOpen(!switchOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Switches (OVS)</span>
                  <span className="text-[10px] text-slate-400 font-mono">({switches.length})</span>
                </div>
                {switchOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {switchOpen && (
                <div className="p-1 space-y-0.5 border-t border-slate-200 bg-white">
                  {switches.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        selectNode(n.id);
                        openTerminal(n.id);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                        selectedNodeId === n.id
                          ? 'bg-amber-50 text-amber-900 font-semibold border border-amber-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-mono">{n.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        VLAN {Object.values(n.interfaces).map(i => i.vlanTag).filter(Boolean).join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hosts Group */}
          {hosts.length > 0 && (
            <div className="bg-slate-50/70 rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setHostOpen(!hostOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-md bg-emerald-600" />
                  <span>Host PCs</span>
                  <span className="text-[10px] text-slate-400 font-mono">({hosts.length})</span>
                </div>
                {hostOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {hostOpen && (
                <div className="p-1 space-y-0.5 border-t border-slate-200 bg-white">
                  {hosts.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        selectNode(n.id);
                        openTerminal(n.id);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                        selectedNodeId === n.id
                          ? 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-mono">{n.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">
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
          <div className="p-2.5 border-b border-slate-200 bg-slate-50">
            <select
              value={selectedGuideId}
              onChange={(e) => setSelectedGuide(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-md px-2.5 py-1.5 outline-none focus:border-blue-500 font-medium"
            >
              {LAB_GUIDES.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          {/* Guide Markdown Content */}
          <div className="flex-1 overflow-y-auto p-4 text-xs text-slate-700 space-y-3 font-sans leading-relaxed select-text bg-white">
            <div className="prose prose-slate max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-slate-700 text-xs leading-relaxed">
                {selectedGuide.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Custom Node Palette */}
      {activeSidebarTab === 'palette' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Add New Node
            </h4>
            <form onSubmit={handleAddNodeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Node Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewNodeType('router')}
                    className={`py-1.5 rounded-md font-medium border text-center transition-all ${
                      newNodeType === 'router'
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Router
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewNodeType('switch')}
                    className={`py-1.5 rounded-md font-medium border text-center transition-all ${
                      newNodeType === 'switch'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Switch
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewNodeType('host')}
                    className={`py-1.5 rounded-md font-medium border text-center transition-all ${
                      newNodeType === 'host'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Host
                  </button>
                </div>
              </div>

              {newNodeType === 'router' && (
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Router Role</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewNodeRole('core')}
                      className={`py-1.5 rounded-md font-medium border text-center transition-all ${
                        newNodeRole === 'core'
                          ? 'bg-blue-600 text-white border-blue-700'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Core Router
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewNodeRole('edge')}
                      className={`py-1.5 rounded-md font-medium border text-center transition-all ${
                        newNodeRole === 'edge'
                          ? 'bg-sky-500 text-white border-sky-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Edge Router
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Hostname / Label</label>
                <input
                  type="text"
                  placeholder="e.g. r4, s4, c41"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs transition-colors"
              >
                Place on Canvas
              </button>
            </form>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
            <div className="font-semibold text-slate-700">Canvas Navigation:</div>
            <p>• Click any node to open its terminal console.</p>
            <p>• Drag handles (small circle points) to draw links between devices.</p>
            <p>• Hover over cables to view interface port mappings.</p>
          </div>
        </div>
      )}
    </div>
  );
};
