import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export function Topbar() {
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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
    <header className="h-[70px] bg-surface border-b border-border flex items-center justify-between px-8 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <div className="relative" ref={profileRef}>
          <button
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-surface-tertiary transition-colors"
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
              {initial}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-text-primary leading-tight">{displayName}</span>
              <span className="text-xs text-text-tertiary leading-tight">{displayEmail}</span>
            </div>
          </button>

          {showProfile && (
            <div className="absolute top-[calc(100%+8px)] right-0 w-56 bg-surface border border-border rounded-xl shadow-lg z-50 p-2 animate-scale-in">
              <div className="px-3 py-2 border-b border-border mb-2">
                <p className="text-sm font-semibold text-text-primary">{displayName}</p>
                <p className="text-xs text-text-tertiary">{displayEmail}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger-light transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
