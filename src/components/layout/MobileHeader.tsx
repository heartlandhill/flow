'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  InboxIcon,
  TodayIcon,
  ForecastIcon,
  ProjectsIcon,
  TagsIcon,
  ReviewIcon,
  MenuIcon,
  PlusIcon,
  CloseIcon,
} from '@/components/ui/Icons';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentVar: string;
  badge?: number;
}

// Static class mapping to ensure Tailwind JIT generates these classes
const accentClasses: Record<string, string> = {
  '--view-inbox': 'text-[var(--view-inbox)]',
  '--view-today': 'text-[var(--view-today)]',
  '--view-forecast': 'text-[var(--view-forecast)]',
  '--view-projects': 'text-[var(--view-projects)]',
  '--view-tags': 'text-[var(--view-tags)]',
  '--view-review': 'text-[var(--view-review)]',
};

const navItems: NavItem[] = [
  { href: '/inbox', label: 'Inbox', icon: InboxIcon, accentVar: '--view-inbox', badge: 4 },
  { href: '/today', label: 'Today', icon: TodayIcon, accentVar: '--view-today', badge: 2 },
  { href: '/forecast', label: 'Forecast', icon: ForecastIcon, accentVar: '--view-forecast' },
  { href: '/projects', label: 'Projects', icon: ProjectsIcon, accentVar: '--view-projects' },
  { href: '/tags', label: 'Tags', icon: TagsIcon, accentVar: '--view-tags' },
  { href: '/review', label: 'Review', icon: ReviewIcon, accentVar: '--view-review', badge: 3 },
];

export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen, closeMenu]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[var(--bg-sidebar)] border-b border-[var(--border)] flex items-center justify-between px-4 z-40">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md"
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #C47A5A 100%)',
            }}
          />
          <span className="font-display text-base font-medium text-[var(--text-primary)]">
            Flow
          </span>
        </div>

        {/* Hamburger Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="p-2 -mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Open menu"
        >
          <MenuIcon size={24} />
        </button>
      </header>

      {/* Bottom Sheet Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Bottom Sheet */}
      <div
        className={`
          fixed inset-x-0 bottom-0 z-50
          bg-[var(--bg-sidebar)] rounded-t-2xl
          transform transition-transform duration-300 ease-out
          ${isMenuOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Sheet Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-[var(--border)] rounded-full" />
        </div>

        {/* Close Button */}
        <div className="absolute top-3 right-3">
          <button
            type="button"
            onClick={closeMenu}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close menu"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 pt-2 pb-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-colors
                      ${active
                        ? 'bg-[var(--bg-selected)]'
                        : 'hover:bg-[var(--bg-hover)]'
                      }
                    `}
                  >
                    <Icon
                      size={22}
                      className={
                        active
                          ? accentClasses[item.accentVar]
                          : 'text-[var(--text-secondary)]'
                      }
                    />
                    <span
                      className={active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}
                    >
                      {item.label}
                    </span>
                    {item.badge !== undefined && (
                      <span
                        className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-medium text-[var(--bg-root)] px-1.5"
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Divider */}
        <div className="mx-4 border-t border-[var(--border)]" />

        {/* Quick Capture Button */}
        <div className="px-4 py-4">
          <button
            type="button"
            onClick={closeMenu}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:border-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <PlusIcon size={18} />
            <span className="text-sm">Quick Capture</span>
          </button>
        </div>
      </div>
    </>
  );
}
