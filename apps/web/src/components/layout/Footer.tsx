import Link from 'next/link';

export function Footer() {
  return (
    <footer className="py-8 border-t border-zinc-200 bg-white relative z-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <Link
          href="/"
          className="font-medium tracking-tight text-zinc-900 text-sm flex items-center gap-2"
        >
          <img src="/logo.png" alt="Pink Spade" className="w-5 h-5" />
          Pink Spade
        </Link>
        <div className="flex items-center gap-6 text-xs text-zinc-500 font-light">
          <a href="#" className="hover:text-zinc-900 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-zinc-900 transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-zinc-900 transition-colors">
            Contact
          </a>
        </div>
        <div className="text-xs text-zinc-400 font-light">
          © 2026 Pink Spade Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
