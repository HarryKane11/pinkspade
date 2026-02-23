'use client';

import { createContext, useContext, useRef, useMemo, useCallback, type ReactNode } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { enablePatches, produceWithPatches, applyPatches, type Patch } from 'immer';
import type { DesignJSON, Layer, Canvas } from '@/lib/shared';

enablePatches();

// History entry for undo/redo
interface HistoryEntry {
  patches: Patch[];
  inversePatches: Patch[];
  timestamp: number;
  description: string;
}

// Selection state
interface SelectionState {
  selectedLayerIds: string[];
  hoveredLayerId: string | null;
  editingLayerId: string | null; // For text editing mode
}

// Viewport state for canvas zoom/pan
interface ViewportState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

// Studio store state
interface StudioState {
  // Design data
  design: DesignJSON | null;
  isDirty: boolean;
  lastSavedAt: Date | null;

  // Selection
  selection: SelectionState;

  // Viewport
  viewport: ViewportState;

  // History
  history: HistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;

  // Clipboard
  clipboard: Layer[] | null;

  // Tool state
  activeTool: 'select' | 'text' | 'shape' | 'pan';

  // UI state
  isLoading: boolean;
  error: string | null;
}

// Studio store actions
interface StudioActions {
  // Design management
  loadDesign: (design: DesignJSON) => void;
  updateDesign: (updater: (draft: DesignJSON) => void, description?: string) => void;
  markSaved: () => void;

  // Layer operations
  addLayer: (layer: Layer) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  removeLayer: (layerId: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  duplicateLayer: (layerId: string) => void;

  // Selection
  selectLayer: (layerId: string, addToSelection?: boolean) => void;
  selectLayers: (layerIds: string[]) => void;
  deselectAll: () => void;
  setHoveredLayer: (layerId: string | null) => void;
  setEditingLayer: (layerId: string | null) => void;

  // Viewport
  setZoom: (zoom: number) => void;
  setOffset: (offsetX: number, offsetY: number) => void;
  resetViewport: () => void;
  fitToCanvas: (containerWidth: number, containerHeight: number) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Clipboard
  copyLayers: () => void;
  pasteLayers: () => void;
  cutLayers: () => void;

  // Tool
  setActiveTool: (tool: StudioState['activeTool']) => void;

  // Canvas operations
  updateCanvas: (updates: Partial<Canvas>) => void;

  // UI state
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

type StudioStore = StudioState & StudioActions;

const createStudioStore = () =>
  createStore<StudioStore>()(
    immer((set, get) => ({
      // Initial state
      design: null,
      isDirty: false,
      lastSavedAt: null,

      selection: {
        selectedLayerIds: [],
        hoveredLayerId: null,
        editingLayerId: null,
      },

      viewport: {
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      },

      history: [],
      historyIndex: -1,
      maxHistorySize: 20,

      clipboard: null,

      activeTool: 'select',

      isLoading: false,
      error: null,

      // Actions
      loadDesign: (design) =>
        set((state) => {
          state.design = design;
          state.isDirty = false;
          state.history = [];
          state.historyIndex = -1;
          state.selection = {
            selectedLayerIds: [],
            hoveredLayerId: null,
            editingLayerId: null,
          };
        }),

      updateDesign: (updater, description = 'Update') =>
        set((state) => {
          if (!state.design) return;

          const [nextDesign, patches, inversePatches] = produceWithPatches(
            state.design,
            updater
          );

          if (patches.length === 0) return;

          state.design = nextDesign;
          state.isDirty = true;

          // Update meta timestamp
          state.design.meta.updatedAt = new Date().toISOString();

          // Add to history
          const historyEntry: HistoryEntry = {
            patches,
            inversePatches,
            timestamp: Date.now(),
            description,
          };

          // Remove any redo entries
          state.history = state.history.slice(0, state.historyIndex + 1);

          // Add new entry
          state.history.push(historyEntry);

          // Enforce max history size
          if (state.history.length > state.maxHistorySize) {
            state.history = state.history.slice(-state.maxHistorySize);
          }

          state.historyIndex = state.history.length - 1;
        }),

      markSaved: () =>
        set((state) => {
          state.isDirty = false;
          state.lastSavedAt = new Date();
        }),

      addLayer: (layer) => {
        get().updateDesign((draft) => {
          draft.layers.push(layer);
        }, `Add ${layer.type} layer`);
      },

      updateLayer: (layerId, updates) => {
        get().updateDesign((draft) => {
          const index = draft.layers.findIndex((l) => l.id === layerId);
          if (index !== -1) {
            Object.assign(draft.layers[index], updates);
          }
        }, 'Update layer');
      },

      removeLayer: (layerId) => {
        get().updateDesign((draft) => {
          const index = draft.layers.findIndex((l) => l.id === layerId);
          if (index !== -1) {
            draft.layers.splice(index, 1);
          }
        }, 'Remove layer');

        // Clear selection if removed
        set((state) => {
          state.selection.selectedLayerIds = state.selection.selectedLayerIds.filter(
            (id) => id !== layerId
          );
        });
      },

      reorderLayers: (fromIndex, toIndex) => {
        get().updateDesign((draft) => {
          const [layer] = draft.layers.splice(fromIndex, 1);
          draft.layers.splice(toIndex, 0, layer);
        }, 'Reorder layers');
      },

      duplicateLayer: (layerId) => {
        const state = get();
        if (!state.design) return;

        const layer = state.design.layers.find((l) => l.id === layerId);
        if (!layer) return;

        const newLayer: Layer = {
          ...JSON.parse(JSON.stringify(layer)),
          id: crypto.randomUUID(),
          name: `${layer.name} (복사)`,
          position: {
            x: layer.position.x + 20,
            y: layer.position.y + 20,
          },
        };

        get().addLayer(newLayer);
        get().selectLayer(newLayer.id);
      },

      selectLayer: (layerId, addToSelection = false) =>
        set((state) => {
          if (addToSelection) {
            if (state.selection.selectedLayerIds.includes(layerId)) {
              state.selection.selectedLayerIds = state.selection.selectedLayerIds.filter(
                (id) => id !== layerId
              );
            } else {
              state.selection.selectedLayerIds.push(layerId);
            }
          } else {
            state.selection.selectedLayerIds = [layerId];
          }
        }),

      selectLayers: (layerIds) =>
        set((state) => {
          state.selection.selectedLayerIds = layerIds;
        }),

      deselectAll: () =>
        set((state) => {
          state.selection.selectedLayerIds = [];
          state.selection.editingLayerId = null;
        }),

      setHoveredLayer: (layerId) =>
        set((state) => {
          state.selection.hoveredLayerId = layerId;
        }),

      setEditingLayer: (layerId) =>
        set((state) => {
          state.selection.editingLayerId = layerId;
        }),

      setZoom: (zoom) =>
        set((state) => {
          state.viewport.zoom = Math.max(0.1, Math.min(5, zoom));
        }),

      setOffset: (offsetX, offsetY) =>
        set((state) => {
          state.viewport.offsetX = offsetX;
          state.viewport.offsetY = offsetY;
        }),

      resetViewport: () =>
        set((state) => {
          state.viewport = { zoom: 1, offsetX: 0, offsetY: 0 };
        }),

      fitToCanvas: (containerWidth, containerHeight) =>
        set((state) => {
          if (!state.design) return;

          const { width, height } = state.design.canvas;
          const padding = 64;

          const scaleX = (containerWidth - padding * 2) / width;
          const scaleY = (containerHeight - padding * 2) / height;
          const zoom = Math.min(scaleX, scaleY, 1);

          state.viewport.zoom = zoom;
          state.viewport.offsetX = (containerWidth - width * zoom) / 2;
          state.viewport.offsetY = (containerHeight - height * zoom) / 2;
        }),

      undo: () =>
        set((state) => {
          if (state.historyIndex < 0 || !state.design) return;

          const entry = state.history[state.historyIndex];
          state.design = applyPatches(state.design, entry.inversePatches);
          state.historyIndex--;
          state.isDirty = true;
        }),

      redo: () =>
        set((state) => {
          if (state.historyIndex >= state.history.length - 1 || !state.design) return;

          state.historyIndex++;
          const entry = state.history[state.historyIndex];
          state.design = applyPatches(state.design, entry.patches);
          state.isDirty = true;
        }),

      canUndo: () => get().historyIndex >= 0,

      canRedo: () => get().historyIndex < get().history.length - 1,

      copyLayers: () => {
        const state = get();
        if (!state.design) return;
        const selectedIds = state.selection.selectedLayerIds;
        const layers = state.design.layers.filter((l) => selectedIds.includes(l.id));
        if (layers.length === 0) return;
        set((s) => {
          s.clipboard = JSON.parse(JSON.stringify(layers));
        });
      },

      pasteLayers: () => {
        const state = get();
        if (!state.clipboard || state.clipboard.length === 0 || !state.design) return;
        const newIds: string[] = [];
        state.clipboard.forEach((layer) => {
          const newLayer: Layer = {
            ...JSON.parse(JSON.stringify(layer)),
            id: crypto.randomUUID(),
            name: `${layer.name} (복사)`,
            position: {
              x: layer.position.x + 20,
              y: layer.position.y + 20,
            },
          };
          get().addLayer(newLayer);
          newIds.push(newLayer.id);
        });
        get().selectLayers(newIds);
      },

      cutLayers: () => {
        get().copyLayers();
        const selectedIds = get().selection.selectedLayerIds;
        selectedIds.forEach((id) => get().removeLayer(id));
      },

      setActiveTool: (tool) =>
        set((state) => {
          state.activeTool = tool;
        }),

      updateCanvas: (updates) => {
        get().updateDesign((draft) => {
          Object.assign(draft.canvas, updates);
        }, 'Update canvas');
      },

      setLoading: (isLoading) =>
        set((state) => {
          state.isLoading = isLoading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),
    }))
  );

// Context
const StudioContext = createContext<StoreApi<StudioStore> | null>(null);

// Provider
interface StudioProviderProps {
  children: ReactNode;
}

export function StudioProvider({ children }: StudioProviderProps) {
  const storeRef = useRef<StoreApi<StudioStore> | undefined>(undefined);
  if (!storeRef.current) {
    storeRef.current = createStudioStore();
  }

  return (
    <StudioContext.Provider value={storeRef.current}>
      {children}
    </StudioContext.Provider>
  );
}

// Hook with SSR safety
export function useStudio<T>(selector: (state: StudioStore) => T): T {
  const store = useContext(StudioContext);
  if (!store) {
    throw new Error('useStudio must be used within a StudioProvider');
  }

  // Keep selector ref current to avoid stale closures while maintaining stable identity
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableSelector = useCallback((s: StudioStore) => selectorRef.current(s), []);

  return useStore(store, stableSelector);
}

// Convenience hooks
export function useDesign() {
  return useStudio((s) => s.design);
}

export function useLayers() {
  const store = useContext(StudioContext);
  if (!store) {
    throw new Error('useLayers must be used within a StudioProvider');
  }
  return useStore(store, useShallow((s) => s.design?.layers ?? []));
}

export function useSelectedLayers() {
  const store = useContext(StudioContext);
  if (!store) {
    throw new Error('useSelectedLayers must be used within a StudioProvider');
  }
  return useStore(
    store,
    useShallow((s) => {
      const selectedIds = s.selection.selectedLayerIds;
      return s.design?.layers.filter((l) => selectedIds.includes(l.id)) ?? [];
    })
  );
}

export function useSelection() {
  return useStudio((s) => s.selection);
}

export function useViewport() {
  return useStudio((s) => s.viewport);
}

// Raw store access for event handlers (no re-renders)
export function useStudioStore() {
  const store = useContext(StudioContext);
  if (!store) {
    throw new Error('useStudioStore must be used within a StudioProvider');
  }
  return store;
}

export function useStudioActions() {
  const store = useContext(StudioContext);
  if (!store) {
    throw new Error('useStudioActions must be used within a StudioProvider');
  }

  // Zustand+Immer action functions are stable across renders (same reference),
  // so memoizing on `store` gives a stable returned object.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    const state = store.getState();
    return {
      loadDesign: state.loadDesign,
      updateDesign: state.updateDesign,
      markSaved: state.markSaved,
      addLayer: state.addLayer,
      updateLayer: state.updateLayer,
      removeLayer: state.removeLayer,
      reorderLayers: state.reorderLayers,
      duplicateLayer: state.duplicateLayer,
      selectLayer: state.selectLayer,
      selectLayers: state.selectLayers,
      deselectAll: state.deselectAll,
      setHoveredLayer: state.setHoveredLayer,
      setEditingLayer: state.setEditingLayer,
      setZoom: state.setZoom,
      setOffset: state.setOffset,
      resetViewport: state.resetViewport,
      fitToCanvas: state.fitToCanvas,
      undo: state.undo,
      redo: state.redo,
      canUndo: state.canUndo,
      canRedo: state.canRedo,
      copyLayers: state.copyLayers,
      pasteLayers: state.pasteLayers,
      cutLayers: state.cutLayers,
      setActiveTool: state.setActiveTool,
      updateCanvas: state.updateCanvas,
      setLoading: state.setLoading,
      setError: state.setError,
    };
  }, [store]);
}
