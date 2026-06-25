import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/activities', label: 'Hoạt động' },
  { to: '/ai-assistant', label: 'AI Assistant' },
  { to: '/workflow', label: 'Workflow' },
  { to: '/library', label: 'Thư viện' },
];

export function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-surface border-r border-border flex flex-col shrink-0">
      <div className="h-[70px] flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm">
            IC
          </div>
          <span className="text-lg font-bold text-text-primary tracking-tight">Platform</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary-light text-primary'
                  : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
