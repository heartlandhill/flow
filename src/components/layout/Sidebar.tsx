'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  InboxIcon,
  TodayIcon,
  ForecastIcon,
  ProjectsIcon,
  TagsIcon,
  ReviewIcon,
  PlusIcon,
} from '@/components/ui/Icons';
import { useQuickCapture } from '@/hooks/useQuickCapture';
import { useSelectedTask } from '@/context/SelectedTaskContext';
import type { BadgeCounts } from '@/lib/queries/badge-counts';

interface SidebarProps {
  badgeCounts: BadgeCounts;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentVar: string;
  badgeKey?: keyof BadgeCounts;
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
  { href: '/inbox', label: 'Inbox', icon: InboxIcon, accentVar: '--view-inbox', badgeKey: 'inbox' },
  { href: '/today', label: 'Today', icon: TodayIcon, accentVar: '--view-today', badgeKey: 'today' },
  { href: '/forecast', label: 'Forecast', icon: ForecastIcon, accentVar: '--view-forecast' },
  { href: '/projects', label: 'Projects', icon: ProjectsIcon, accentVar: '--view-projects' },
  { href: '/tags', label: 'Tags', icon: TagsIcon, accentVar: '--view-tags' },
  { href: '/review', label: 'Review', icon: ReviewIcon, accentVar: '--view-review', badgeKey: 'review' },
];

export function Sidebar({ badgeCounts }: SidebarProps) {
  const pathname = usePathname();
  const { open } = useQuickCapture();
  const { clearSelectedTask } = useSelectedTask();
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <aside className="w-60 h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div
          className="w-7 h-7 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, #C47A5A 100%)',
          }}
        />
        <span className="font-display text-lg font-medium text-[var(--text-primary)]">
          Flow
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-1">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : 0;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={clearSelectedTask}
                  className={`
                    group flex items-center gap-2.5 px-3 py-2 rounded-md text-[13.5px] transition-all duration-150
                    hover:bg-[var(--bg-hover)]
                    focus:outline-none focus-visible:bg-[var(--bg-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-inset
                    ${active ? 'bg-[var(--bg-selected)]' : ''}
                  `}
                >
                  <Icon
                    size={20}
                    className={`transition-opacity duration-150 ${
                      active
                        ? `${accentClasses[item.accentVar]} opacity-100`
                        : 'text-[var(--text-secondary)] opacity-60 group-hover:opacity-90'
                    }`}
                  />
                  <span
                    className={`transition-colors duration-150 ${
                      active
                        ? 'text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {item.label}
                  </span>
                  {badgeCount > 0 && (
                    <span
                      className={`ml-auto min-w-[20px] h-[18px] flex items-center justify-center rounded-[10px] text-[11px] font-medium px-1.5 ${
                        active
                          ? 'bg-[rgba(232,168,124,0.15)] text-[var(--accent)]'
                          : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick Capture Button */}
      <div className="px-3 py-4">
        <button
          type="button"
          onClick={open}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-[var(--border)] rounded-md text-[var(--text-secondary)] hover:border-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <PlusIcon size={16} />
          <span className="text-[13px]">Quick Capture</span>
          <span className="ml-auto text-[11px] text-[var(--text-tertiary)]">
            ⌘N
          </span>
        </button>
      </div>
    </aside>
  );
}
