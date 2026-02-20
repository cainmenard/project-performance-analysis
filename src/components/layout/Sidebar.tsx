import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import {
  LayoutDashboard,
  FolderKanban,
  TrendingUp,
  PieChart,
  Target,
  CalendarRange,
  GitCompareArrows,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Executive Summary', icon: LayoutDashboard },
  { to: '/portfolio', label: 'Project Portfolio', icon: FolderKanban },
  { to: '/gain-fade', label: 'Gain / Fade', icon: TrendingUp },
  { to: '/costs', label: 'Cost Analysis', icon: PieChart },
  { to: '/segments', label: 'Market Segments', icon: Target },
  { to: '/trends', label: 'YoY Trends', icon: CalendarRange },
  { to: '/compare', label: 'Compare Projects', icon: GitCompareArrows },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col border-r border-border bg-card">
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav className="lg:hidden flex border-b border-border bg-card overflow-x-auto">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
