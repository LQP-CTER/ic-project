import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const titles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Theo dõi tiến độ truyền thông nội bộ' },
  '/activities': { title: 'Hoạt động', subtitle: 'Quản lý dự án, deadline và người phụ trách' },
  '/ai-assistant': { title: 'AI Assistant', subtitle: 'Tạo nội dung truyền thông theo ngữ cảnh' },
  '/workflow': { title: 'Workflow', subtitle: 'Khởi tạo dự án từ quy trình mẫu' },
  '/library': { title: 'Thư viện', subtitle: 'Lưu trữ nội dung đã duyệt và có thể tái sử dụng' },
  '/team-voice': { title: 'Team Voice', subtitle: 'Quản lý bài mẫu để AI học giọng viết của team' },
  '/users': { title: 'Người dùng', subtitle: 'Quản lý quyền truy cập workspace' },
};

const DEFAULT_PAGE = { title: 'IC Platform', subtitle: 'Internal Communications Hub' };

export function Topbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const page = titles[pathname] || DEFAULT_PAGE;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="app-topbar">
      <div>
        <div className="topbar-kicker">IC Platform</div>
        <h1 className="topbar-title">{page.title}</h1>
        <div className="topbar-subtitle">{page.subtitle}</div>
      </div>

      <div className="topbar-right">
        <div className="sync-status">
          <div className="sync-status-title">Google Sheets mode</div>
          <div className="sync-status-text">Dữ liệu đồng bộ qua Apps Script</div>
        </div>

        <div className="relative" ref={profileRef}>
          <button className="profile-button" onClick={() => setShowProfile(!showProfile)}>
            <span className="profile-avatar">{initial}</span>
            <span>
              <span className="profile-name">{displayName}</span>
              <span className="profile-email">{displayEmail}</span>
            </span>
          </button>

          {showProfile && (
            <div className="profile-menu animate-scale-in">
              <div className="profile-menu-head">
                <div className="profile-menu-name">{displayName}</div>
                <div className="profile-menu-email">{displayEmail}</div>
              </div>
              <button onClick={logout} className="profile-menu-action">Đăng xuất</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
