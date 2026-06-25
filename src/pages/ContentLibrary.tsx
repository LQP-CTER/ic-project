import { useMemo, useState, type FormEvent } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { type Content } from '../data/mockData';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'GTalk', 'Email', 'Poster', 'Reminder', 'Communication Plan', 'Survey', 'Town Hall', 'Khác'];
const CONTENT_TYPES = CATEGORIES.filter(category => category !== 'All');
const CONTENT_STATUSES = ['Draft', 'In review', 'Approved', 'Published', 'Archived'] as const;

type ContentFormState = Omit<Content, 'id' | 'createdAt'>;

const emptyForm: ContentFormState = {
  title: '',
  contentType: 'GTalk',
  projectId: '',
  projectName: '',
  activityId: '',
  activityName: '',
  prompt: '',
  content: '',
  status: 'Draft',
  approver: '',
  reviewNotes: '',
  publishedAt: '',
};

function formatDate(value: string) {
  if (!value) return 'Chưa có ngày';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có ngày';
  return date.toLocaleDateString('vi-VN');
}

function getInitial(contentType?: string) {
  return (contentType || 'C').charAt(0).toUpperCase();
}

function getContentStatus(content: Content) {
  return content.status || 'Draft';
}

function getContentStatusClass(status?: string) {
  const value = status || 'Draft';
  if (value === 'Published') return 'content-status-pill content-status-published';
  if (value === 'Approved') return 'content-status-pill content-status-approved';
  if (value === 'In review') return 'content-status-pill content-status-review';
  if (value === 'Archived') return 'content-status-pill content-status-archived';
  return 'content-status-pill content-status-draft';
}

export function ContentLibrary() {
  const { contents, projects, activities, addContent, updateContent, deleteContent } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewContent, setViewContent] = useState<Content | null>(null);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ContentFormState>(emptyForm);

  const filteredContents = useMemo(() => {
    return contents.filter(c => {
      const searchTarget = `${c.title} ${c.projectName} ${c.activityName} ${c.contentType} ${c.content}`.toLowerCase();
      const matchesSearch = searchTarget.includes(searchTerm.toLowerCase().trim());
      const matchesType = filterType === 'All' || (c.contentType || '').toLowerCase().includes(filterType.toLowerCase());
      return matchesSearch && matchesType;
    });
  }, [contents, filterType, searchTerm]);

  const filteredActivities = useMemo(() => {
    if (!form.projectId) return [];
    return activities.filter(activity => activity.projectId === form.projectId);
  }, [activities, form.projectId]);

  const contentTypeCounts = useMemo(() => {
    return contents.reduce<Record<string, number>>((acc, item) => {
      const key = item.contentType || 'Khác';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [contents]);

  const openCreateForm = () => {
    setEditingContent(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (content: Content) => {
    setViewContent(null);
    setEditingContent(content);
    setForm({
      title: content.title || '',
      contentType: content.contentType || 'Khác',
      projectId: content.projectId || '',
      projectName: content.projectName || '',
      activityId: content.activityId || '',
      activityName: content.activityName || '',
      prompt: content.prompt || '',
      content: content.content || '',
      status: content.status || 'Draft',
      approver: content.approver || '',
      reviewNotes: content.reviewNotes || '',
      publishedAt: content.publishedAt || '',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingContent(null);
    setForm(emptyForm);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Đã sao chép');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Không thể sao chép nội dung');
    }
  };

  const handleDelete = async (content: Content) => {
    const confirmed = window.confirm(`Xóa nội dung "${content.title}"?`);
    if (!confirmed) return;

    try {
      await deleteContent(content.id);
      if (viewContent?.id === content.id) setViewContent(null);
      toast.success('Đã xóa nội dung');
    } catch {
      // DataContext already shows the user-facing error and rolls back optimistic state.
    }
  };

  const handleProjectChange = (projectId: string) => {
    const selectedProject = projects.find(project => project.id === projectId);
    setForm(prev => ({
      ...prev,
      projectId,
      projectName: selectedProject?.name || '',
      activityId: '',
      activityName: '',
    }));
  };

  const handleActivityChange = (activityId: string) => {
    const selectedActivity = activities.find(activity => activity.id === activityId);
    setForm(prev => ({
      ...prev,
      activityId,
      activityName: selectedActivity?.name || '',
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload: ContentFormState = {
      ...form,
      title: form.title.trim(),
      contentType: form.contentType.trim() || 'Khác',
      projectName: form.projectName.trim(),
      activityName: form.activityName.trim(),
      prompt: form.prompt.trim(),
      content: form.content.trim(),
      status: form.status || 'Draft',
      approver: form.approver?.trim() || '',
      reviewNotes: form.reviewNotes?.trim() || '',
      publishedAt: form.publishedAt || '',
    };

    if (!payload.title) {
      toast.error('Vui lòng nhập tiêu đề nội dung');
      return;
    }
    if (!payload.content) {
      toast.error('Vui lòng nhập nội dung');
      return;
    }

    setIsSaving(true);
    try {
      if (editingContent) {
        await updateContent(editingContent.id, payload);
        toast.success('Đã cập nhật nội dung');
      } else {
        await addContent({ ...payload, createdAt: new Date().toISOString() });
        toast.success('Đã thêm nội dung vào thư viện');
      }
      closeForm();
    } catch {
      // DataContext already shows the user-facing error and rolls back optimistic state.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-shell flex flex-col gap-6 h-full min-h-0">
      <div className="page-header">
        <div>
          <p className="eyebrow">Content library</p>
          <h1 className="page-title">Thư viện nội dung</h1>
          <p className="page-subtitle">Quản lý, chỉnh sửa và tái sử dụng nội dung truyền thông đã tạo bởi AI hoặc nhập thủ công.</p>
        </div>
        <div className="library-header-actions">
          <Button variant="secondary" onClick={() => navigate('/ai-assistant')}>Tạo bằng AI</Button>
          <Button onClick={openCreateForm}>Thêm nội dung</Button>
        </div>
      </div>

      <div className="library-stats-grid">
        <Card className="library-stat-card">
          <span>Tổng nội dung</span>
          <strong>{contents.length}</strong>
          <p>Tài sản truyền thông đã lưu</p>
        </Card>
        <Card className="library-stat-card">
          <span>Loại phổ biến</span>
          <strong>{Object.entries(contentTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'}</strong>
          <p>Dựa trên nội dung hiện có</p>
        </Card>
        <Card className="library-stat-card">
          <span>Kết quả lọc</span>
          <strong>{filteredContents.length}</strong>
          <p>Nội dung khớp bộ lọc hiện tại</p>
        </Card>
      </div>

      <div className="library-toolbar">
        <div className="library-filter-row">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilterType(cat)}
              className={`chip ${filterType === cat ? 'chip-active' : ''}`}>
              {cat}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Tìm theo tiêu đề, dự án, loại hoặc nội dung..."
          className="form-control library-search-input"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto pb-4 min-h-0">
        {contents.length === 0 ? (
          <div className="empty-state">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Chưa có nội dung nào</h3>
            <p className="text-sm text-text-secondary mb-6 max-w-xs">Bạn có thể tạo bằng AI Assistant hoặc thêm thủ công nội dung đã có.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button variant="secondary" onClick={() => navigate('/ai-assistant')}>Tạo bằng AI</Button>
              <Button onClick={openCreateForm}>Thêm thủ công</Button>
            </div>
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="empty-state">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Không tìm thấy nội dung</h3>
            <p className="text-sm text-text-secondary">Thử đổi từ khóa, loại nội dung hoặc thêm một nội dung mới.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredContents.map(content => (
              <div key={content.id} className="content-card professional-card rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-md">
                <div className="content-card-head">
                  <div className="content-letter">
                    <span>{getInitial(content.contentType)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3>{content.title}</h3>
                    <div className="content-meta-line">
                      <span className="truncate max-w-[130px]">{content.projectName || 'Nội dung độc lập'}</span>
                      <span>/</span>
                      <span>{formatDate(content.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="content-preview-box">
                  <div className="whitespace-pre-wrap line-clamp-4">{content.content}</div>
                  <div className="content-preview-fade" />
                </div>

                <div className="flex items-center justify-between gap-3 mt-auto">
                  <div className="content-pill-stack">
                    <span className="content-type-pill">{content.contentType || 'Khác'}</span>
                    <span className={getContentStatusClass(content.status)}>{getContentStatus(content)}</span>
                  </div>
                  <div className="content-actions">
                    <Button variant="secondary" size="sm" onClick={() => setViewContent(content)}>Xem</Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditForm(content)}>Sửa</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(content.id, content.content)}>
                      {copiedId === content.id ? 'Đã chép' : 'Copy'}
                    </Button>
                    <button onClick={() => handleDelete(content)} className="content-delete-button">Xóa</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!viewContent} onClose={() => setViewContent(null)} title={viewContent?.title || 'Chi tiết nội dung'} maxWidth="max-w-2xl">
        {viewContent && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 flex-wrap">
              <span className="content-type-pill">{viewContent.contentType || 'Khác'}</span>
              <span className={getContentStatusClass(viewContent.status)}>{getContentStatus(viewContent)}</span>
              <span className="text-xs text-text-secondary py-1">{viewContent.projectName || 'Nội dung độc lập'}</span>
              {viewContent.activityName && <span className="text-xs text-text-secondary py-1">/ {viewContent.activityName}</span>}
              <span className="text-xs text-text-tertiary py-1">/ {formatDate(viewContent.createdAt)}</span>
            </div>
            {(viewContent.approver || viewContent.publishedAt || viewContent.reviewNotes) && (
              <div className="library-review-box">
                {viewContent.approver && <p><strong>Người duyệt:</strong> {viewContent.approver}</p>}
                {viewContent.publishedAt && <p><strong>Ngày publish:</strong> {formatDate(viewContent.publishedAt)}</p>}
                {viewContent.reviewNotes && <p><strong>Ghi chú review:</strong> {viewContent.reviewNotes}</p>}
              </div>
            )}
            {viewContent.prompt && (
              <div className="library-prompt-box">
                <strong>Prompt gốc</strong>
                <p>{viewContent.prompt}</p>
              </div>
            )}
            <div className="bg-surface-secondary border border-border rounded-xl p-4 text-sm text-text-primary leading-relaxed max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
              {viewContent.content}
            </div>
            <div className="flex justify-end gap-3 pt-2 flex-wrap">
              <Button variant="ghost" onClick={() => setViewContent(null)}>Đóng</Button>
              <Button variant="secondary" onClick={() => openEditForm(viewContent)}>Sửa nội dung</Button>
              <Button onClick={() => handleCopy(viewContent.id, viewContent.content)}>
                {copiedId === viewContent.id ? 'Đã copy' : 'Copy nội dung'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isFormOpen} onClose={closeForm} title={editingContent ? 'Chỉnh sửa nội dung' : 'Thêm nội dung'} maxWidth="max-w-3xl">
        <form onSubmit={handleSubmit} className="library-content-form">
          <div className="library-form-grid">
            <Input
              label="Tiêu đề *"
              value={form.title}
              onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))}
              placeholder="VD: GTalk reminder hoàn thành báo cáo"
            />
            <Select
              label="Loại nội dung"
              value={form.contentType}
              onChange={event => setForm(prev => ({ ...prev, contentType: event.target.value }))}
            >
              {CONTENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </Select>
          </div>

          <div className="library-form-grid">
            <Select label="Dự án liên quan" value={form.projectId} onChange={event => handleProjectChange(event.target.value)}>
              <option value="">Không gắn dự án</option>
              {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
            </Select>
            <Select label="Hoạt động liên quan" value={form.activityId} onChange={event => handleActivityChange(event.target.value)} disabled={!form.projectId}>
              <option value="">Không gắn hoạt động</option>
              {filteredActivities.map(activity => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
            </Select>
          </div>

          <div className="form-section-card compact">
            <div className="form-section-head">
              <p className="eyebrow">Lifecycle</p>
              <h3>Trạng thái nội dung</h3>
            </div>
            <div className="library-form-grid">
              <Select label="Lifecycle status" value={form.status || 'Draft'} onChange={event => setForm(prev => ({ ...prev, status: event.target.value as Content['status'] }))}>
                {CONTENT_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
              </Select>
              <Input label="Người duyệt" value={form.approver || ''} onChange={event => setForm(prev => ({ ...prev, approver: event.target.value }))} placeholder="IC Lead, HR Lead..." />
            </div>
            <Input type="date" label="Ngày publish" value={form.publishedAt || ''} onChange={event => setForm(prev => ({ ...prev, publishedAt: event.target.value }))} />
            <Textarea label="Ghi chú review" value={form.reviewNotes || ''} onChange={event => setForm(prev => ({ ...prev, reviewNotes: event.target.value }))} rows={2} />
          </div>

          <Textarea
            label="Prompt / yêu cầu gốc"
            value={form.prompt}
            onChange={event => setForm(prev => ({ ...prev, prompt: event.target.value }))}
            placeholder="Ghi lại brief hoặc prompt để sau này tái sử dụng..."
            className="min-h-[90px]"
          />
          <Textarea
            label="Nội dung *"
            value={form.content}
            onChange={event => setForm(prev => ({ ...prev, content: event.target.value }))}
            placeholder="Dán hoặc viết nội dung truyền thông tại đây..."
            className="min-h-[220px]"
          />

          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={closeForm} disabled={isSaving}>Hủy</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu nội dung'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


