import React, { useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { type Project, type Status } from '../data/mockData';

interface ProjectFormProps {
  initialData?: Project;
  onSubmit: (project: Omit<Project, 'id'>) => void;
  onCancel: () => void;
}

export function ProjectForm({ initialData, onSubmit, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    assignee: initialData?.assignee || '',
    startDate: initialData?.startDate || '',
    deadline: initialData?.deadline || '',
    status: (initialData?.status || 'Chưa bắt đầu') as Status,
    notes: initialData?.notes || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex-col gap-4">
      <Input label="Tên dự án" name="name" value={formData.name} onChange={handleChange} required />
      
      <div className="input-group">
        <label className="input-label">Mô tả</label>
        <textarea 
          name="description" 
          value={formData.description} 
          onChange={handleChange}
          className="input-field" 
          rows={3} 
        />
      </div>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Input label="Người phụ trách" name="assignee" value={formData.assignee} onChange={handleChange} />
        <div className="input-group">
          <label className="input-label">Trạng thái</label>
          <select name="status" value={formData.status} onChange={handleChange} className="input-field">
            <option value="Chưa bắt đầu">Chưa bắt đầu</option>
            <option value="Đang thực hiện">Đang thực hiện</option>
            <option value="Chờ duyệt">Chờ duyệt</option>
            <option value="Tạm dừng">Tạm dừng</option>
            <option value="Hoàn thành">Hoàn thành</option>
            <option value="Kết thúc">Kết thúc</option>
          </select>
        </div>
      </div>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Input type="date" label="Ngày bắt đầu" name="startDate" value={formData.startDate} onChange={handleChange} />
        <Input type="date" label="Deadline" name="deadline" value={formData.deadline} onChange={handleChange} />
      </div>

      <div className="input-group">
        <label className="input-label">Ghi chú</label>
        <textarea 
          name="notes" 
          value={formData.notes} 
          onChange={handleChange}
          className="input-field" 
          rows={2} 
        />
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button>
        <Button type="submit" variant="primary">{initialData ? 'Cập nhật' : 'Tạo mới'}</Button>
      </div>
    </form>
  );
}
