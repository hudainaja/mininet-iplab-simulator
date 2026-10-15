import { create } from 'zustand';
import { NetworkNode, NetworkLink } from '../engine/types';
import { createUtpExamPreset, createStaticRoutingPreset, createBlankPreset, LabPreset } from '../engine/presets';
import { executeCommand, getPrompt, generateAllNodeConfigsDump } from '../engine/cliParser';
import { simulatePing } from '../engine/packetSimulator';
import {
  computeDynamicTopologyLayout,
  checkAndAutoWireSubnets,
  generateBulkTopology as generateBulk,
  saveCustomPreset,
  getCustomPresets,
  deleteCustomPreset,
  CustomLabPreset
} from '../engine/dynamicLayoutEngine';

// ----- localStorage Auto-Save Constants & Helpers -----
const STORAGE_KEY = 'mininet-iplab-autosave';

interface PersistedState {
  currentPresetId: string;
  currentPresetName: string;
  nodes: Record<string, NetworkNode>;
  links: NetworkLink[];
  isDarkMode: boolean;
}

function saveToLocalStorage(state: PersistedState) {
  try {
    const json = JSON.stringify(state);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, json);
    }
  } catch {
    // quota exceeded or SSR — silently ignore
  }
}

function loadFromLocalStorage(): PersistedState | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    // Basic validation: must have nodes and links
    if (parsed && parsed.nodes && parsed.links && Object.keys(parsed.nodes).length > 0) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function clearLocalStorage() {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

// ----- Terminal Buffer & Performance Constants -----
const MAX_TERMINAL_BUFFER = 200;
function appendTerminalBuffer(
  node: NetworkNode,
  item: { text: string; type?: 'output' | 'error' | 'success' | 'info' | 'system' | 'banner' }
) {
  node.terminalBuffer.push(item);
  if (node.terminalBuffer.length > MAX_TERMINAL_BUFFER) {
    node.terminalBuffer = node.terminalBuffer.slice(-MAX_TERMINAL_BUFFER);
  }
}


interface VerificationResult {
  test: string;
  source: string;
  target: string;
  status: 'passed' | 'failed' | 'warning';
  detail: string;
}

interface NetworkState {
  currentPresetId: string;
  currentPresetName: string;
  nodes: Record<string, NetworkNode>;
  links: NetworkLink[];

  // UI Selection & Panels
  selectedNodeId: string | null;
  activeTerminalNodeId: string | null;
  openTerminalTabs: string[];
  activeSidebarTab: 'nodes' | 'guide' | 'palette';
  selectedGuideId: string;

  // Terminal Display Controls
  terminalFontSize: number;
  isTerminalMaximized: boolean;

  // Resizable & Collapsible Panels
  isSidebarCollapsed: boolean;
  sidebarWidth: number;
  isTerminalCollapsed: boolean;
  terminalWidth: number;

  // Theme Mode
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Auto-Snap on CLI & Layout Engine
  autoSnapOnCli: boolean;
  toggleAutoSnapOnCli: () => void;
  applyAutoLayout: () => void;

  // Bulk Generator & Custom Presets
  generateBulkTopology: (
    architecture: 'enterprise' | 'spine-leaf' | 'mesh' | 'scattered',
    nodeCount: number
  ) => void;
  saveCurrentAsPreset: (name: string, description?: string) => void;
  loadCustomPreset: (presetId: string) => void;
  deleteCustomPreset: (presetId: string) => void;

  // Modals
  isConfigModalOpen: boolean;
  isVerificationModalOpen: boolean;
  verificationResults: VerificationResult[];

  // Wiring Mode & Quick Connect
  isWiringMode: boolean;
  wiringSourceNodeId: string | null;
  toggleWiringMode: () => void;
  setWiringMode: (active: boolean) => void;
  setWiringSourceNodeId: (nodeId: string | null) => void;
  connectNodes: (sourceId: string, targetId: string) => boolean;

  // Network Status Synchronization
  lastSyncMessage: string | null;
  syncNetworkStatus: () => { activeLinks: number; downLinks: number; message: string };

  // Transient Hover State for Cable Interfaces & Nodes
  hoveredNodeId: string | null;
  setHoveredNodeId: (nodeId: string | null) => void;

  // Actions
  loadPreset: (presetId: string) => void;
  resetLab: () => void;
  restoreAutoSave: () => boolean;
  selectNode: (nodeId: string | null) => void;
  openTerminal: (nodeId: string) => void;
  closeTerminalTab: (nodeId: string) => void;
  setActiveTerminal: (nodeId: string) => void;
  executeTerminalCommand: (command: string) => void;
  clearTerminalBuffer: (nodeId: string) => void;
  setTerminalFontSize: (delta: number) => void;
  toggleTerminalMaximize: () => void;
  toggleSidebarCollapse: () => void;
  setSidebarWidth: (width: number) => void;
  toggleTerminalCollapse: () => void;
  setTerminalWidth: (width: number) => void;
  setActiveSidebarTab: (tab: 'nodes' | 'guide' | 'palette') => void;
  setSelectedGuide: (guideId: string) => void;
  setIsConfigModalOpen: (open: boolean) => void;
  setIsVerificationModalOpen: (open: boolean) => void;

  // Topology manipulation
  addNode: (node: NetworkNode) => void;
  removeNode: (nodeId: string) => void;
  addLink: (link: NetworkLink) => void;
  removeLink: (linkId: string) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;

  // Export / Import
  exportTopologyJson: () => string;
  importTopologyJson: (json: string) => boolean;
  exportAllConfigsDump: () => string;
  applyBatchCliCommands: (script: string) => { successCount: number; errors: string[] };

  // Verification
  runVerificationCheck: () => void;
}

// Smart auto-increment node naming: finds the smallest unused positive integer (h1, h2..., s1, s2..., r1, r2...)
export function getNextAvailableNodeName(
  type: 'router' | 'switch' | 'host',
  nodes: Record<string, NetworkNode>
): string {
  const prefix = type === 'host' ? 'h' : type === 'switch' ? 's' : 'r';

  // Collect all taken IDs and names in lowercase
  const takenNames = new Set<string>();
  for (const n of Object.values(nodes)) {
    if (n.id) takenNames.add(n.id.toLowerCase());
    if (n.name) takenNames.add(n.name.toLowerCase());
  }

  // Find the smallest positive integer i >= 1 such that `${prefix}${i}` is NOT taken
  let i = 1;
  while (takenNames.has(`${prefix}${i}`)) {
    i++;
  }

  return `${prefix}${i}`;
}

// Helper to allocate an interface name for a node in Mininet convention
function allocateInterfaceForNode(
  node: NetworkNode,
  links: NetworkLink[],
  preferredName?: string
): string {
  // If preferredName is provided, valid, and not generic handle id or default "eth1"
  if (
    preferredName &&
    preferredName !== 'eth1' &&
    !preferredName.startsWith('source-') &&
    !preferredName.startsWith('target-') &&
    !preferredName.startsWith('top') &&
    !preferredName.startsWith('bottom') &&
    !preferredName.startsWith('left') &&
    !preferredName.startsWith('right')
  ) {
    return preferredName;
  }

  // Collect all interface names currently connected on this node
  const usedIntfs = new Set<string>();
  for (const l of links) {
    if (l.source === node.id && l.sourceHandle) usedIntfs.add(l.sourceHandle.toLowerCase());
    if (l.target === node.id && l.targetHandle) usedIntfs.add(l.targetHandle.toLowerCase());
  }

  // 1. Look for an existing, unused non-loopback interface on the node
  for (const [intfName, intf] of Object.entries(node.interfaces)) {
    if (intfName === 'lo' || intf.isTunnel) continue;
    if (!usedIntfs.has(intfName.toLowerCase())) {
      return intfName;
    }
  }

  // 2. Generate new sequential interface name
  // Standard Mininet naming convention:
  // For switches: s1-eth1, s1-eth2, etc. (starts at 1)
  // For hosts and routers: <nodeName>-eth0, <nodeName>-eth1, etc.
  const prefix = `${node.name}-eth`;
  const startIndex = node.type === 'switch' ? 1 : 0;

  for (let i = startIndex; i < 64; i++) {
    const candidate = `${prefix}${i}`;
    const altCandidate = `eth${i}`;
    if (
      !node.interfaces[candidate] &&
      !node.interfaces[altCandidate] &&
      !usedIntfs.has(candidate.toLowerCase()) &&
      !usedIntfs.has(altCandidate.toLowerCase())
    ) {
      return candidate;
    }
  }

  return `${prefix}${Date.now().toString().slice(-3)}`;
}

// Ensure a virtual interface is registered in the node's interfaces dictionary
function ensureInterfaceRegistered(node: NetworkNode, intfName: string) {
  if (!node.interfaces[intfName]) {
    const randHex = Math.floor(Math.random() * 89 + 10);
    const randId = Math.floor(Math.random() * 89 + 10);
    node.interfaces[intfName] = {
      name: intfName,
      mac: `00:00:${randHex}:01:00:${randId}`,
      up: true,
      ospfCost: node.type === 'router' ? 10 : undefined,
      vlanTag: node.type === 'switch' ? 1 : undefined,
    };
  } else {
    // If it already existed, make sure administrative state is UP
    node.interfaces[intfName].up = true;
  }
}

const defaultPreset = createUtpExamPreset(true);

// Attempt to restore from localStorage, fallback to default preset
const restoredState = loadFromLocalStorage();

export const useNetworkStore = create<NetworkState>((set, get) => ({
  currentPresetId: restoredState?.currentPresetId ?? defaultPreset.id,
  currentPresetName: restoredState?.currentPresetName ?? defaultPreset.name,
  nodes: restoredState?.nodes ?? defaultPreset.nodes,
  links: restoredState?.links ?? defaultPreset.links,

  selectedNodeId: 'r1',
  activeTerminalNodeId: 'r1',
  openTerminalTabs: ['r1', 'r2', 's1', 'c11'],
  activeSidebarTab: 'nodes',
  selectedGuideId: 'utp-guide',

  terminalFontSize: 13,
  isTerminalMaximized: false,
  isSidebarCollapsed: false,
  sidebarWidth: 300,
  isTerminalCollapsed: false,
  terminalWidth: 480,
  isDarkMode: restoredState?.isDarkMode ?? false,

  // Wiring Mode & Quick Connect
  isWiringMode: false,
  wiringSourceNodeId: null,
  lastSyncMessage: null,

  toggleWiringMode: () => {
    set(state => ({
      isWiringMode: !state.isWiringMode,
      wiringSourceNodeId: null,
    }));
  },

  setWiringMode: (active: boolean) => {
    set({ isWiringMode: active, wiringSourceNodeId: null });
  },

  setWiringSourceNodeId: (nodeId: string | null) => {
    set({ wiringSourceNodeId: nodeId });
  },

  // Transient Hover State for Cable Interfaces & Nodes
  hoveredNodeId: null,
  setHoveredNodeId: (nodeId: string | null) => set({ hoveredNodeId: nodeId }),

  autoSnapOnCli: true,

  isConfigModalOpen: false,
  isVerificationModalOpen: false,
  verificationResults: [],

  toggleAutoSnapOnCli: () => {
    set(state => ({ autoSnapOnCli: !state.autoSnapOnCli }));
  },

  applyAutoLayout: () => {
    const { nodes, links } = get();
    const clonedNodes = { ...nodes };
    computeDynamicTopologyLayout(clonedNodes, links);
    set({ nodes: clonedNodes });
  },

  generateBulkTopology: (architecture, nodeCount) => {
    const generated = generateBulk(architecture, nodeCount);
    const firstNodeId = Object.keys(generated.nodes)[0] || null;
    const initialTabs = Object.keys(generated.nodes).slice(0, 4);

    set({
      currentPresetId: `bulk-${architecture}-${nodeCount}`,
      currentPresetName: `${architecture.toUpperCase()} Topologi (${nodeCount} Nodes)`,
      nodes: generated.nodes,
      links: generated.links,
      selectedNodeId: firstNodeId,
      activeTerminalNodeId: firstNodeId,
      openTerminalTabs: initialTabs,
    });
  },

  saveCurrentAsPreset: (name: string, description?: string) => {
    const { nodes, links } = get();
    saveCustomPreset({
      id: `custom-${Date.now()}`,
      name,
      description: description || `${Object.keys(nodes).length} Nodes`,
      nodes,
      links,
    });
  },

  loadCustomPreset: (presetId: string) => {
    const customs = getCustomPresets();
    const found = customs.find(p => p.id === presetId);
    if (found) {
      const firstNodeId = Object.keys(found.nodes)[0] || null;
      set({
        currentPresetId: found.id,
        currentPresetName: found.name,
        nodes: found.nodes,
        links: found.links,
        selectedNodeId: firstNodeId,
        activeTerminalNodeId: firstNodeId,
        openTerminalTabs: Object.keys(found.nodes).slice(0, 4),
      });
    }
  },

  deleteCustomPreset: (presetId: string) => {
    deleteCustomPreset(presetId);
  },

  loadPreset: (presetId: string) => {
    // Check if it's a custom preset
    if (presetId.startsWith('custom-')) {
      const customs = getCustomPresets();
      const found = customs.find(p => p.id === presetId);
      if (found) {
        const firstNodeId = Object.keys(found.nodes)[0] || null;
        set({
          currentPresetId: found.id,
          currentPresetName: found.name,
          nodes: found.nodes,
          links: found.links,
          selectedNodeId: firstNodeId,
          activeTerminalNodeId: firstNodeId,
          openTerminalTabs: Object.keys(found.nodes).slice(0, 4),
        });
        return;
      }
    }

    let preset: LabPreset;
    if (presetId === 'static-routing-4') {
      preset = createStaticRoutingPreset();
    } else if (presetId === 'blank-canvas') {
      preset = createBlankPreset();
    } else {
      preset = createUtpExamPreset(true);
    }

    const firstNodeId = Object.keys(preset.nodes)[0] || null;
    const initialTabs = Object.keys(preset.nodes).slice(0, 4);

    set({
      currentPresetId: preset.id,
      currentPresetName: preset.name,
      nodes: preset.nodes,
      links: preset.links,
      selectedNodeId: firstNodeId,
      activeTerminalNodeId: firstNodeId,
      openTerminalTabs: initialTabs,
    });
  },

  resetLab: () => {
    clearLocalStorage();
    const { currentPresetId, loadPreset } = get();
    loadPreset(currentPresetId);
  },

  restoreAutoSave: () => {
    const saved = loadFromLocalStorage();
    if (saved && saved.nodes && Object.keys(saved.nodes).length > 0) {
      const nodeIds = Object.keys(saved.nodes);
      const firstId = nodeIds[0] || null;
      if (typeof document !== 'undefined' && saved.isDarkMode !== undefined) {
        document.documentElement.classList.toggle('dark', Boolean(saved.isDarkMode));
      }
      set({
        currentPresetId: saved.currentPresetId,
        currentPresetName: saved.currentPresetName,
        nodes: saved.nodes,
        links: saved.links,
        isDarkMode: saved.isDarkMode,
        selectedNodeId: firstId,
        activeTerminalNodeId: firstId,
        openTerminalTabs: nodeIds.slice(0, 4),
      });
      return true;
    }
    return false;
  },

  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
    if (nodeId) {
      get().openTerminal(nodeId);
    }
  },

  openTerminal: (nodeId: string) => {
    const { openTerminalTabs, nodes } = get();
    if (!nodes[nodeId]) return;

    if (!openTerminalTabs.includes(nodeId)) {
      set({
        openTerminalTabs: [...openTerminalTabs, nodeId],
        activeTerminalNodeId: nodeId,
        isTerminalCollapsed: false,
      });
    } else {
      set({
        activeTerminalNodeId: nodeId,
        isTerminalCollapsed: false,
      });
    }
  },

  closeTerminalTab: (nodeId: string) => {
    const { openTerminalTabs, activeTerminalNodeId } = get();
    const newTabs = openTerminalTabs.filter(id => id !== nodeId);
    let newActive = activeTerminalNodeId;
    if (activeTerminalNodeId === nodeId) {
      newActive = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
    }
    set({
      openTerminalTabs: newTabs,
      activeTerminalNodeId: newActive,
    });
  },

  setActiveTerminal: (nodeId: string) => {
    set({ activeTerminalNodeId: nodeId });
  },

  executeTerminalCommand: (commandInput: string) => {
    const { activeTerminalNodeId, autoSnapOnCli } = get();
    if (!activeTerminalNodeId || !get().nodes[activeTerminalNodeId]) return;

    // Split input on newlines to process paste and multi-line sequences synchronously
    const rawLines = commandInput.split(/\r?\n/);

    const workingNodes: Record<string, NetworkNode> = { ...get().nodes };
    let workingLinks: NetworkLink[] = [...get().links];

    // Deep clone active node to avoid stale mutations
    let currentNode: NetworkNode = {
      ...workingNodes[activeTerminalNodeId],
      interfaces: { ...workingNodes[activeTerminalNodeId].interfaces },
      staticRoutes: [...(workingNodes[activeTerminalNodeId].staticRoutes || [])],
      terminalBuffer: [...workingNodes[activeTerminalNodeId].terminalBuffer],
      commandHistory: [...workingNodes[activeTerminalNodeId].commandHistory],
    };
    workingNodes[activeTerminalNodeId] = currentNode;

    for (const rawLine of rawLines) {
      const line = rawLine.trim();
      if (!line) continue;

      const prompt = getPrompt(currentNode);

      // Execute sequentially in the synchronous working state
      const res = executeCommand(line, activeTerminalNodeId, workingNodes, workingLinks);

      // Re-fetch currentNode in case workingNodes[activeTerminalNodeId] was re-assigned
      currentNode = workingNodes[activeTerminalNodeId];

      if (res.clear) {
        currentNode.terminalBuffer = [];
      } else {
        appendTerminalBuffer(currentNode, {
          text: `${prompt}${line}`,
          type: 'system'
        });

        if (res.output) {
          appendTerminalBuffer(currentNode, {
            text: res.output,
            type: res.type || 'output'
          });
        }
      }

      // Handle CLI connect command link creation
      if (res.createdLink) {
        const { sourceNodeId, sourceInterface, targetNodeId, targetInterface } = res.createdLink;
        const linkId = `link-${sourceNodeId}-${sourceInterface}-${targetNodeId}-${targetInterface}`;
        const alreadyExists = workingLinks.some(
          l =>
            (l.source === sourceNodeId &&
              l.sourceHandle === sourceInterface &&
              l.target === targetNodeId &&
              l.targetHandle === targetInterface) ||
            (l.source === targetNodeId &&
              l.sourceHandle === targetInterface &&
              l.target === sourceNodeId &&
              l.targetHandle === sourceInterface)
        );
        if (!alreadyExists) {
          workingLinks.push({
            id: linkId,
            source: sourceNodeId,
            sourceHandle: sourceInterface,
            target: targetNodeId,
            targetHandle: targetInterface,
            status: 'up',
            latency: 0.3,
            type: 'straight'
          });
        }
      }
    }

    // Subnet IP Auto-Wiring:
    // If an IP address was assigned to any interface, connect nodes in the same subnet
    const autoWired = checkAndAutoWireSubnets(activeTerminalNodeId, workingNodes, workingLinks);
    if (autoWired.length > 0) {
      workingLinks = [...workingLinks, ...autoWired];
    }

    // Auto-Snap Position on CLI (if toggle is active)
    if (autoSnapOnCli) {
      computeDynamicTopologyLayout(workingNodes, workingLinks);
    }

    // Synchronize link UP/DOWN state with interface status in real-time
    for (let i = 0; i < workingLinks.length; i++) {
      const l = workingLinks[i];
      const sNode = workingNodes[l.source];
      const tNode = workingNodes[l.target];
      if (sNode && tNode) {
        const sIntf = sNode.interfaces[l.sourceHandle];
        const tIntf = tNode.interfaces[l.targetHandle];
        if (sIntf && tIntf) {
          const isDown = sIntf.up === false || tIntf.up === false;
          workingLinks[i] = {
            ...l,
            status: isDown ? 'down' : 'up'
          };
        }
      }
    }

    // Single synchronous Zustand commit!
    set({
      nodes: workingNodes,
      links: workingLinks,
    });
  },

  clearTerminalBuffer: (nodeId: string) => {
    const { nodes } = get();
    if (!nodes[nodeId]) return;
    const node = { ...nodes[nodeId], terminalBuffer: [] };
    set({
      nodes: { ...nodes, [nodeId]: node }
    });
  },

  setTerminalFontSize: (delta: number) => {
    set(state => ({
      terminalFontSize: Math.max(10, Math.min(22, state.terminalFontSize + delta))
    }));
  },

  toggleTerminalMaximize: () => {
    set(state => ({ isTerminalMaximized: !state.isTerminalMaximized }));
  },

  toggleSidebarCollapse: () => {
    set(state => ({ isSidebarCollapsed: !state.isSidebarCollapsed }));
  },

  setSidebarWidth: (width: number) => {
    set({ sidebarWidth: Math.max(240, Math.min(450, width)) });
  },

  toggleTerminalCollapse: () => {
    set(state => ({ isTerminalCollapsed: !state.isTerminalCollapsed }));
  },

  setTerminalWidth: (width: number) => {
    set({ terminalWidth: Math.max(350, Math.min(700, width)) });
  },

  toggleDarkMode: () =>
    set(state => {
      const next = !state.isDarkMode;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next);
      }
      return { isDarkMode: next };
    }),

  setActiveSidebarTab: (tab: 'nodes' | 'guide' | 'palette') => {
    set({ activeSidebarTab: tab, isSidebarCollapsed: false });
  },

  setSelectedGuide: (guideId: string) => {
    set({ selectedGuideId: guideId });
  },

  setIsConfigModalOpen: (open: boolean) => {
    set({ isConfigModalOpen: open });
  },

  setIsVerificationModalOpen: (open: boolean) => {
    set({ isVerificationModalOpen: open });
  },

  addNode: (node: NetworkNode) => {
    set(state => ({
      nodes: { ...state.nodes, [node.id]: node },
      openTerminalTabs: [...state.openTerminalTabs, node.id],
      activeTerminalNodeId: node.id,
      selectedNodeId: node.id,
    }));
  },

  removeNode: (nodeId: string) => {
    set(state => {
      const newNodes = { ...state.nodes };
      delete newNodes[nodeId];

      const newLinks = state.links.filter(
        link => link.source !== nodeId && link.target !== nodeId
      );

      const newTabs = state.openTerminalTabs.filter(id => id !== nodeId);
      const newActiveTerminal =
        state.activeTerminalNodeId === nodeId ? newTabs[0] || null : state.activeTerminalNodeId;

      return {
        nodes: newNodes,
        links: newLinks,
        openTerminalTabs: newTabs,
        activeTerminalNodeId: newActiveTerminal,
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        wiringSourceNodeId: state.wiringSourceNodeId === nodeId ? null : state.wiringSourceNodeId,
      };
    });
  },

  connectNodes: (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return false;
    const { nodes, links } = get();
    const sourceNode = nodes[sourceId];
    const targetNode = nodes[targetId];
    if (!sourceNode || !targetNode) return false;

    // Check if link already exists between these two nodes
    const alreadyExists = links.some(
      l =>
        (l.source === sourceId && l.target === targetId) ||
        (l.source === targetId && l.target === sourceId)
    );
    if (alreadyExists) return false;

    const updatedNodes = {
      ...nodes,
      [sourceId]: {
        ...sourceNode,
        interfaces: { ...sourceNode.interfaces },
        terminalBuffer: [...sourceNode.terminalBuffer],
      },
      [targetId]: {
        ...targetNode,
        interfaces: { ...targetNode.interfaces },
        terminalBuffer: [...targetNode.terminalBuffer],
      },
    };

    const sNode = updatedNodes[sourceId];
    const tNode = updatedNodes[targetId];

    const sourceIntf = allocateInterfaceForNode(sNode, links);
    const targetIntf = allocateInterfaceForNode(tNode, links);

    ensureInterfaceRegistered(sNode, sourceIntf);
    ensureInterfaceRegistered(tNode, targetIntf);

    appendTerminalBuffer(sNode, {
      text: `[LINK UP] Port ${sourceIntf} connected to ${targetNode.name}:${targetIntf}`,
      type: 'success',
    });
    appendTerminalBuffer(tNode, {
      text: `[LINK UP] Port ${targetIntf} connected to ${sourceNode.name}:${sourceIntf}`,
      type: 'success',
    });

    const newLink: NetworkLink = {
      id: `link-${sourceId}-${targetId}-${Date.now().toString().slice(-4)}`,
      source: sourceId,
      sourceHandle: sourceIntf,
      target: targetId,
      targetHandle: targetIntf,
      status: 'up',
      latency: 0.3,
      type: 'straight',
      style: { stroke: '#64748b', strokeWidth: 2 },
    };

    set({
      nodes: updatedNodes,
      links: [...links, newLink],
    });

    return true;
  },

  syncNetworkStatus: () => {
    const { nodes, links } = get();
    const updatedNodes: Record<string, NetworkNode> = {};
    for (const [id, n] of Object.entries(nodes)) {
      updatedNodes[id] = {
        ...n,
        interfaces: { ...n.interfaces },
      };
    }

    const updatedLinks: NetworkLink[] = [];
    let activeCount = 0;
    let downCount = 0;

    for (const link of links) {
      const sNode = updatedNodes[link.source];
      const tNode = updatedNodes[link.target];

      // Prune orphan links if either node is deleted
      if (!sNode || !tNode) continue;

      // Ensure interfaces exist
      let sIntf = sNode.interfaces[link.sourceHandle];
      if (!sIntf) {
        ensureInterfaceRegistered(sNode, link.sourceHandle);
        sIntf = sNode.interfaces[link.sourceHandle];
      }

      let tIntf = tNode.interfaces[link.targetHandle];
      if (!tIntf) {
        ensureInterfaceRegistered(tNode, link.targetHandle);
        tIntf = tNode.interfaces[link.targetHandle];
      }

      // Determine UP/DOWN status based on interfaces
      const isDown = sIntf.up === false || tIntf.up === false;
      const status: 'up' | 'down' = isDown ? 'down' : 'up';

      if (status === 'up') activeCount++;
      else downCount++;

      updatedLinks.push({
        ...link,
        status,
      });
    }

    const message = `Sinkronisasi selesai: ${activeCount} link aktif, ${downCount} down.`;
    set({
      nodes: updatedNodes,
      links: updatedLinks,
      lastSyncMessage: message,
    });

    return {
      activeLinks: activeCount,
      downLinks: downCount,
      message,
    };
  },

  addLink: (link: NetworkLink) => {
    const { nodes, links } = get();
    const sourceNode = nodes[link.source];
    const targetNode = nodes[link.target];

    if (sourceNode && targetNode) {
      const updatedNodes = {
        ...nodes,
        [link.source]: {
          ...sourceNode,
          interfaces: { ...sourceNode.interfaces },
          terminalBuffer: [...sourceNode.terminalBuffer],
        },
        [link.target]: {
          ...targetNode,
          interfaces: { ...targetNode.interfaces },
          terminalBuffer: [...targetNode.terminalBuffer],
        },
      };

      const sNode = updatedNodes[link.source];
      const tNode = updatedNodes[link.target];

      const sourceIntf = allocateInterfaceForNode(sNode, links, link.sourceHandle);
      const targetIntf = allocateInterfaceForNode(tNode, links, link.targetHandle);

      ensureInterfaceRegistered(sNode, sourceIntf);
      ensureInterfaceRegistered(tNode, targetIntf);

      const registeredLink: NetworkLink = {
        ...link,
        sourceHandle: sourceIntf,
        targetHandle: targetIntf,
        status: link.status || 'up',
        latency: link.latency || 0.3,
        type: link.type || 'straight',
        style: { stroke: '#64748b', strokeWidth: 2 },
      };

      appendTerminalBuffer(sNode, {
        text: `[LINK UP] Cable connected: ${sourceIntf} <---> ${targetNode.name}:${targetIntf}`,
        type: 'success',
      });
      appendTerminalBuffer(tNode, {
        text: `[LINK UP] Cable connected: ${targetIntf} <---> ${sourceNode.name}:${sourceIntf}`,
        type: 'success',
      });

      set({
        nodes: updatedNodes,
        links: [...links, registeredLink],
      });
    } else {
      set({
        links: [...links, link],
      });
    }
  },

  removeLink: (linkId: string) => {
    const { nodes, links } = get();
    const targetLink = links.find(l => l.id === linkId);
    if (!targetLink) return;

    const updatedNodes = { ...nodes };
    if (updatedNodes[targetLink.source]) {
      const sNode = {
        ...updatedNodes[targetLink.source],
        terminalBuffer: [...updatedNodes[targetLink.source].terminalBuffer],
      };
      appendTerminalBuffer(sNode, {
        text: `[LINK DOWN] Cable disconnected from interface ${targetLink.sourceHandle}`,
        type: 'info',
      });
      updatedNodes[targetLink.source] = sNode;
    }
    if (updatedNodes[targetLink.target]) {
      const tNode = {
        ...updatedNodes[targetLink.target],
        terminalBuffer: [...updatedNodes[targetLink.target].terminalBuffer],
      };
      appendTerminalBuffer(tNode, {
        text: `[LINK DOWN] Cable disconnected from interface ${targetLink.targetHandle}`,
        type: 'info',
      });
      updatedNodes[targetLink.target] = tNode;
    }

    set({
      nodes: updatedNodes,
      links: links.filter(l => l.id !== linkId),
    });
  },

  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => {
    set(state => {
      const node = state.nodes[nodeId];
      if (!node) return state;
      return {
        nodes: {
          ...state.nodes,
          [nodeId]: { ...node, position }
        }
      };
    });
  },

  exportTopologyJson: () => {
    const { nodes, links, currentPresetId, currentPresetName } = get();
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        presetId: currentPresetId,
        presetName: currentPresetName,
        nodes,
        links,
      },
      null,
      2
    );
  },

  importTopologyJson: (json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.nodes && parsed.links && typeof parsed.nodes === 'object') {
        const nodeIds = Object.keys(parsed.nodes);
        if (nodeIds.length === 0) return false;
        const firstNodeId = nodeIds[0];
        const newPresetId = parsed.presetId || 'custom-imported';
        const newPresetName = parsed.presetName || 'Imported Custom Lab';

        set({
          nodes: parsed.nodes,
          links: parsed.links,
          currentPresetId: newPresetId,
          currentPresetName: newPresetName,
          selectedNodeId: firstNodeId,
          activeTerminalNodeId: firstNodeId,
          openTerminalTabs: nodeIds.slice(0, 4),
        });

        // Immediately persist to localStorage
        saveToLocalStorage({
          currentPresetId: newPresetId,
          currentPresetName: newPresetName,
          nodes: parsed.nodes,
          links: parsed.links,
          isDarkMode: get().isDarkMode,
        });

        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  exportAllConfigsDump: () => {
    const { nodes } = get();
    return generateAllNodeConfigsDump(nodes);
  },

  applyBatchCliCommands: (script: string) => {
    const trimmed = script.trim();
    // Auto-detect if user pasted a JSON snapshot instead of CLI commands
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const ok = get().importTopologyJson(trimmed);
      if (ok) {
        return { successCount: 1, errors: [] };
      }
    }

    const { nodes } = get();
    const lines = script.split(/\r?\n/);
    let targetNodeId: string = get().activeTerminalNodeId || Object.keys(nodes)[0] || 'r1';
    let count = 0;
    const errors: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Check for node switch directives:
      // e.g. "! Node: r1", "# Node: r1", "[r1]", "node r1"
      const nodeMatch =
        line.match(/^[!#]\s*(?:node|router|switch|host)?:?\s*([a-zA-Z0-9_\-]+)/i) ||
        line.match(/^\[([a-zA-Z0-9_\-]+)\]$/) ||
        line.match(/^node\s+([a-zA-Z0-9_\-]+)/i);

      if (nodeMatch) {
        const potentialNode = nodeMatch[1].toLowerCase();
        if (get().nodes[potentialNode]) {
          targetNodeId = potentialNode;
          continue;
        }
      }

      // Skip generic comments
      if (line.startsWith('!') || line.startsWith('#')) continue;

      // Execute on target node
      get().setActiveTerminal(targetNodeId);
      get().executeTerminalCommand(line);
      count++;
    }

    return { successCount: count, errors };
  },

  runVerificationCheck: () => {
    const { nodes, links } = get();
    const results: VerificationResult[] = [];

    // Test 1: Core Router OSPF Adjacency r1 <-> r2
    const p1 = simulatePing('r1', '10.12.0.2', false, nodes, links);
    results.push({
      test: 'Core Mesh: r1 to r2 link',
      source: 'r1',
      target: '10.12.0.2',
      status: p1.success ? 'passed' : 'failed',
      detail: p1.success ? `ICMP ping OK (${p1.rtt}ms)` : p1.error || 'Failed',
    });

    // Test 2: Core Router OSPF Adjacency r2 <-> r3
    const p2 = simulatePing('r2', '10.23.0.2', false, nodes, links);
    results.push({
      test: 'Core Mesh: r2 to r3 link',
      source: 'r2',
      target: '10.23.0.2',
      status: p2.success ? 'passed' : 'failed',
      detail: p2.success ? `ICMP ping OK (${p2.rtt}ms)` : p2.error || 'Failed',
    });

    // Test 3: Core Router OSPF Adjacency r1 <-> r3
    const p3 = simulatePing('r1', '10.13.0.2', false, nodes, links);
    results.push({
      test: 'Core Mesh: r1 to r3 link',
      source: 'r1',
      target: '10.13.0.2',
      status: p3.success ? 'passed' : 'failed',
      detail: p3.success ? `ICMP ping OK (${p3.rtt}ms)` : p3.error || 'Failed',
    });

    // Test 4: Host c11 to Gateway r11
    if (nodes['c11']) {
      const pHostGw = simulatePing('c11', '192.168.11.1', false, nodes, links);
      results.push({
        test: 'Host to Gateway: c11 to r11',
        source: 'c11',
        target: '192.168.11.1',
        status: pHostGw.success ? 'passed' : 'failed',
        detail: pHostGw.success
          ? `Ping to default GW OK (${pHostGw.rtt}ms)`
          : pHostGw.error || 'Failed',
      });
    }

    // Test 5: End-to-end Host c11 to Host c31 (Cross Core OSPF/iBGP)
    if (nodes['c11'] && nodes['c31']) {
      const pCross = simulatePing('c11', '192.168.31.2', false, nodes, links);
      results.push({
        test: 'End-to-End IPv4 Routing: c11 to c31',
        source: 'c11',
        target: '192.168.31.2',
        status: pCross.success ? 'passed' : 'failed',
        detail: pCross.success
          ? `Full multi-hop routing succeeded (${pCross.rtt}ms, ${pCross.hops.length} hops)`
          : pCross.error || 'Failed',
      });
    }

    // Test 6: IPv6 6in4 SIT Tunnel Ping (c11 to c31)
    if (nodes['c11'] && nodes['c31']) {
      const pV6 = simulatePing('c11', '2001:db8:200::10', true, nodes, links);
      results.push({
        test: '6in4 SIT Tunnel IPv6: c11 to c31',
        source: 'c11',
        target: '2001:db8:200::10',
        status: pV6.success ? 'passed' : 'failed',
        detail: pV6.success
          ? `IPv6 over IPv4 SIT encapsulation active (${pV6.rtt}ms)`
          : pV6.error || 'Check 6in4 tunnel routes',
      });
    }

    set({ verificationResults: results, isVerificationModalOpen: true });
  }
}));

// ----- Auto-Save Subscription (debounced 500ms) -----
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
useNetworkStore.subscribe((state) => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    saveToLocalStorage({
      currentPresetId: state.currentPresetId,
      currentPresetName: state.currentPresetName,
      nodes: state.nodes,
      links: state.links,
      isDarkMode: state.isDarkMode,
    });
  }, 500);
});
