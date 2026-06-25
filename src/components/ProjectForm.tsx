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
  const [formData, setFormData] = useState<Omit<Project, 'id'>>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    assignee: initialData?.assignee || '',
    startDate: initialData?.startDate || '',
    deadline: initialData?.deadline || '',
    status: (initialData?.status || 'Chưa bắt đầu') as Status,
    notes: initialData?.notes || '',
    objective: initialData?.objective || '',
    audience: initialData?.audience || '',
    keyMessage: initialData?.keyMessage || '',
    cta: initialData?.cta || '',
    channels: initialData?.channels || '',
    toneOfVoice: initialData?.toneOfVoice || '',
    stakeholder: initialData?.stakeholder || '',
    successMetric: initialData?.successMetric || '',
    mandatoryInfo: initialData?.mandatoryInfo || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, name: formData.name.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="project-brief-form">
      <section className="form-section-card">
        <div className="form-section-head">
          <p className="eyebrow">Basic setup</p>
          <h3>Thông tin dự án</h3>
        </div>

        <Input label="Tên dự án *" name="name" value={formData.name} onChange={handleChange} required />
        <Textarea label="Mô tả ngắn" name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Tóm tắt chiến dịch hoặc bối cảnh yêu cầu..." />

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
      </section>

      <section className="form-section-card">
        <div className="form-section-head">
          <p className="eyebrow">Project brief</p>
          <h3>Brief truyền thông</h3>
          <span>Phần này giúp người làm truyền thông rõ mục tiêu, và giúp AI tạo nội dung sát bối cảnh hơn.</span>
        </div>

        <Textarea label="Mục tiêu truyền thông" name="objective" value={formData.objective} onChange={handleChange} rows={2} placeholder="VD: Tăng tỷ lệ tham gia khảo sát, giảm thắc mắc khi chuyển đổi hệ thống..." />
        <Input label="Đối tượng nhận thông tin" name="audience" value={formData.audience} onChange={handleChange} placeholder="VD: Toàn bộ nhân viên, quản lý cấp trung, khối vận hành..." />
        <Textarea label="Thông điệp chính" name="keyMessage" value={formData.keyMessage} onChange={handleChange} rows={2} placeholder="Một câu cốt lõi mà người đọc cần nhớ sau chiến dịch." />
        <Input label="CTA / Hành động mong muốn" name="cta" value={formData.cta} onChange={handleChange} placeholder="VD: Hoàn thành khảo sát trước 17h, đọc guideline, đăng ký tham gia..." />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Kênh dự kiến" name="channels" value={formData.channels} onChange={handleChange} placeholder="GTalk, Email, Offline poster..." />
          <Input label="Tone of voice" name="toneOfVoice" value={formData.toneOfVoice} onChange={handleChange} placeholder="Thân thiện, rõ ràng, chuyên nghiệp..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Stakeholder / Người duyệt" name="stakeholder" value={formData.stakeholder} onChange={handleChange} />
          <Input label="Success metric" name="successMetric" value={formData.successMetric} onChange={handleChange} placeholder="VD: 85% completion rate, 0 lỗi chuyển đổi..." />
        </div>

        <Textarea label="Thông tin bắt buộc / link / lưu ý" name="mandatoryInfo" value={formData.mandatoryInfo} onChange={handleChange} rows={3} placeholder="Những thông tin không được sai: link, deadline, tên chương trình, policy, FAQ..." />
      </section>

      <Textarea label="Ghi chú nội bộ" name="notes" value={formData.notes} onChange={handleChange} rows={2} />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button>
        <Button type="submit">{initialData ? 'Cập nhật' : 'Tạo mới'}</Button>
      </div>
    </form>
  );
}
