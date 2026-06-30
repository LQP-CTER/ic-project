import { useState } from 'react';
import { BrandLogo } from '../components/brand/BrandLogo';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const loginHighlights = [
  'Quản lý project, hoạt động và deadline IC',
  'Tạo nội dung bằng AI theo Team Voice',
  'Đồng bộ dữ liệu qua Google Sheets',
];

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
      <div className="login-ambient" aria-hidden="true">
        <span className="login-orb login-orb-one" />
        <span className="login-orb login-orb-two" />
        <span className="login-orb login-orb-three" />
      </div>

      <section className="login-hero" aria-label="Đăng nhập IC Platform">
        <nav className="login-nav animate-on-load delay-100" aria-label="Login navigation">
          <BrandLogo size="md" theme="light" />
          <div className="login-nav-meta">
            <span>Product by EX Team</span>
            <strong>Secure workspace</strong>
          </div>
        </nav>

        <div className="login-content">
          <div className="login-intro">
            <div className="login-version-pill animate-on-load delay-200">
              <span>IC Platform</span>
              <strong>Internal Communications Hub</strong>
            </div>

            <div className="login-copy animate-on-load delay-300">
              <p className="login-kicker">Workspace hiện đại cho team IC</p>
              <h1>Điều phối truyền thông nội bộ gọn hơn, nhanh hơn.</h1>
              <p>
                Một nơi để team EX quản lý dự án, pipeline hoạt động, nội dung AI,
                thư viện truyền thông và quyền truy cập — đồng bộ trực tiếp với Google Sheets.
              </p>
            </div>

            <div className="login-highlight-grid animate-on-load delay-400">
              {loginHighlights.map(item => (
                <div className="login-highlight-card" key={item}>
                  <span>{item}</span>
                  <small>Ready</small>
                </div>
              ))}
            </div>
          </div>

          <aside className="login-panel animate-on-load delay-500">
            <div className="login-panel-head">
              <BrandLogo size="sm" theme="light" />
              <span>Google Sheets access</span>
            </div>

            <div className="login-form-title">
              <p className="login-kicker">Secure access</p>
              <h2>Đăng nhập</h2>
              <p>Nhập email công việc đã được cấp quyền để truy cập IC Platform.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <label className="login-field">
                <span>Email công việc</span>
                <input
                  type="email"
                  placeholder="name@company.vn"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
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
          </aside>
        </div>
      </section>
    </main>
  );
}
