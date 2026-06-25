import { useMemo, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import type { UserRecord } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

type UserFormState = Omit<UserRecord, 'id'>;

const emptyForm: UserFormState = {
  email: '',
  name: '',
  role: 'member',
};

function normalizeEmail(value: string) {
  return value.toLowerCase().trim();
}

function roleLabel(role: string) {
  return role === 'admin' ? 'Admin' : 'Member';
}

function roleDescription(role: string) {
  return role === 'admin'
    ? 'Toàn quyền quản trị dữ liệu, dự án và người dùng.'
    : 'Có thể đăng nhập, xem dữ liệu và sử dụng workspace.';
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const { users, addUser, updateUser, deleteUser } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const currentEmail = normalizeEmail(currentUser?.email || '');

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.toLowerCase().trim();
    if (!keyword) return users;
    return users.filter(user => {
      const text = `${user.name} ${user.email} ${user.role}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [searchTerm, users]);

  const adminCount = users.filter(user => user.role === 'admin').length;
  const memberCount = users.length - adminCount;

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (targetUser: UserRecord) => {
    setEditingUser(targetUser);
    setForm({
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextUser: UserFormState = {
      email: normalizeEmail(form.email),
      name: form.name.trim(),
      role: form.role,
    };

    if (!nextUser.email) {
      toast.error('Vui lòng nhập email người dùng');
      return;
    }
    if (!nextUser.email.includes('@')) {
      toast.error('Email chưa đúng định dạng');
      return;
    }
    if (!nextUser.name) {
      toast.error('Vui lòng nhập tên hiển thị');
      return;
    }

    setIsSaving(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, nextUser);
        toast.success('Đã cập nhật người dùng');
      } else {
        await addUser(nextUser);
        toast.success('Đã thêm người dùng');
      }
      closeModal();
    } catch {
      // DataContext already shows the user-facing error and rolls back optimistic state.
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (targetUser: UserRecord) => {
    if (normalizeEmail(targetUser.email) === currentEmail) {
      toast.error('Bạn không thể xóa chính tài khoản đang đăng nhập');
      return;
    }

    const confirmed = window.confirm(`Xóa quyền truy cập của ${targetUser.name}?`);
    if (!confirmed) return;

    try {
      await deleteUser(targetUser.id);
      toast.success('Đã xóa người dùng');
    } catch {
      // DataContext already shows the user-facing error and rolls back optimistic state.
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <p className="page-subtitle !mt-0">Khu vực này chỉ dành cho admin để bảo vệ quyền truy cập workspace.</p>
        </div>
        <Card className="access-denied-card">
          <p className="eyebrow">Không đủ quyền</p>
          <h2>Bạn đang đăng nhập với vai trò {roleLabel(currentUser?.role || 'member')}</h2>
          <p>Vui lòng liên hệ admin nếu bạn cần thêm, sửa hoặc xóa người dùng trong hệ thống.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <p className="page-subtitle !mt-0">Thêm, chỉnh sửa và thu hồi quyền truy cập mà không cần mở Google Sheet thủ công.</p>
        <Button onClick={openCreateModal}>Thêm người dùng</Button>
      </div>

      <div className="user-metrics-grid">
        <Card className="user-metric-card">
          <span>Tổng người dùng</span>
          <strong>{users.length}</strong>
          <p>Tài khoản có quyền đăng nhập</p>
        </Card>
        <Card className="user-metric-card">
          <span>Admin</span>
          <strong>{adminCount}</strong>
          <p>Toàn quyền quản trị hệ thống</p>
        </Card>
        <Card className="user-metric-card">
          <span>Member</span>
          <strong>{memberCount}</strong>
          <p>Người dùng vận hành workspace</p>
        </Card>
      </div>

      <Card className="user-directory-card">
        <div className="user-directory-toolbar">
          <div>
            <p className="eyebrow">Directory</p>
            <h2>Danh sách truy cập</h2>
          </div>
          <input
            type="search"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên, email hoặc role..."
            className="form-control user-search-input"
          />
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <h3>Không tìm thấy người dùng</h3>
            <p>Thử đổi từ khóa hoặc thêm người dùng mới cho workspace.</p>
          </div>
        ) : (
          <div className="table-wrap user-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Vai trò</th>
                  <th>Mô tả quyền</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(targetUser => {
                  const isCurrentUser = normalizeEmail(targetUser.email) === currentEmail;
                  return (
                    <tr key={targetUser.id || targetUser.email}>
                      <td>
                        <div className="user-cell">
                          <span className="user-avatar-text">{targetUser.name.charAt(0).toUpperCase()}</span>
                          <div>
                            <strong>{targetUser.name}</strong>
                            <p>{targetUser.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-pill ${targetUser.role === 'admin' ? 'role-pill-admin' : 'role-pill-member'}`}>
                          {roleLabel(targetUser.role)}
                        </span>
                      </td>
                      <td>{roleDescription(targetUser.role)}</td>
                      <td>
                        <div className="user-actions">
                          <Button size="sm" variant="secondary" onClick={() => openEditModal(targetUser)}>Sửa</Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(targetUser)}
                            disabled={isCurrentUser}
                            title={isCurrentUser ? 'Không thể xóa tài khoản đang đăng nhập' : 'Xóa người dùng'}
                          >
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="user-form">
          <Input
            label="Email đăng nhập"
            type="email"
            value={form.email}
            onChange={event => setForm(prev => ({ ...prev, email: event.target.value }))}
            placeholder="name@company.vn"
          />
          <Input
            label="Tên hiển thị"
            value={form.name}
            onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
            placeholder="Nguyễn Văn A"
          />
          <Select
            label="Vai trò"
            value={form.role}
            onChange={event => setForm(prev => ({ ...prev, role: event.target.value as UserFormState['role'] }))}
          >
            <option value="member">Member — dùng workspace</option>
            <option value="admin">Admin — quản trị toàn hệ thống</option>
          </Select>

          <div className="user-form-note">
            <strong>Lưu ý:</strong> Người dùng mới sẽ đăng nhập được ngay sau khi dữ liệu đồng bộ lên sheet Users.
          </div>

          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={isSaving}>Hủy</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu người dùng'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


