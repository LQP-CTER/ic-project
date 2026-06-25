import { useMemo, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import type { StyleReference } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

type StyleReferenceForm = Omit<StyleReference, 'id'>;

const emptyForm: StyleReferenceForm = {
  title: '',
  channel: 'GTalk',
  purpose: 'Announcement',
  tone: '',
  content: '',
  isActive: true,
  createdAt: new Date().toISOString(),
};

function getPreview(content: string) {
  return content.replace(/\s+/g, ' ').trim().slice(0, 180);
}

export function TeamVoicePage() {
  const { styleReferences, addStyleReference, updateStyleReference, deleteStyleReference } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReference, setEditingReference] = useState<StyleReference | null>(null);
  const [form, setForm] = useState<StyleReferenceForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const activeCount = styleReferences.filter(reference => reference.isActive).length;
  const channels = Array.from(new Set(styleReferences.map(reference => reference.channel).filter(Boolean)));

  const filteredReferences = useMemo(() => {
    const keyword = searchTerm.toLowerCase().trim();
    if (!keyword) return styleReferences;
    return styleReferences.filter(reference => {
      const text = `${reference.title} ${reference.channel} ${reference.purpose} ${reference.tone} ${reference.content}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [searchTerm, styleReferences]);

  const openCreateModal = () => {
    setEditingReference(null);
    setForm({ ...emptyForm, createdAt: new Date().toISOString() });
    setIsModalOpen(true);
  };

  const openEditModal = (reference: StyleReference) => {
    setEditingReference(reference);
    setForm({
      title: reference.title,
      channel: reference.channel,
      purpose: reference.purpose,
      tone: reference.tone,
      content: reference.content,
      isActive: reference.isActive,
      createdAt: reference.createdAt,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingReference(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextReference: StyleReferenceForm = {
      ...form,
      title: form.title.trim(),
      channel: form.channel.trim() || 'GTalk',
      purpose: form.purpose.trim() || 'General',
      tone: form.tone.trim(),
      content: form.content.trim(),
      createdAt: form.createdAt || new Date().toISOString(),
    };

    if (!nextReference.title) {
      toast.error('Vui lòng nhập tên bài mẫu');
      return;
    }
    if (!nextReference.content) {
      toast.error('Vui lòng dán nội dung bài mẫu');
      return;
    }

    setIsSaving(true);
    try {
      if (editingReference) {
        await updateStyleReference(editingReference.id, nextReference);
        toast.success('Đã cập nhật bài mẫu');
      } else {
        await addStyleReference(nextReference);
        toast.success('Đã thêm bài mẫu Team Voice');
      }
      closeModal();
    } catch {
      // DataContext already shows the user-facing error and rolls back optimistic state.
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (reference: StyleReference) => {
    const confirmed = window.confirm(`Xóa bài mẫu "${reference.title}"?`);
    if (!confirmed) return;
    try {
      await deleteStyleReference(reference.id);
      toast.success('Đã xóa bài mẫu');
    } catch {
      // DataContext already shows the user-facing error and rolls back optimistic state.
    }
  };

  const toggleActive = async (reference: StyleReference) => {
    try {
      await updateStyleReference(reference.id, { isActive: !reference.isActive });
      toast.success(reference.isActive ? 'Đã tắt bài mẫu khỏi AI context' : 'Đã bật bài mẫu cho AI context');
    } catch {
      // DataContext already shows the user-facing error and rolls back optimistic state.
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">AI memory</p>
          <h1 className="page-title">Team Voice</h1>
          <p className="page-subtitle">Lưu các bài truyền thông đã được duyệt để AI học giọng viết, cấu trúc CTA và cách xưng hô của team.</p>
        </div>
        <Button onClick={openCreateModal}>Thêm bài mẫu</Button>
      </div>

      <div className="user-metrics-grid">
        <Card className="user-metric-card">
          <span>Tổng bài mẫu</span>
          <strong>{styleReferences.length}</strong>
          <p>Dữ liệu style trong workspace</p>
        </Card>
        <Card className="user-metric-card">
          <span>Đang dùng cho AI</span>
          <strong>{activeCount}</strong>
          <p>Bài active được đưa vào prompt</p>
        </Card>
        <Card className="user-metric-card">
          <span>Kênh</span>
          <strong>{channels.length}</strong>
          <p>GTalk, Email, Poster...</p>
        </Card>
      </div>

      <Card className="user-directory-card">
        <div className="user-directory-toolbar">
          <div>
            <p className="eyebrow">References</p>
            <h2>Kho bài mẫu</h2>
          </div>
          <input
            type="search"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tiêu đề, kênh, mục đích, tone..."
            className="form-control user-search-input"
          />
        </div>

        {filteredReferences.length === 0 ? (
          <div className="empty-state">
            <h3>Chưa có bài mẫu phù hợp</h3>
            <p>Thêm các bài đã gửi thật để AI có cơ sở học style của team.</p>
          </div>
        ) : (
          <div className="team-voice-grid">
            {filteredReferences.map(reference => (
              <article key={reference.id} className="team-voice-card">
                <div className="team-voice-card-head">
                  <div>
                    <span className={reference.isActive ? 'role-pill role-pill-admin' : 'role-pill role-pill-member'}>
                      {reference.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <h3>{reference.title}</h3>
                  </div>
                  <button onClick={() => toggleActive(reference)}>{reference.isActive ? 'Tắt' : 'Bật'}</button>
                </div>
                <div className="team-voice-meta">
                  <span>{reference.channel}</span>
                  <span>{reference.purpose}</span>
                  {reference.tone && <span>{reference.tone}</span>}
                </div>
                <p className="team-voice-preview">{getPreview(reference.content)}...</p>
                <div className="team-voice-actions">
                  <Button size="sm" variant="secondary" onClick={() => openEditModal(reference)}>Sửa</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(reference)}>Xóa</Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingReference ? 'Chỉnh sửa bài mẫu' : 'Thêm bài mẫu Team Voice'} maxWidth="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Tên bài mẫu *" value={form.title} onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))} placeholder="VD: GTalk Mail - Reminder chuyển đổi" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Kênh" value={form.channel} onChange={event => setForm(prev => ({ ...prev, channel: event.target.value }))}>
              <option value="GTalk">GTalk</option>
              <option value="Email">Email</option>
              <option value="Poster">Poster</option>
              <option value="Slack/Teams">Slack/Teams</option>
              <option value="Internal">Internal</option>
            </Select>
            <Input label="Mục đích" value={form.purpose} onChange={event => setForm(prev => ({ ...prev, purpose: event.target.value }))} placeholder="Reminder / Launch / Recap" />
            <Select label="Dùng cho AI" value={form.isActive ? 'true' : 'false'} onChange={event => setForm(prev => ({ ...prev, isActive: event.target.value === 'true' }))}>
              <option value="true">Có</option>
              <option value="false">Tạm tắt</option>
            </Select>
          </div>
          <Input label="Tone / ghi chú style" value={form.tone} onChange={event => setForm(prev => ({ ...prev, tone: event.target.value }))} placeholder="VD: chuyên nghiệp, gần gũi, rõ CTA" />
          <Textarea label="Nội dung bài mẫu *" value={form.content} onChange={event => setForm(prev => ({ ...prev, content: event.target.value }))} rows={14} placeholder="Dán bài truyền thông đã được duyệt/gửi thật vào đây..." />
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 leading-relaxed">
            AI chỉ dùng bài này để học style. Prompt đã chặn việc copy nguyên văn và chặn dùng lại thông tin riêng nếu yêu cầu hiện tại không cung cấp.
          </div>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={isSaving}>Hủy</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu bài mẫu'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}