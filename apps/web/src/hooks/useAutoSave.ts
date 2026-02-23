'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStudio } from '@/contexts/studio-context';

interface UseAutoSaveOptions {
  interval?: number; // Save interval in ms (default: 10000)
  onSave: (designId: string, designJson: string) => Promise<void>;
  onError?: (error: Error) => void;
}

export function useAutoSave({ interval = 10000, onSave, onError }: UseAutoSaveOptions) {
  const design = useStudio((s) => s.design);
  const isDirty = useStudio((s) => s.isDirty);
  const markSaved = useStudio((s) => s.markSaved);

  const lastSaveRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (!design || !isDirty || isSavingRef.current) return;

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
  }, [design, isDirty, onSave, onError, markSaved]);

  // Auto-save on interval
  useEffect(() => {
    const timer = setInterval(() => {
      save();
    }, interval);

    return () => clearInterval(timer);
  }, [save, interval]);

  // Save on unmount if dirty
  useEffect(() => {
    return () => {
      if (isDirty && design) {
        // Fire-and-forget save on unmount
        onSave(design.meta.id, JSON.stringify(design)).catch(() => {
          // Ignore errors on unmount
        });
      }
    };
  }, [isDirty, design, onSave]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '저장되지 않은 변경사항이 있습니다.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return {
    save,
    isSaving: isSavingRef.current,
    isDirty,
  };
}
