import React, { useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { type Activity, type Status } from '../data/mockData';
import { useData } from '../context/DataContext';

interface ActivityFormProps {
  initialData?: Activity;
  onSubmit: (activity: Omit<Activity, 'id'>) => void;
  onCancel: () => void;
}

export function ActivityForm({ initialData, onSubmit, onCancel }: ActivityFormProps) {
  const { projects } = useData();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    projectId: initialData?.projectId ?? (projects.length > 0 ? projects[0].id : ''),
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    assignee: initialData?.assignee ?? '',
    startDate: initialData?.startDate ?? '',
    deadline: initialData?.deadline ?? '',
    priority: (initialData?.priority ?? 'Medium') as 'High' | 'Medium' | 'Low',
    status: (initialData?.status ?? 'Chưa bắt đầu') as Status,
    channel: initialData?.channel ?? '',
    attachmentLink: initialData?.attachmentLink ?? '',
    notes: initialData?.notes ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (!formData.projectId) {
      alert('Vui lòng tạo ít nhất một dự án trước khi tạo hoạt động.');
      return;
    }
    onSubmit(formData);
  };

  const col2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* Tên hoạt động */}
      <Input label="Tên hoạt động *" name="name" value={formData.name} onChange={handleChange} required />

      {/* Dự án */}
      <div className="input-group">
        <label className="input-label">Dự án *</label>
        <select name="projectId" value={formData.projectId} onChange={handleChange} className="input-field" required>
          {projects.length === 0
            ? <option value="">— Chưa có dự án nào —</option>
            : projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
          }
        </select>
      </div>

      {/* Mô tả */}
      <div className="input-group">
        <label className="input-label">Mô tả</label>
        <textarea name="description" value={formData.description} onChange={handleChange}
          className="input-field" rows={2} style={{ resize: 'vertical' }} />
      </div>

      {/* Người phụ trách + Kênh */}
      <div style={col2}>
        <Input label="Người phụ trách" name="assignee" value={formData.assignee} onChange={handleChange} />
        <Input label="Kênh truyền thông" name="channel" value={formData.channel} onChange={handleChange} />
      </div>

      {/* Ngày bắt đầu + Deadline */}
      <div style={col2}>
        <Input type="date" label="Ngày bắt đầu" name="startDate" value={formData.startDate} onChange={handleChange} />
        <Input type="date" label="Deadline" name="deadline" value={formData.deadline} onChange={handleChange} />
      </div>

      {/* Priority + Trạng thái */}
      <div style={col2}>
        <div className="input-group">
          <label className="input-label">Mức độ ưu tiên</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="High">🔴 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Trạng thái</label>
          <select name="status" value={formData.status} onChange={handleChange} className="input-field">
            <option value="Chưa bắt đầu">Chưa bắt đầu</option>
            <option value="Đang thực hiện">Đang thực hiện</option>
            <option value="Chờ duyệt">Chờ duyệt</option>
            <option value="Hoàn thành">Hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Tài liệu đính kèm */}
      <Input label="Tài liệu đính kèm (tùy chọn)" name="attachmentLink"
        value={formData.attachmentLink} onChange={handleChange}
        placeholder="https://docs.google.com/... hoặc https://figma.com/..." />

      {/* Ghi chú */}
      <div className="input-group">
        <label className="input-label">Ghi chú</label>
        <textarea name="notes" value={formData.notes} onChange={handleChange}
          className="input-field" rows={2} style={{ resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
        <Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button>
        <Button type="submit" variant="primary">{isEditing ? 'Cập nhật' : 'Tạo mới'}</Button>
      </div>
    </form>
  );
}
