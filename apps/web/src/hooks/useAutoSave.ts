'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStudio, useStudioStore } from '@/contexts/studio-context';

interface UseAutoSaveOptions {
  interval?: number; // Save interval in ms (default: 10000)
  onSave: (designId: string, designJson: string) => Promise<void>;
  onError?: (error: Error) => void;
}

export function useAutoSave({ interval = 10000, onSave, onError }: UseAutoSaveOptions) {
  const store = useStudioStore();
  const isDirty = useStudio((s) => s.isDirty);

  const lastSaveRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);

  // Read design/isDirty from store at call time so the callback has a stable identity
  // and doesn't reset the setInterval on every keystroke.
  const save = useCallback(async () => {
    const { design, isDirty: dirty, markSaved } = store.getState();
    if (!design || !dirty || isSavingRef.current) return;

    const designJson = JSON.stringify(design);

    // Skip if no changes since last save
    if (designJson === lastSaveRef.current) return;

    try {
      isSavingRef.current = true;
      await onSave(design.meta.id, designJson);
      lastSaveRef.current = designJson;
      markSaved();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Save failed'));
    } finally {
      isSavingRef.current = false;
    }
  }, [store, onSave, onError]);

  // Auto-save on interval — save has stable identity, so interval never resets during edits
  useEffect(() => {
    const timer = setInterval(() => {
      save();
    }, interval);

    return () => clearInterval(timer);
  }, [save, interval]);

  // Save on unmount if dirty
  useEffect(() => {
    return () => {
      const { design, isDirty: dirty } = store.getState();
      if (dirty && design) {
        onSave(design.meta.id, JSON.stringify(design)).catch(() => {
          // Ignore errors on unmount
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, onSave]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (store.getState().isDirty) {
        e.preventDefault();
        e.returnValue = '저장되지 않은 변경사항이 있습니다.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [store]);

  return {
    save,
    isSaving: isSavingRef.current,
    isDirty,
  };
}
