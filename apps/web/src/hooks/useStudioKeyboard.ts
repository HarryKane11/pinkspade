'use client';

import { useEffect, useRef } from 'react';
import { useStudioStore, useStudioActions } from '@/contexts/studio-context';

interface UseStudioKeyboardOptions {
  onSave: () => void;
  isPreviewMode: boolean;
  onExitPreview: () => void;
}

export function useStudioKeyboard({
  onSave,
  isPreviewMode,
  onExitPreview,
}: UseStudioKeyboardOptions) {
  const store = useStudioStore();
  const actions = useStudioActions();
  const previousToolRef = useRef<'select' | 'text' | 'shape' | 'pan'>('select');

  useEffect(() => {
    const isInputFocused = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Escape: exit preview, exit editing, or deselect
      if (e.key === 'Escape') {
        if (isPreviewMode) {
          onExitPreview();
          return;
        }
        const { selection } = store.getState();
        if (selection.editingLayerId) {
          actions.setEditingLayer(null);
        } else {
          actions.deselectAll();
        }
        return;
      }

      // Ctrl-based shortcuts
      if (ctrl) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            onSave();
            return;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              actions.redo();
            } else {
              actions.undo();
            }
            return;
          case 'y':
            e.preventDefault();
            actions.redo();
            return;
          case 'c':
            if (isInputFocused()) return;
            e.preventDefault();
            actions.copyLayers();
            return;
          case 'v':
            if (isInputFocused()) return;
            e.preventDefault();
            actions.pasteLayers();
            return;
          case 'x':
            if (isInputFocused()) return;
            e.preventDefault();
            actions.cutLayers();
            return;
          case 'd': {
            if (isInputFocused()) return;
            e.preventDefault();
            const { selection } = store.getState();
            selection.selectedLayerIds.forEach((id) => actions.duplicateLayer(id));
            return;
          }
          case 'a': {
            if (isInputFocused()) return;
            e.preventDefault();
            const { design } = store.getState();
            if (design) {
              actions.selectLayers(design.layers.map((l) => l.id));
            }
            return;
          }
        }
        return;
      }

      // Non-ctrl shortcuts: skip if in input
      if (isInputFocused()) return;

      switch (e.key) {
        case 'Delete':
        case 'Backspace': {
          e.preventDefault();
          const { selection } = store.getState();
          // Don't delete if editing text
          if (selection.editingLayerId) return;
          selection.selectedLayerIds.forEach((id) => actions.removeLayer(id));
          return;
        }
        case 'v':
        case 'V':
          actions.setActiveTool('select');
          return;
        case 't':
        case 'T':
          actions.setActiveTool('text');
          return;
        case 's':
        case 'S':
          actions.setActiveTool('shape');
          return;
        case ' ': {
          e.preventDefault();
          const { activeTool } = store.getState();
          if (activeTool !== 'pan') {
            previousToolRef.current = activeTool;
          }
          actions.setActiveTool('pan');
          return;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        actions.setActiveTool(previousToolRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [store, actions, onSave, isPreviewMode, onExitPreview]);
}
