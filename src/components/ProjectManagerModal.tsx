import { useState } from 'react';
import { useData } from '../context/DataContext';
import type { Project } from '../data/mockData';
import { ProjectForm } from './ProjectForm';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export function ProjectManagerModal() {
  const { projects, addProject, updateProject, deleteProject } = useData();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = (data: Omit<Project, 'id'>) => {
    if (isCreating) {
      addProject(data);
    } else if (editingProject) {
      updateProject(editingProject.id, data);
    }
    setIsCreating(false);
    setEditingProject(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Xóa dự án này? Các hoạt động thuộc dự án cũng sẽ bị xóa.')) {
      deleteProject(id);
    }
  };

  if (isCreating || editingProject) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-border pb-3 mb-2">
          <h3 className="text-lg font-semibold text-text-primary">{isCreating ? 'Tạo Dự án Mới' : 'Chỉnh Sửa Dự án'}</h3>
        </div>
        <ProjectForm
          initialData={editingProject || undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setIsCreating(false); setEditingProject(null); }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-text-primary">Danh Sách Dự Án</h3>
        <Button size="sm" onClick={() => setIsCreating(true)}>Tạo mới</Button>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary">Tên dự án</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary">Phụ trách</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary">Deadline</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary">Trạng thái</th>
              <th className="px-4 py-3 text-xs font-semibold text-text-secondary w-20">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-text-tertiary text-sm">Chưa có dự án nào</td></tr>
            ) : projects.map(p => (
              <tr key={p.id} className="border-b border-border hover:bg-surface-secondary transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-text-primary">{p.name}</td>
                <td className="px-4 py-3 text-sm text-text-secondary">{p.assignee}</td>
                <td className="px-4 py-3 text-sm text-text-secondary">{p.deadline}</td>
                <td className="px-4 py-3 text-sm"><Badge status={p.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="px-2 py-1 rounded text-xs font-medium text-text-secondary hover:bg-primary-light hover:text-primary transition-colors" onClick={() => setEditingProject(p)}>Sửa</button>
                    <button className="px-2 py-1 rounded text-xs font-medium text-text-secondary hover:bg-danger-light hover:text-danger transition-colors" onClick={() => handleDelete(p.id)}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
