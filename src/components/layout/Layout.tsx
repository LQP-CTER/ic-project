import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import './Layout.css';

export function Layout() {
  const { pathname } = useLocation();
  const isAiPage = pathname === '/ai-assistant';

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main className={`page-content animate-fade-in${isAiPage ? ' ai-page' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
