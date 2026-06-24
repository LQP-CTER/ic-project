import { useState } from 'react';
import { useData } from '../context/DataContext';
import type { Project } from '../data/mockData';
import { ProjectForm } from './ProjectForm';
import { Button } from './ui/Button';
import { Plus, Edit2, Trash2 } from 'lucide-react';
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
    if (confirm('Bạn có chắc chắn muốn xóa dự án này? Các hoạt động thuộc dự án cũng sẽ bị xóa.')) {
      deleteProject(id);
    }
  };

  if (isCreating || editingProject) {
    return (
      <div className="flex-col gap-4">
        <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-4">
          <h3 className="font-semibold text-lg">{isCreating ? 'Tạo Dự án Mới' : 'Chỉnh Sửa Dự án'}</h3>
        </div>
        <ProjectForm 
          initialData={editingProject || undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsCreating(false);
            setEditingProject(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex-col gap-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Danh Sách Dự Án</h3>
        <Button size="sm" icon={<Plus size={16} />} onClick={() => setIsCreating(true)}>Tạo mới</Button>
      </div>
      
      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 bg-black bg-opacity-20">
              <th className="p-3 font-medium text-secondary text-sm">Tên dự án</th>
              <th className="p-3 font-medium text-secondary text-sm">Phụ trách</th>
              <th className="p-3 font-medium text-secondary text-sm">Deadline</th>
              <th className="p-3 font-medium text-secondary text-sm">Trạng thái</th>
              <th className="p-3 font-medium text-secondary text-sm w-20">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-secondary">Chưa có dự án nào</td>
              </tr>
            ) : projects.map(p => (
              <tr key={p.id} className="border-b border-gray-800 hover:bg-white hover:bg-opacity-5 transition-colors">
                <td className="p-3 text-sm font-medium">{p.name}</td>
                <td className="p-3 text-sm">{p.assignee}</td>
                <td className="p-3 text-sm text-secondary">{p.deadline}</td>
                <td className="p-3 text-sm"><Badge status={p.status} /></td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="p-1.5 rounded bg-gray-800 hover:bg-indigo-500 hover:text-white transition-colors" title="Chỉnh sửa" onClick={() => setEditingProject(p)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="p-1.5 rounded bg-gray-800 hover:bg-red-500 hover:text-white transition-colors" title="Xóa" onClick={() => handleDelete(p.id)}>
                      <Trash2 size={14} />
                    </button>
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
