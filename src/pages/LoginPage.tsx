import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const success = await login(email.trim());
    if (!success) {
      toast.error('Email không có trong danh sách được phép truy cập');
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface rounded-2xl border border-border p-10 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-xl mx-auto mb-6">
          IC
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">IC Platform</h1>
        <p className="text-sm text-text-secondary mb-8 leading-relaxed">
          Nền tảng quản lý truyền thông nội bộ và gắn kết nhân viên
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
