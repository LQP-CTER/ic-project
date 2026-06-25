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
    <div className="login-shell">
      <div className="login-aura login-aura-one" />
      <div className="login-aura login-aura-two" />

      <div className="login-card-wrap">
        <section className="login-hero-panel">
          <BrandLogo size="lg" theme="dark" />
          <div>
            <p className="login-hero-kicker">Internal Communications Hub</p>
            <h1 className="login-hero-title">Một workspace hiện đại cho toàn bộ hoạt động IC.</h1>
            <p className="login-hero-text">Quản lý dự án, deadline, nội dung AI và thư viện truyền thông trên một hệ thống gọn gàng, đồng bộ bằng Google Sheets.</p>
          </div>
          <div className="login-feature-grid">
            {['Project command', 'AI content studio', 'Workflow templates'].map(item => (
              <div key={item} className="login-feature-card">
                <span>{item}</span>
                <small>Ready</small>
              </div>
            ))}
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-form-header">
            <BrandLogo size="md" theme="light" />
            <p className="eyebrow">Secure access</p>
            <h2 className="login-form-title">Đăng nhập</h2>
            <p className="login-form-subtitle">Sử dụng email đã được cấp quyền trong Google Sheet để truy cập IC Platform.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label className="login-field">
              <span>Email công việc</span>
              <input
                type="email"
                placeholder="phatlq@ghn.vn"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="form-control"
              />
            </label>
            <button type="submit" disabled={loading || !email.trim()} className="login-submit">
              {loading ? 'Đang xác thực...' : 'Tiếp tục'}
            </button>
          </form>

          <div className="login-note">
            <strong>Quyền truy cập được kiểm tra qua Google Sheets.</strong>
            <span>Nếu không đăng nhập được, hãy thêm email vào tab Users.</span>
          </div>
        </section>
      </div>
    </div>
  );
}