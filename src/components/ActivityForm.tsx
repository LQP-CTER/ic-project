import React, { useState } from 'react';
import { Input, Select, Textarea } from './ui/Input';
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Tên hoạt động *" name="name" value={formData.name} onChange={handleChange} required />

      <Select label="Dự án *" name="projectId" value={formData.projectId} onChange={handleChange} required>
        {projects.length === 0
          ? <option value="">Chưa có dự án nào</option>
          : projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
        }
      </Select>

      <Textarea label="Mô tả" name="description" value={formData.description} onChange={handleChange} rows={2} />

      <div className="grid grid-cols-2 gap-4">
        <Input label="Người phụ trách" name="assignee" value={formData.assignee} onChange={handleChange} />
        <Input label="Kênh truyền thông" name="channel" value={formData.channel} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input type="date" label="Ngày bắt đầu" name="startDate" value={formData.startDate} onChange={handleChange} />
        <Input type="date" label="Deadline" name="deadline" value={formData.deadline} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label="Mức độ ưu tiên" name="priority" value={formData.priority} onChange={handleChange}>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </Select>
        <Select label="Trạng thái" name="status" value={formData.status} onChange={handleChange}>
          <option value="Chưa bắt đầu">Chưa bắt đầu</option>
          <option value="Đang thực hiện">Đang thực hiện</option>
          <option value="Chờ duyệt">Chờ duyệt</option>
          <option value="Hoàn thành">Hoàn thành</option>
        </Select>
      </div>

      <Input label="Tài liệu đính kèm" name="attachmentLink" value={formData.attachmentLink} onChange={handleChange} placeholder="https://..." />

      <Textarea label="Ghi chú" name="notes" value={formData.notes} onChange={handleChange} rows={2} />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button>
        <Button type="submit">{isEditing ? 'Cập nhật' : 'Tạo mới'}</Button>
      </div>
    </form>
  );
}
