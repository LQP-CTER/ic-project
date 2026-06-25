import React, { useState } from 'react';
import { Input, Select, Textarea } from './ui/Input';
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Tên dự án" name="name" value={formData.name} onChange={handleChange} required />

      <Textarea label="Mô tả" name="description" value={formData.description} onChange={handleChange} rows={3} />

      <div className="grid grid-cols-2 gap-4">
        <Input label="Người phụ trách" name="assignee" value={formData.assignee} onChange={handleChange} />
        <Select label="Trạng thái" name="status" value={formData.status} onChange={handleChange}>
          <option value="Chưa bắt đầu">Chưa bắt đầu</option>
          <option value="Đang thực hiện">Đang thực hiện</option>
          <option value="Chờ duyệt">Chờ duyệt</option>
          <option value="Tạm dừng">Tạm dừng</option>
          <option value="Hoàn thành">Hoàn thành</option>
          <option value="Kết thúc">Kết thúc</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input type="date" label="Ngày bắt đầu" name="startDate" value={formData.startDate} onChange={handleChange} />
        <Input type="date" label="Deadline" name="deadline" value={formData.deadline} onChange={handleChange} />
      </div>

      <Textarea label="Ghi chú" name="notes" value={formData.notes} onChange={handleChange} rows={2} />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button>
        <Button type="submit">{initialData ? 'Cập nhật' : 'Tạo mới'}</Button>
      </div>
    </form>
  );
}
