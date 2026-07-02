import { useCallback, useMemo, useState } from 'react';
import type { Activity, Project, Status } from '../data/mockData';
import { getDeadlineIndicator } from '../data/mockData';
import { parseChecklist } from '../lib/checklist';
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
  type DragOverEvent,
} from '@dnd-kit/core';

const STATUSES: Status[] = ['Chưa bắt đầu', 'Đang thực hiện', 'Chờ duyệt', 'Hoàn thành'];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; top: string; label: string }> = {
  'Chưa bắt đầu': { bg: 'bg-surface-tertiary', text: 'text-text-secondary', border: 'border-border', top: 'border-t-text-tertiary', label: 'Backlog' },
  'Đang thực hiện': { bg: 'bg-primary-light', text: 'text-primary', border: 'border-primary/20', top: 'border-t-primary', label: 'In progress' },
  'Chờ duyệt': { bg: 'bg-warning-light', text: 'text-warning', border: 'border-warning/20', top: 'border-t-warning', label: 'Review' },
  'Hoàn thành': { bg: 'bg-success-light', text: 'text-success', border: 'border-success/20', top: 'border-t-success', label: 'Done' },
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

const PRIORITY_ORDER: Record<Activity['priority'], number> = { High: 0, Medium: 1, Low: 2 };

type ModalMode = 'none' | 'create' | 'detail' | 'edit' | 'newProject' | 'editProject';
type PageView = 'projects' | 'kanban' | 'list';
type PriorityFilter = 'all' | Activity['priority'];
type DeadlineFilter = 'all' | 'overdue' | 'due-soon' | 'no-deadline';
type SortMode = 'deadline' | 'priority' | 'status';

function formatDate(d: string) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

function getChecklistProgress(activity: Activity) {
  const items = parseChecklist(activity.checklist);
  const done = items.filter(item => item.done).length;
  const percent = items.length === 0 ? 0 : Math.round((done / items.length) * 100);
  return { total: items.length, done, percent };
}

function sortActivities(items: Activity[], sortMode: SortMode) {
  return [...items].sort((a, b) => {
    if (sortMode === 'priority') {
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31');
    }
    if (sortMode === 'status') {
      return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    }
    return (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31') || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });
}

function DraggableCard({ activity, onOpen, getProjectName, showProject }: {
  activity: Activity;
  onOpen: (a: Activity) => void;
  getProjectName: (id: string) => string;
  showProject?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: activity.id });
  const computed = getDeadlineIndicator(activity);
  const checklist = getChecklistProgress(activity);

  return (
    <article
      ref={setNodeRef}
      onClick={() => onOpen(activity)}
      className={`activity-kanban-card ${computed.isOverdue ? 'activity-kanban-card-overdue' : ''} ${isDragging ? 'activity-kanban-card-dragging' : ''}`}
    >
      <div className="activity-card-title-row">
        <div className="min-w-0 flex-1">
          {showProject && (
            <p className="activity-card-project">{getProjectName(activity.projectId)}</p>
          )}
          <h3>{activity.name}</h3>
        </div>
        <button
          type="button"
          className="activity-drag-handle"
          aria-label="Kéo task sang pipeline khác"
          onClick={event => event.stopPropagation()}
          {...listeners}
          {...attributes}
        >
          Kéo
        </button>
      </div>

      {activity.description && <p className="activity-card-description line-clamp-2">{activity.description}</p>}

      <div className="activity-card-tags">
        <span className={`activity-card-pill border ${PRIORITY_STYLE[activity.priority]}`}>{activity.priority}</span>
        {activity.channel && <span className="activity-card-pill activity-card-pill-neutral">{activity.channel}</span>}
        {computed.indicator && (
          <span className={`activity-card-pill border ${computed.isOverdue ? 'bg-danger-light text-danger border-danger/20' : 'bg-surface-tertiary text-text-tertiary border-border'}`}>
            {computed.indicator}
          </span>
        )}
      </div>

      {checklist.total > 0 && (
        <div className="activity-card-checklist">
          <div><span style={{ width: `${checklist.percent}%` }} /></div>
          <p>{checklist.done}/{checklist.total} checklist</p>
        </div>
      )}

      <div className="activity-card-footer">
        {activity.assignee ? (
          <div className="activity-card-assignee">
            <span>{activity.assignee.charAt(0).toUpperCase()}</span>
            <strong>{activity.assignee.split(' ').slice(-1)[0]}</strong>
          </div>
        ) : <span className="activity-card-muted">Chưa có owner</span>}
        {activity.deadline ? (
          <time className={computed.isOverdue ? 'danger' : ''}>{formatDate(activity.deadline)}</time>
        ) : <span className="activity-card-muted">No due</span>}
      </div>
    </article>
  );
}

function DroppableColumn({ status, children, count, total, isActiveDrop, onQuickCreate }: {
  status: Status;
  children: React.ReactNode;
  count: number;
  total: number;
  isActiveDrop: boolean;
  onQuickCreate: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const colors = STATUS_COLORS[status];
  const percent = total === 0 ? 0 : Math.round((count / total) * 100);

  return (
    <section
      ref={setNodeRef}
      className={`activity-kanban-column ${colors.top} ${isOver || isActiveDrop ? 'activity-kanban-column-over' : ''}`}
    >
      <header className="activity-kanban-column-head">
        <div>
          <span>{colors.label}</span>
          <h2>{status}</h2>
        </div>
        <strong className={`${colors.bg} ${colors.text}`}>{count}</strong>
      </header>
      <div className="activity-kanban-column-progress"><span style={{ width: `${percent}%` }} /></div>
      <div className="activity-kanban-column-body">
        {children}
      </div>
      <button type="button" className="activity-column-create" onClick={onQuickCreate}>
        + Tạo task ở cột này
      </button>
    </section>
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
    <div className="professional-card rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-text-primary mb-1">{project.name}</h3>
          {project.description && (
            <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{project.description}</p>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={e => { e.stopPropagation(); onEdit(); }} className="px-2.5 h-7 rounded-lg border border-border bg-white text-text-secondary hover:bg-primary-light hover:text-primary hover:border-primary/20 transition-colors text-xs font-bold">
            Sửa
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="px-2.5 h-7 rounded-lg border border-border bg-white text-text-secondary hover:bg-danger-light hover:text-danger hover:border-rose-200 transition-colors text-xs font-bold">
            Xóa
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
        className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-950 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
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
  const [activeDropStatus, setActiveDropStatus] = useState<Status | null>(null);
  const [createDefaults, setCreateDefaults] = useState<Partial<Activity> | undefined>(undefined);
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('deadline');

  const filteredActivities = selectedProjectId ? activities.filter(a => a.projectId === selectedProjectId) : activities;
  const currentProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;
  const getProjectName = useCallback((id: string) => projects.find(p => p.id === id)?.name || 'Không có dự án', [projects]);
  const getProjectActivities = (pid: string) => activities.filter(a => a.projectId === pid);

  const assignees = useMemo(() => {
    return Array.from(new Set(filteredActivities.map(a => a.assignee).filter(Boolean))).sort();
  }, [filteredActivities]);

  const visibleActivities = useMemo(() => {
    const q = query.trim().toLowerCase();
    const next = filteredActivities.filter(activity => {
      const deadlineState = getDeadlineIndicator(activity);
      const content = [activity.name, activity.description, activity.assignee, activity.channel, activity.notes, getProjectName(activity.projectId)].join(' ').toLowerCase();
      if (q && !content.includes(q)) return false;
      if (priorityFilter !== 'all' && activity.priority !== priorityFilter) return false;
      if (assigneeFilter !== 'all' && activity.assignee !== assigneeFilter) return false;
      if (deadlineFilter === 'overdue' && !deadlineState.isOverdue) return false;
      if (deadlineFilter === 'due-soon' && deadlineState.indicator !== 'Sắp đến hạn') return false;
      if (deadlineFilter === 'no-deadline' && activity.deadline) return false;
      return true;
    });
    return sortActivities(next, sortMode);
  }, [assigneeFilter, deadlineFilter, filteredActivities, getProjectName, priorityFilter, query, sortMode]);

  const boardMetrics = useMemo(() => {
    return {
      total: visibleActivities.length,
      overdue: visibleActivities.filter(a => getDeadlineIndicator(a).isOverdue).length,
      dueSoon: visibleActivities.filter(a => getDeadlineIndicator(a).indicator === 'Sắp đến hạn').length,
      high: visibleActivities.filter(a => a.priority === 'High').length,
      review: visibleActivities.filter(a => a.status === 'Chờ duyệt').length,
      done: visibleActivities.filter(a => a.status === 'Hoàn thành').length,
    };
  }, [visibleActivities]);

  const handleCreateActivity = (newAct: Omit<Activity, 'id'>) => {
    addActivity(newAct);
    setCreateDefaults(undefined);
    setModalMode('none');
  };
  const handleUpdateActivity = (updates: Omit<Activity, 'id'>) => {
    if (selectedActivity) { updateActivity(selectedActivity.id, updates); setSelectedActivity({ ...selectedActivity, ...updates }); }
    setModalMode('detail');
  };
  const handleDeleteActivity = (id: string) => { deleteActivity(id); setModalMode('none'); setSelectedActivity(null); };

  const handleChangeActivityStatus = (activity: Activity, status: Status) => {
    if (activity.status === status) return;
    updateActivity(activity.id, { status });
    setSelectedActivity(prev => prev?.id === activity.id ? { ...prev, status } : prev);
  };

  const openCreateActivity = (defaults?: Partial<Activity>) => {
    setCreateDefaults(defaults);
    setModalMode('create');
  };

  const openColumnCreate = (status: Status) => {
    openCreateActivity({
      projectId: selectedProjectId ?? projects[0]?.id ?? '',
      status,
    });
  };

  const resetFilters = () => {
    setQuery('');
    setPriorityFilter('all');
    setAssigneeFilter('all');
    setDeadlineFilter('all');
    setSortMode('deadline');
  };

  const handleSaveProject = (data: Omit<Project, 'id'>) => {
    if (editingProject) { updateProject(editingProject.id, data); } else { addProject(data); }
    setModalMode('none'); setEditingProject(null);
  };

  const handleDeleteProject = (pid: string) => {
    deleteProject(pid);
    if (selectedProjectId === pid) { setSelectedProjectId(null); setPageView('projects'); }
  };

  const openProject = (pid: string) => { setSelectedProjectId(pid); setPageView('kanban'); setViewMode('board'); resetFilters(); };

  const onDragStart = (event: DragStartEvent) => { setActiveId(event.active.id as string); };
  const onDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as Status | undefined;
    setActiveDropStatus(overId && STATUSES.includes(overId) ? overId : null);
  };
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDropStatus(null);
    if (over && STATUSES.includes(over.id as Status)) {
      const activity = activities.find(item => item.id === active.id);
      if (activity) handleChangeActivityStatus(activity, over.id as Status);
    }
  };

  const activeActivity = activeId ? activities.find(a => a.id === activeId) : null;
  const createInitialData = createDefaults ? { ...createDefaults } as Activity : (selectedProjectId ? { projectId: selectedProjectId } as Activity : undefined);

  return (
    <div className="page-shell flex flex-col gap-5 h-full min-h-0">
      <div className="page-header shrink-0 !mb-1">
        <div className="flex items-center gap-3">
          {pageView !== 'projects' && (
            <button
              onClick={() => { setPageView('projects'); setSelectedProjectId(null); resetFilters(); }}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface text-text-secondary text-sm hover:bg-surface-tertiary transition-colors"
            >
              Quay lại dự án
            </button>
          )}
          <div>
            <h1 className="page-title !text-2xl">
              {pageView === 'projects' ? 'Quản lý hoạt động' : currentProject?.name || 'Tất cả dự án'}
            </h1>
            <p className="page-subtitle !text-xs !mt-1">
              {pageView === 'projects' ? `${projects.length} dự án / ${activities.length} hoạt động` : `${visibleActivities.length}/${filteredActivities.length} hoạt động đang hiển thị`}
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
              <Button onClick={() => openCreateActivity(selectedProjectId ? { projectId: selectedProjectId } : undefined)}>Tạo hoạt động</Button>
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
        <>
          <div className="activity-board-scope">
            <button
              onClick={() => { setSelectedProjectId(null); resetFilters(); }}
              className={selectedProjectId === null ? 'active' : ''}
            >
              Tất cả dự án <span>{activities.length}</span>
            </button>
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedProjectId(p.id); resetFilters(); }}
                className={selectedProjectId === p.id ? 'active' : ''}
              >
                {p.name} <span>{getProjectActivities(p.id).length}</span>
              </button>
            ))}
          </div>

          <section className="activity-workbench professional-card">
            <div className="activity-workbench-head">
              <div>
                <h2>Điều phối hoạt động truyền thông</h2>
                <span>Kéo task sang cột để đổi pipeline. Click vào card để mở chi tiết, checklist và review notes.</span>
              </div>
              <button type="button" onClick={resetFilters}>Reset bộ lọc</button>
            </div>

            <div className="activity-workbench-metrics">
              {[
                { label: 'Đang hiển thị', value: boardMetrics.total },
                { label: 'High priority', value: boardMetrics.high },
                { label: 'Chờ duyệt', value: boardMetrics.review },
                { label: 'Sắp đến hạn', value: boardMetrics.dueSoon },
                { label: 'Quá hạn', value: boardMetrics.overdue },
              ].map(metric => (
                <div key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>

            <div className="activity-board-toolbar">
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Tìm task, owner, kênh, dự án..."
                className="form-control activity-search-input"
              />
              <select className="form-control" value={priorityFilter} onChange={event => setPriorityFilter(event.target.value as PriorityFilter)}>
                <option value="all">Tất cả priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <select className="form-control" value={assigneeFilter} onChange={event => setAssigneeFilter(event.target.value)}>
                <option value="all">Tất cả owner</option>
                {assignees.map(assignee => <option key={assignee} value={assignee}>{assignee}</option>)}
              </select>
              <select className="form-control" value={deadlineFilter} onChange={event => setDeadlineFilter(event.target.value as DeadlineFilter)}>
                <option value="all">Tất cả deadline</option>
                <option value="overdue">Quá hạn</option>
                <option value="due-soon">Sắp đến hạn</option>
                <option value="no-deadline">Chưa có deadline</option>
              </select>
              <select className="form-control" value={sortMode} onChange={event => setSortMode(event.target.value as SortMode)}>
                <option value="deadline">Sắp xếp deadline</option>
                <option value="priority">Sắp xếp priority</option>
                <option value="status">Sắp xếp pipeline</option>
              </select>
            </div>
          </section>
        </>
      )}

      {pageView !== 'projects' && viewMode === 'board' && (
        <DndContext collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => { setActiveId(null); setActiveDropStatus(null); }}>
          <div className="activity-kanban-board">
            {STATUSES.map(status => {
              const colActs = visibleActivities.filter(a => a.status === status);
              return (
                <DroppableColumn key={status} status={status} count={colActs.length} total={visibleActivities.length} isActiveDrop={activeDropStatus === status} onQuickCreate={() => openColumnCreate(status)}>
                  {colActs.map(act => (
                    <DraggableCard key={act.id} activity={act} onOpen={a => { setSelectedActivity(a); setModalMode('detail'); }} getProjectName={getProjectName} showProject={selectedProjectId === null} />
                  ))}
                  {colActs.length === 0 && (
                    <div className="activity-column-empty">
                      {activeId ? 'Thả task vào đây' : 'Chưa có hoạt động phù hợp'}
                    </div>
                  )}
                </DroppableColumn>
              );
            })}
          </div>
          <DragOverlay>
            {activeActivity ? (
              <div className="activity-drag-overlay">
                <p>{activeActivity.name}</p>
                <span>{activeDropStatus ? `Đang chuyển sang: ${activeDropStatus}` : 'Kéo sang cột mong muốn'}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {pageView !== 'projects' && viewMode === 'list' && (
        <div className="flex-1 overflow-auto table-wrap">
          <table className="data-table">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                {['Tên hoạt động', ...(selectedProjectId === null ? ['Dự án'] : []), 'Phụ trách', 'Deadline', 'Priority', 'Trạng thái'].map(h => (
                  <th key={h} className="px-4 py-3 font-semibold text-text-secondary text-left text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleActivities.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-tertiary">Không có hoạt động phù hợp bộ lọc.</td></tr>
              ) : visibleActivities.map(act => {
                const computed = getDeadlineIndicator(act);
                return (
                  <tr key={act.id} onClick={() => { setSelectedActivity(act); setModalMode('detail'); }}
                    className="border-b border-border hover:bg-surface-secondary cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-semibold text-text-primary">{act.name}</td>
                    {selectedProjectId === null && <td className="px-4 py-3 text-text-secondary">{getProjectName(act.projectId)}</td>}
                    <td className="px-4 py-3 text-text-secondary">{act.assignee || '—'}</td>
                    <td className={`px-4 py-3 ${computed.isOverdue ? 'text-danger font-medium' : 'text-text-secondary'}`}>{act.deadline || '—'}</td>
                    <td className="px-4 py-3"><span className={`activity-card-pill border ${PRIORITY_STYLE[act.priority]}`}>{act.priority}</span></td>
                    <td className="px-4 py-3"><Badge status={act.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalMode === 'create'} onClose={() => { setModalMode('none'); setCreateDefaults(undefined); }} title="Tạo hoạt động mới">
        <ActivityForm initialData={createInitialData} onSubmit={handleCreateActivity} onCancel={() => { setModalMode('none'); setCreateDefaults(undefined); }} />
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