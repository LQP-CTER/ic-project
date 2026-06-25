import { NavLink } from 'react-router-dom';
import { BrandLogo } from '../brand/BrandLogo';

const links = [
  { to: '/', label: 'Dashboard', hint: 'Tổng quan' },
  { to: '/activities', label: 'Hoạt động', hint: 'Dự án và task' },
  { to: '/ai-assistant', label: 'AI Assistant', hint: 'Tạo nội dung' },
  { to: '/workflow', label: 'Workflow', hint: 'Template' },
  { to: '/library', label: 'Thư viện', hint: 'Nội dung đã lưu' },
  { to: '/team-voice', label: 'Team Voice', hint: 'Bài mẫu AI' },
  { to: '/users', label: 'Người dùng', hint: 'Phân quyền' },
];

export function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <BrandLogo size="md" theme="dark" />
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          >
            <span className="sidebar-link-label">{link.label}</span>
            <span className="sidebar-link-hint">{link.hint}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-workspace">
          <div className="sidebar-footer-label">Live workspace</div>
          <div className="sidebar-footer-title">IC Data</div>
          <div className="sidebar-footer-text">Google Sheets database đã kết nối và sẵn sàng đồng bộ.</div>
        </div>
      </div>
    </aside>
  );
}
