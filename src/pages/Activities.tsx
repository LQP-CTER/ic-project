import { useState } from 'react';
import type { Activity, Project, Status } from '../data/mockData';
import { getDeadlineIndicator } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ActivityForm } from '../components/ActivityForm';
import { ActivityDetail } from '../components/ActivityDetail';
import { ProjectForm } from '../components/ProjectForm';
import { useData } from '../context/DataContext';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';

const STATUSES: Status[] = ['Chưa bắt đầu', 'Đang thực hiện', 'Chờ duyệt', 'Hoàn thành'];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; top: string }> = {
  'Chưa bắt đầu': { bg: 'bg-surface-tertiary', text: 'text-text-secondary', border: 'border-border', top: 'border-t-text-tertiary' },
  'Đang thực hiện': { bg: 'bg-primary-light', text: 'text-primary', border: 'border-primary/20', top: 'border-t-primary' },
  'Chờ duyệt': { bg: 'bg-warning-light', text: 'text-warning', border: 'border-warning/20', top: 'border-t-warning' },
  'Hoàn thành': { bg: 'bg-success-light', text: 'text-success', border: 'border-success/20', top: 'border-t-success' },
};

const PRIORITY_STYLE: Record<string, string> = {
  'High': 'bg-danger-light text-danger border-danger/20',
  'Medium': 'bg-warning-light text-warning border-warning/20',
  'Low': 'bg-success-light text-success border-success/20',
};

const PROJECT_STATUS_STYLE: Record<string, string> = {
  'Đang thực hiện': 'bg-primary-light text-primary',
  'Chưa bắt đầu': 'bg-surface-tertiary text-text-secondary',
  'Hoàn thành': 'bg-success-light text-success',
  'Tạm dừng': 'bg-warning-light text-warning',
  'Kết thúc': 'bg-danger-light text-danger',
};

type ModalMode = 'none' | 'create' | 'detail' | 'edit' | 'newProject' | 'editProject';
type PageView = 'projects' | 'kanban' | 'list';

function formatDate(d: string) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

function DraggableCard({ activity, onOpen, getProjectName, showProject }: {
  activity: Activity;
  onOpen: (a: Activity) => void;
  getProjectName: (id: string) => string;
  showProject?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: activity.id });
  const computed = getDeadlineIndicator(activity);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(activity)}
      className={`p-3.5 bg-surface rounded-lg border border-border cursor-pointer transition-all duration-150 hover:shadow-sm hover:border-primary/30 ${isDragging ? 'opacity-50' : ''}`}
    >
      <p className="text-sm font-semibold text-text-primary leading-snug mb-2">{activity.name}</p>
      {showProject && (
        <p className="text-xs text-primary font-medium mb-2">{getProjectName(activity.projectId)}</p>
      )}
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${PRIORITY_STYLE[activity.priority]}`}>
          {activity.priority}
        </span>
        {computed.indicator && (
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${computed.isOverdue ? 'bg-danger-light text-danger border-danger/20' : 'bg-surface-tertiary text-text-tertiary border-border'}`}>
            {computed.indicator}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        {activity.assignee && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
              {activity.assignee.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-text-secondary">{activity.assignee.split(' ').slice(-1)[0]}</span>
          </div>
        )}
        {activity.deadline && (
          <span className={`text-xs ${computed.isOverdue ? 'text-danger font-medium' : 'text-text-tertiary'}`}>
            {formatDate(activity.deadline)}
          </span>
        )}
      </div>
    </div>
  );
}

function DroppableColumn({ status, children, count }: {
  status: Status;
  children: React.ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const colors = STATUS_COLORS[status];

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border-2 border-t-[3px] transition-all duration-200 ${colors.top} ${isOver ? 'border-primary/50 bg-primary-50' : 'border-border bg-surface-secondary'}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-text-primary">{status}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
          {count}
        </span>
      </div>
      <div className="flex-1 p-3 flex flex-col gap-2 min-h-[100px]">
        {children}
      </div>
    </div>
  );
}

function ProjectCard({ project, acts, onOpen, onEdit, onDelete }: {
  project: Project;
  acts: Activity[];
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const total = acts.length;
  const done = acts.filter(a => a.status === 'Hoàn thành').length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  const isOverdue = project.deadline && new Date().toISOString().split('T')[0] > project.deadline && progress < 100;
  const pStyle = PROJECT_STATUS_STYLE[project.status] || PROJECT_STATUS_STYLE['Chưa bắt đầu'];

  let overdueCount = 0;
  let dueSoonCount = 0;
  acts.forEach(act => {
    const ind = getDeadlineIndicator(act);
    if (ind.indicator === 'Quá hạn') overdueCount++;
    if (ind.indicator === 'Sắp đến hạn') dueSoonCount++;
  });

  return (
    <div className="bg-surface rounded-xl border border-border p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-md hover:border-primary/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-text-primary mb-1">{project.name}</h3>
          {project.description && (
            <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{project.description}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={e => { e.stopPropagation(); onEdit(); }} className="w-7 h-7 rounded-md text-text-tertiary hover:bg-primary-light hover:text-primary transition-colors text-xs font-medium">
            Edit
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="w-7 h-7 rounded-md text-text-tertiary hover:bg-danger-light hover:text-danger transition-colors text-xs font-medium">
            Del
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-[11px] text-text-tertiary">Tiến độ</span>
          <span className={`text-[11px] font-semibold ${progress === 100 ? 'text-success' : 'text-primary'}`}>{progress}%</span>
        </div>
        <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs text-text-secondary">
          <span>{done}/{total} hoạt động</span>
          {project.deadline && (
            <span className={isOverdue ? 'text-danger' : ''}>{project.deadline}</span>
          )}
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pStyle}`}>{project.status}</span>
      </div>

      {(overdueCount > 0 || dueSoonCount > 0) && (
        <div className="flex gap-2">
          {overdueCount > 0 && <span className="text-[11px] text-danger bg-danger-light px-2 py-0.5 rounded font-medium">{overdueCount} quá hạn</span>}
          {dueSoonCount > 0 && <span className="text-[11px] text-warning bg-warning-light px-2 py-0.5 rounded font-medium">{dueSoonCount} sắp đến hạn</span>}
        </div>
      )}

      <button
        onClick={onOpen}
        className="w-full py-2 rounded-lg border border-primary/30 bg-primary-light text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
      >
        Xem chi tiết
      </button>
    </div>
  );
}

export function Activities() {
  const { activities, projects, addActivity, updateActivity, deleteActivity, addProject, updateProject, deleteProject } = useData();

  const [pageView, setPageView] = useState<PageView>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('none');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [activeId, setActiveId] = useState<string | null>(null);

  const filteredActivities = selectedProjectId ? activities.filter(a => a.projectId === selectedProjectId) : activities;
  const currentProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;
  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || 'Không có dự án';
  const getProjectActivities = (pid: string) => activities.filter(a => a.projectId === pid);

  const handleCreateActivity = (newAct: Omit<Activity, 'id'>) => { addActivity(newAct); setModalMode('none'); };
  const handleUpdateActivity = (updates: Omit<Activity, 'id'>) => {
    if (selectedActivity) { updateActivity(selectedActivity.id, updates); setSelectedActivity({ ...selectedActivity, ...updates }); }
    setModalMode('detail');
  };
  const handleDeleteActivity = (id: string) => { deleteActivity(id); setModalMode('none'); setSelectedActivity(null); };

  const handleSaveProject = (data: Omit<Project, 'id'>) => {
    if (editingProject) { updateProject(editingProject.id, data); } else { addProject(data); }
    setModalMode('none'); setEditingProject(null);
  };

  const handleDeleteProject = (pid: string) => {
    deleteProject(pid);
    if (selectedProjectId === pid) { setSelectedProjectId(null); setPageView('projects'); }
  };

  const openProject = (pid: string) => { setSelectedProjectId(pid); setPageView('kanban'); setViewMode('board'); };

  const onDragStart = (event: DragStartEvent) => { setActiveId(event.active.id as string); };
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && STATUSES.includes(over.id as Status)) {
      updateActivity(active.id as string, { status: over.id as Status });
    }
  };

  const activeActivity = activeId ? activities.find(a => a.id === activeId) : null;

  return (
    <div className="flex flex-col gap-5 h-full min-h-0">
      <div className="flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {pageView !== 'projects' && (
            <button
              onClick={() => { setPageView('projects'); setSelectedProjectId(null); }}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface text-text-secondary text-sm hover:bg-surface-tertiary transition-colors"
            >
              &larr; Dự án
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              {pageView === 'projects' ? 'Quản lý hoạt động' : currentProject?.name || 'Tất cả dự án'}
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              {pageView === 'projects' ? `${projects.length} dự án · ${activities.length} hoạt động` : `${filteredActivities.length} hoạt động trong dự án này`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {pageView === 'projects' && (
            <Button variant="secondary" onClick={() => { setEditingProject(null); setModalMode('newProject'); }}>Tạo dự án mới</Button>
          )}
          {pageView !== 'projects' && (
            <>
              <div className="flex p-1 bg-surface-tertiary rounded-lg border border-border">
                {(['board', 'list'] as const).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === mode ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>
                    {mode === 'board' ? 'Board' : 'List'}
                  </button>
                ))}
              </div>
              <Button onClick={() => setModalMode('create')}>Tạo hoạt động</Button>
            </>
          )}
        </div>
      </div>

      {pageView === 'projects' && (
        <div className="flex-1 overflow-y-auto pb-4">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center border-2 border-dashed border-border rounded-2xl">
              <p className="font-semibold text-text-primary">Chưa có dự án nào</p>
              <p className="text-sm text-text-secondary">Tạo dự án mới hoặc sử dụng Workflow để tạo tự động.</p>
              <Button onClick={() => { setEditingProject(null); setModalMode('newProject'); }}>Tạo dự án đầu tiên</Button>
            </div>
          ) : (
            <>
              <div className="flex gap-3 mb-6 flex-wrap">
                {[
                  { label: 'Tổng dự án', value: projects.length, color: 'text-primary' },
                  { label: 'Tổng hoạt động', value: activities.length, color: 'text-primary-600' },
                  { label: 'Sắp đến hạn', value: activities.filter(a => getDeadlineIndicator(a).indicator === 'Sắp đến hạn').length, color: 'text-warning' },
                  { label: 'Quá hạn', value: activities.filter(a => getDeadlineIndicator(a).indicator === 'Quá hạn').length, color: 'text-danger' },
                ].map(stat => (
                  <div key={stat.label} className="bg-surface border border-border rounded-xl px-5 py-3.5 flex items-center gap-3 flex-1 min-w-[160px]">
                    <div>
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-[11px] text-text-tertiary mt-0.5">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.map(p => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    acts={getProjectActivities(p.id)}
                    onOpen={() => openProject(p.id)}
                    onEdit={() => { setEditingProject(p); setModalMode('editProject'); }}
                    onDelete={() => setDeletingProject(p)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {pageView !== 'projects' && (
        <div className="flex gap-2 flex-wrap shrink-0 border-b border-border pb-3">
          <button
            onClick={() => { setSelectedProjectId(null); setPageView('projects'); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedProjectId === null ? 'bg-primary-light border-primary/30 text-primary' : 'border-border text-text-secondary hover:bg-surface-tertiary'}`}
          >
            Tất cả dự án
          </button>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedProjectId === p.id ? 'bg-primary-light border-primary/30 text-primary' : 'border-border text-text-secondary hover:bg-surface-tertiary'}`}
            >
              {p.name} <span className="opacity-60 ml-1">{getProjectActivities(p.id).length}</span>
            </button>
          ))}
        </div>
      )}

      {pageView !== 'projects' && viewMode === 'board' && selectedProjectId !== null && (
        <DndContext collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex-1 grid grid-cols-4 gap-4 overflow-auto pb-4 items-start">
            {STATUSES.map(status => {
              const colActs = filteredActivities.filter(a => a.status === status);
              return (
                <DroppableColumn key={status} status={status} count={colActs.length}>
                  {colActs.map(act => (
                    <DraggableCard key={act.id} activity={act} onOpen={a => { setSelectedActivity(a); setModalMode('detail'); }} getProjectName={getProjectName} showProject={selectedProjectId === null} />
                  ))}
                  {colActs.length === 0 && (
                    <div className="p-6 text-center text-xs text-text-tertiary border-2 border-dashed border-border rounded-lg">
                      Chưa có hoạt động
                    </div>
                  )}
                </DroppableColumn>
              );
            })}
          </div>
          <DragOverlay>
            {activeActivity ? (
              <div className="p-3.5 bg-surface rounded-lg border-2 border-primary shadow-lg opacity-90">
                <p className="text-sm font-semibold text-text-primary">{activeActivity.name}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {pageView !== 'projects' && viewMode === 'list' && selectedProjectId !== null && (
        <div className="flex-1 overflow-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                {['Tên hoạt động', ...(selectedProjectId === null ? ['Dự án'] : []), 'Phụ trách', 'Deadline', 'Trạng thái'].map(h => (
                  <th key={h} className="px-4 py-3 font-semibold text-text-secondary text-left text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-tertiary">Chưa có hoạt động nào.</td></tr>
              ) : filteredActivities.map(act => {
                const computed = getDeadlineIndicator(act);
                return (
                  <tr key={act.id} onClick={() => { setSelectedActivity(act); setModalMode('detail'); }}
                    className="border-b border-border hover:bg-surface-secondary cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-semibold text-text-primary">{act.name}</td>
                    {selectedProjectId === null && <td className="px-4 py-3 text-text-secondary">{getProjectName(act.projectId)}</td>}
                    <td className="px-4 py-3 text-text-secondary">{act.assignee || '—'}</td>
                    <td className={`px-4 py-3 ${computed.isOverdue ? 'text-danger font-medium' : 'text-text-secondary'}`}>{act.deadline || '—'}</td>
                    <td className="px-4 py-3"><Badge status={act.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalMode === 'create'} onClose={() => setModalMode('none')} title="Tạo hoạt động mới">
        <ActivityForm initialData={selectedProjectId ? { projectId: selectedProjectId } as Partial<Activity> as Activity : undefined} onSubmit={handleCreateActivity} onCancel={() => setModalMode('none')} />
      </Modal>

      <Modal isOpen={modalMode === 'detail' && !!selectedActivity} onClose={() => { setModalMode('none'); setSelectedActivity(null); }} title="Chi tiết hoạt động">
        {selectedActivity && <ActivityDetail activity={selectedActivity} onEdit={() => setModalMode('edit')} onDelete={() => handleDeleteActivity(selectedActivity.id)} onClose={() => { setModalMode('none'); setSelectedActivity(null); }} />}
      </Modal>

      <Modal isOpen={modalMode === 'edit' && !!selectedActivity} onClose={() => setModalMode('detail')} title="Chỉnh sửa hoạt động">
        {selectedActivity && <ActivityForm initialData={selectedActivity} onSubmit={handleUpdateActivity} onCancel={() => setModalMode('detail')} />}
      </Modal>

      <Modal isOpen={modalMode === 'newProject' || modalMode === 'editProject'} onClose={() => { setModalMode('none'); setEditingProject(null); }} title={editingProject ? 'Chỉnh sửa dự án' : 'Tạo dự án mới'}>
        <ProjectForm initialData={editingProject || undefined} onSubmit={handleSaveProject} onCancel={() => { setModalMode('none'); setEditingProject(null); }} />
      </Modal>

      <Modal isOpen={!!deletingProject} onClose={() => setDeletingProject(null)} title="Xóa dự án?">
        {deletingProject && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary leading-relaxed">Tất cả hoạt động thuộc dự án này cũng sẽ bị xóa. Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeletingProject(null)}>Hủy</Button>
              <Button variant="danger" onClick={() => { handleDeleteProject(deletingProject.id); setDeletingProject(null); }}>Xóa dự án</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
