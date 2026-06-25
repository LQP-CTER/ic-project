import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function Layout() {
  const { pathname } = useLocation();
  const isAiPage = pathname === '/ai-assistant';

  return (
    <div className="flex h-screen overflow-hidden bg-surface-secondary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className={`flex-1 overflow-auto p-8 animate-fade-in ${isAiPage ? 'flex flex-col p-5' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
