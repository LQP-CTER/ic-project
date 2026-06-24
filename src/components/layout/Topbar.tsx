import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, Settings, UserCircle, ChevronDown } from 'lucide-react';
import './Layout.css';

export function Topbar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="topbar glass">
      <div className="topbar-search">
        <Search size={18} className="text-secondary" />
        <input type="text" placeholder="Tìm kiếm..." />
      </div>
      <div className="topbar-actions flex items-center gap-4">
        
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            className="icon-btn" 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <Bell size={20} />
            <span className="badge-dot"></span>
          </button>
          
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: '-10px',
              width: '320px',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              zIndex: 50,
              overflow: 'hidden',
              animation: 'fadeSlideIn 0.2s ease'
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>Thông báo</h3>
              </div>
              <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', marginBottom: '8px' }}>
                  <Bell size={24} style={{ color: '#475569' }} />
                </div>
                <p style={{ fontWeight: 500, color: '#e2e8f0', margin: 0 }}>Chưa có thông báo mới</p>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                  Các nhắc nhở và cập nhật hoạt động sẽ hiển thị tại đây.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <div 
            className="user-profile flex items-center gap-2" 
            onClick={() => setShowProfile(!showProfile)}
            style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div className="avatar">
              <User size={20} />
            </div>
            <div className="user-info flex-col" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="text-sm font-semibold">Admin</span>
              <span className="text-xs text-secondary">EX Team</span>
            </div>
            <ChevronDown size={14} style={{ color: '#94a3b8', marginLeft: '4px' }} />
          </div>

          {showProfile && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '240px',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              zIndex: 50,
              overflow: 'hidden',
              animation: 'fadeSlideIn 0.2s ease',
              padding: '8px'
            }}>
              <div style={{ padding: '8px 12px 16px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '8px' }}>
                <p style={{ fontWeight: 600, color: '#f8fafc', margin: '0 0 2px 0' }}>Admin</p>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>EX Team</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button style={dropdownItemStyle}>
                  <UserCircle size={16} />
                  <span>Hồ sơ cá nhân</span>
                </button>
                <button style={dropdownItemStyle}>
                  <Settings size={16} />
                  <span>Cài đặt</span>
                </button>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                <button style={{ ...dropdownItemStyle, color: '#ef4444' }}>
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

const dropdownItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
  padding: '10px 12px',
  background: 'transparent',
  border: 'none',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.2s',
};

