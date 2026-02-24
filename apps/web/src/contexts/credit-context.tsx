'use client';

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';
import { createClient } from '@/lib/supabase/client';

// --- Store types ---

interface CreditState {
  balance: number | null;
  plan: string;
  monthlyQuota: number;
  resetAt: string | null;
  isLoading: boolean;
  lastFetchedAt: number | null;
}

interface CreditActions {
  fetchBalance: () => Promise<void>;
  invalidate: () => void;
}

type CreditStore = CreditState & CreditActions;

// --- Store factory ---

const STALE_MS = 30_000; // 30 seconds

function createCreditStore() {
  return createStore<CreditStore>((set, get) => ({
    balance: null,
    plan: 'free',
    monthlyQuota: 500,
    resetAt: null,
    isLoading: false,
    lastFetchedAt: null,

    fetchBalance: async () => {
      const { lastFetchedAt, isLoading } = get();

      // Skip if already loading or data is fresh
      if (isLoading) return;
      if (lastFetchedAt && Date.now() - lastFetchedAt < STALE_MS) return;

      set({ isLoading: true });

      try {
        const res = await fetch('/api/credits/balance');
        if (!res.ok) {
          set({ isLoading: false });
          return;
        }
        const data = await res.json();
        set({
          balance: data.balance,
          plan: data.plan,
          monthlyQuota: data.monthlyQuota,
          resetAt: data.resetAt,
          isLoading: false,
          lastFetchedAt: Date.now(),
        });
      } catch {
        set({ isLoading: false });
      }
    },

    invalidate: () => {
      set({ lastFetchedAt: null });
    },
  }));
}

// --- React Context ---

const CreditContext = createContext<StoreApi<CreditStore> | null>(null);

export function CreditProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<StoreApi<CreditStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createCreditStore();
  }

  // Auto-fetch when user is logged in
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        storeRef.current?.getState().fetchBalance();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Invalidate and re-fetch on auth change (login, token refresh)
        storeRef.current?.getState().invalidate();
        storeRef.current?.getState().fetchBalance();
      } else {
        // Reset on logout
        storeRef.current?.setState({
          balance: null,
          plan: 'free',
          monthlyQuota: 500,
          resetAt: null,
          lastFetchedAt: null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <CreditContext.Provider value={storeRef.current}>
      {children}
    </CreditContext.Provider>
  );
}

// --- Hooks ---

function useCreditStore<T>(selector: (state: CreditStore) => T): T {
  const store = useContext(CreditContext);
  if (!store) {
    throw new Error('useCreditStore must be used within CreditProvider');
  }
  return useStore(store, selector);
}

export function useCreditBalance() {
  return useCreditStore((s) => s.balance);
}

export function useCreditPlan() {
  return useCreditStore((s) => s.plan);
}

export function useCreditData() {
  return useCreditStore((s) => ({
    balance: s.balance,
    plan: s.plan,
    monthlyQuota: s.monthlyQuota,
    resetAt: s.resetAt,
    isLoading: s.isLoading,
  }));
}

export function useCreditActions() {
  return useCreditStore((s) => ({
    fetchBalance: s.fetchBalance,
    invalidate: s.invalidate,
  }));
}

export function useCreditLoading() {
  return useCreditStore((s) => s.isLoading);
}
