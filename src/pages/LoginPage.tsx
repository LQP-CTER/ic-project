import { useState } from 'react';
import { BrandLogo } from '../components/brand/BrandLogo';
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
    <main className="login-shell">
      <section className="login-panel" aria-label="Đăng nhập IC Platform">
        <div className="login-brand-row">
          <BrandLogo size="md" theme="light" />
        </div>

        <div className="login-copy">
          <p className="login-kicker">Internal Communications Hub</p>
          <h1>Đăng nhập</h1>
          <p>
            Nhập email đã được cấp quyền trong Google Sheets để vào workspace của team EX.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-field">
            <span>Email công việc</span>
            <input
              type="email"
              placeholder="Nhập email được cấp quyền"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="off"
              autoFocus
              required
              className="form-control"
            />
          </label>

          <button type="submit" disabled={loading || !email.trim()} className="login-submit">
            {loading ? 'Đang xác thực...' : 'Tiếp tục'}
          </button>
        </form>

        <p className="login-helper">
          Quyền truy cập được kiểm tra qua tab <strong>Users</strong> trong Google Sheets.
        </p>
      </section>
    </main>
  );
}
