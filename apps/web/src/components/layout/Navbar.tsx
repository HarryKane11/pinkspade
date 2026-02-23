'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

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
                href="/workspace"
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors hidden sm:block"
              >
                Workspace
              </Link>
              <button
                onClick={handleSignOut}
                className="text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors hidden sm:block"
              >
                Sign out
              </button>
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
