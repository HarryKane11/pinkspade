'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Coins, ChevronDown } from 'lucide-react';

interface NavbarProps {
  onStartSetup?: () => void;
}

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

export function Navbar({ onStartSetup }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [creditPlan, setCreditPlan] = useState<string>('free');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch credit balance when user is logged in
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch('/api/credits/balance')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setCreditBalance(data.balance);
          setCreditPlan(data.plan);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showUserDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUserDropdown]);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setShowUserDropdown(false);
    router.push('/');
    router.refresh();
  }, [router]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200/50 bg-white/80 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-medium tracking-tight text-zinc-900 text-base flex items-center gap-2"
          >
            <img src="/logo.png" alt="Pink Spade" className="w-6 h-6" />
            Pink Spade
          </Link>
          <div className="hidden md:flex items-center gap-6 text-xs text-zinc-500 font-medium">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                href === '/about'
                  ? pathname === '/about'
                  : href === '/gallery'
                    ? pathname === '/gallery'
                    : href === '/pricing'
                      ? pathname === '/pricing'
                      : false;
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    isActive
                      ? 'text-zinc-900 transition-colors'
                      : 'hover:text-zinc-900 transition-colors'
                  }
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors hidden sm:block"
              >
                Dashboard
              </Link>

              {/* Credit badge */}
              {creditBalance !== null && (
                <div className="flex items-center gap-1 px-2 py-1 bg-zinc-100 rounded-full text-[10px] font-medium text-zinc-600">
                  <Coins className="w-3 h-3 text-amber-500" />
                  {creditBalance.toLocaleString()}
                </div>
              )}

              {/* User avatar + dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserDropdown((v) => !v)}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata.full_name || 'User'}
                      className="w-7 h-7 rounded-full border border-zinc-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-medium">
                      {(user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showUserDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-zinc-100">
                      <p className="text-xs font-medium text-zinc-900 truncate">{user.user_metadata?.full_name || user.email}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
                    </div>

                    {/* Balance + Plan */}
                    <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500">Credits</span>
                        <span className="text-xs font-medium text-zinc-900">{creditBalance?.toLocaleString() ?? '—'}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-zinc-500">Plan</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          creditPlan === 'enterprise' ? 'bg-purple-100 text-purple-700'
                            : creditPlan === 'ultra' ? 'bg-amber-100 text-amber-700'
                            : creditPlan === 'pro' ? 'bg-blue-100 text-blue-700'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {creditPlan === 'enterprise' ? 'Enterprise' : creditPlan === 'ultra' ? 'Ultra' : creditPlan === 'pro' ? 'Pro' : 'Free'}
                        </span>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setShowUserDropdown(false)}
                        className="block px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/pricing"
                        onClick={() => setShowUserDropdown(false)}
                        className="block px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        Upgrade Plan
                      </Link>
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-zinc-100 py-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-xs text-zinc-400 hover:text-red-500 hover:bg-red-50/50 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors hidden sm:block"
              >
                Log in
              </Link>
              <button
                onClick={onStartSetup}
                className="text-xs font-medium bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors shadow-sm"
              >
                Start for free
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
