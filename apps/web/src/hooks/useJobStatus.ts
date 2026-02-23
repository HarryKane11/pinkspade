'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Job {
  id: string;
  type: string;
  status: JobStatus;
  progress: number;
  message?: string;
  result?: unknown;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseJobStatusOptions {
  pollingInterval?: number;
  onComplete?: (job: Job) => void;
  onError?: (job: Job) => void;
}

export function useJobStatus(
  jobId: string | null,
  options: UseJobStatusOptions = {}
) {
  const { pollingInterval = 1000, onComplete, onError } = options;

  const [job, setJob] = useState<Job | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchJobStatus = useCallback(async (id: string): Promise<Job | null> => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/jobs/${id}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }
      throw error;
    }
  }, []);

  const startPolling = useCallback(async () => {
    if (!jobId || isPolling) return;

    setIsPolling(true);

    const poll = async () => {
      try {
        const jobData = await fetchJobStatus(jobId);

        if (!jobData) return;

        setJob(jobData);

        if (jobData.status === 'completed') {
          setIsPolling(false);
          onComplete?.(jobData);
          return;
        }

        if (jobData.status === 'failed') {
          setIsPolling(false);
          onError?.(jobData);
          return;
        }

        // Continue polling
        if (jobData.status === 'pending' || jobData.status === 'running') {
          setTimeout(poll, pollingInterval);
        }
      } catch {
        setIsPolling(false);
      }
    };

    poll();
  }, [jobId, isPolling, pollingInterval, fetchJobStatus, onComplete, onError]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    abortControllerRef.current?.abort();
  }, []);

  // Auto-start polling when jobId changes
  useEffect(() => {
    if (jobId) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [jobId, startPolling, stopPolling]);

  return {
    job,
    isPolling,
    startPolling,
    stopPolling,
  };
}

// Hook for managing multiple concurrent jobs
export function useJobQueue() {
  const [jobs, setJobs] = useState<Map<string, Job>>(new Map());
  const [activeJobIds, setActiveJobIds] = useState<Set<string>>(new Set());

  const addJob = useCallback((jobId: string, type: string) => {
    const newJob: Job = {
      id: jobId,
      type,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setJobs((prev) => new Map(prev).set(jobId, newJob));
    setActiveJobIds((prev) => new Set(prev).add(jobId));
  }, []);

  const updateJob = useCallback((jobId: string, updates: Partial<Job>) => {
    setJobs((prev) => {
      const job = prev.get(jobId);
      if (!job) return prev;

      const updated = new Map(prev);
      updated.set(jobId, {
        ...job,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      return updated;
    });

    // Remove from active if completed or failed
    if (updates.status === 'completed' || updates.status === 'failed') {
      setActiveJobIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setJobs((prev) => {
      const next = new Map(prev);
      next.delete(jobId);
      return next;
    });
    setActiveJobIds((prev) => {
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });
  }, []);

  const clearCompleted = useCallback(() => {
    setJobs((prev) => {
      const next = new Map(prev);
      for (const [id, job] of next) {
        if (job.status === 'completed' || job.status === 'failed') {
          next.delete(id);
        }
      }
      return next;
    });
  }, []);

  return {
    jobs: Array.from(jobs.values()),
    activeJobs: Array.from(jobs.values()).filter((j) => activeJobIds.has(j.id)),
    hasActiveJobs: activeJobIds.size > 0,
    addJob,
    updateJob,
    removeJob,
    clearCompleted,
  };
}
