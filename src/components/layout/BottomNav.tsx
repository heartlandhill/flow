'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  InboxIcon,
  TodayIcon,
  ForecastIcon,
  ProjectsIcon,
  TagsIcon,
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
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-[var(--bg-sidebar)] border-t border-[var(--border)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors"
              >
                <div className="relative">
                  <Icon
                    size={20}
                    className={
                      active
                        ? accentClasses[item.accentVar]
                        : 'text-[var(--text-secondary)]'
                    }
                  />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[var(--accent)] text-[9px] font-medium text-[var(--bg-root)] px-1">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] ${
                    active
                      ? accentClasses[item.accentVar]
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
