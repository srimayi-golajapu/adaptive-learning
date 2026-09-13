import Link from 'next/link';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Adaptive Career Learning System',
  description: 'Personal adaptive career-learning web application',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200`}>
        <div className="flex h-full min-h-screen">
          {/* SIDEBAR */}
          <aside className="hidden md:flex flex-col w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed top-0 left-0 h-full z-30">
            <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-800">
              <Link href="/" className="text-blue-600 dark:text-blue-400 font-extrabold text-lg tracking-tight">
                AdaptiveCareer
              </Link>
              <p className="text-xs text-gray-400 mt-0.5">Personal Learning Engine</p>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              <NavLink href="/" label="Dashboard" icon="🏠" />
              <NavLink href="/skills" label="Skills" icon="🗺️" />
              <NavLink href="/practice" label="Practice & Quiz" icon="✏️" />
              <NavLink href="/revision" label="Revision Queue" icon="🔁" />
              <NavLink href="/diagnostic" label="Diagnostic" icon="🔬" />
              <NavLink href="/progress" label="Progress" icon="📈" />
              <NavLink href="/placement" label="Placement Ready" icon="🎯" />
              <NavLink href="/evidence" label="Evidence / Proof" icon="📎" />
              <NavLink href="/settings" label="Settings" icon="⚙️" />
            </nav>
          </aside>

          {/* MOBILE TOP NAV */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 py-3">
            <Link href="/" className="text-blue-600 dark:text-blue-400 font-bold text-lg">AdaptiveCareer</Link>
            <div className="flex gap-3 text-lg">
              <Link href="/" title="Home">🏠</Link>
              <Link href="/skills" title="Skills">🗺️</Link>
              <Link href="/practice" title="Practice">✏️</Link>
              <Link href="/revision" title="Revision">🔁</Link>
              <Link href="/placement" title="Placement">🎯</Link>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <main className="flex-1 md:ml-56 pt-14 md:pt-0 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
