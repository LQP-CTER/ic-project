import React, { useState } from 'react';
import type { Activity, Project, Status } from '../data/mockData';
import { getDeadlineIndicator } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ActivityForm } from '../components/ActivityForm';
import { ActivityDetail } from '../components/ActivityDetail';
import { ProjectForm } from '../components/ProjectForm';
import {
  Plus, LayoutGrid, List as ListIcon, Calendar, ChevronLeft,
  TrendingUp, Clock, CheckCircle2, AlertCircle, FolderOpen, Pencil, Trash2
} from 'lucide-react';
import { useData } from '../context/DataContext';

// ─── Constants ───────────────────────────────────────────────────────────────
const STATUSES: Status[] = ['Chưa bắt đầu', 'Đang thực hiện', 'Chờ duyệt', 'Hoàn thành'];

const STATUS_TOP_COLOR: Record<string, string> = {
  'Chưa bắt đầu': '#64748b',
  'Đang thực hiện': '#6366f1',
  'Chờ duyệt': '#f59e0b',
  'Hoàn thành': '#10b981',
};

const PRIORITY_STYLE: Record<string, React.CSSProperties> = {
  'High': { background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.25)' },
  'Medium': { background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.25)' },
  'Low': { background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', border: '1px solid rgba(34, 197, 94, 0.25)' },
};

const PROJECT_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'Đang thực hiện': { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
  'Chưa bắt đầu':  { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
  'Hoàn thành':    { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
  'Tạm dừng':      { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  'Kết thúc':      { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
};

type ModalMode = 'none' | 'create' | 'detail' | 'edit' | 'newProject' | 'editProject';
type PageView  = 'projects' | 'kanban' | 'list';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

function calcProgress(acts: Activity[]) {
  if (!acts.length) return 0;
  return Math.round((acts.filter(a => a.status === 'Hoàn thành').length / acts.length) * 100);
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({
  project, acts, onOpen, onEdit, onDelete,
}: {
  project: Project;
  acts: Activity[];
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const total = acts.length;
  const done = acts.filter(a => a.status === 'Hoàn thành').length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  
  let overdueCount = 0;
  let dueSoonCount = 0;
  
  acts.forEach(act => {
    const indicator = getDeadlineIndicator(act);
    if (indicator.indicator === 'Quá hạn') overdueCount++;
    if (indicator.indicator === 'Sắp đến hạn') dueSoonCount++;
  });

  const isProjectOverdue = project.deadline && new Date().toISOString().split('T')[0] > project.deadline && progress < 100;
  const pSt = PROJECT_STATUS_STYLE[project.status] || PROJECT_STATUS_STYLE['Chưa bắt đầu'];

  return (
    <div
      style={{
        background: 'rgba(22,32,52,0.85)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '1.375rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'border-color 0.2s, transform 0.18s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'rgba(99,102,241,0.4)';
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'rgba(255,255,255,0.07)';
        el.style.transform = 'translateY(0)';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '4px', color: '#f8fafc' }}>
            {project.name}
          </h3>
          {project.description && (
            <p style={{
              fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5',
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {project.description}
            </p>
          )}
        </div>
        {/* Edit / Delete buttons */}
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Chỉnh sửa"
            style={{
              width: '28px', height: '28px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.2)'; (e.currentTarget as HTMLButtonElement).style.color = '#818cf8'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Xóa dự án"
            style={{
              width: '28px', height: '28px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Tiến độ</span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: progress === 100 ? '#34d399' : '#818cf8' }}>
            {progress}%
          </span>
        </div>
        <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '999px',
            width: `${progress}%`,
            background: progress === 100 ? '#10b981' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} style={{ color: '#34d399' }} />
            {done}/{total} hoạt động
          </span>
          {project.deadline && (
            <span style={{ fontSize: '0.6875rem', color: isProjectOverdue ? '#f87171' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} style={{ color: isProjectOverdue ? '#f87171' : '#94a3b8' }} />
              {project.deadline}
            </span>
          )}
        </div>
        <span style={{
          fontSize: '0.625rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
          background: pSt.bg, color: pSt.color,
        }}>
          {project.status}
        </span>
      </div>

      {/* Activity Alerts */}
      {(overdueCount > 0 || dueSoonCount > 0) && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          {overdueCount > 0 && (
            <span style={{ fontSize: '0.6875rem', color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              {overdueCount} quá hạn
            </span>
          )}
          {dueSoonCount > 0 && (
            <span style={{ fontSize: '0.6875rem', color: '#fbbf24', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
              {dueSoonCount} sắp đến hạn
            </span>
          )}
        </div>
      )}

      {/* Action Button */}
      <div style={{ marginTop: '16px' }}>
        <button
          onClick={onOpen}
          style={{
            width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.3)',
            background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 600, fontSize: '0.8125rem',
            cursor: 'pointer', transition: 'all 0.15s'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)'; }}
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}

// ─── Kanban Board (reusable) ──────────────────────────────────────────────────
function KanbanBoard({
  filteredActivities, allActivities, onOpenDetail, onDragStart, onDragOver, onDragLeave, onDrop, dragOverCol, getProjectName, showProjectName, onViewAll,
}: {
  filteredActivities: Activity[];
  allActivities: Activity[];
  onOpenDetail: (a: Activity) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, s: Status) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, s: Status) => void;
  dragOverCol: Status | null;
  getProjectName: (id: string) => string;
  showProjectName?: boolean;
  onViewAll?: (status: Status) => void;
}) {
  return (
    <div style={{
      flex: 1,
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      gap: '1rem',
      width: '100%',
      overflowX: 'auto',
      overflowY: 'auto',
      paddingBottom: '0.75rem',
      minHeight: 0,
      alignItems: 'start'
    }}>
      {STATUSES.map(status => {
        const colActs  = filteredActivities.filter(a => a.status === status);
        const isTarget = dragOverCol === status;
        const topColor = STATUS_TOP_COLOR[status] || '#64748b';

        return (
          <div
            key={status}
            onDragOver={e => onDragOver(e, status)}
            onDragLeave={onDragLeave}
            onDrop={e => onDrop(e, status)}
            style={{
              minWidth: 0,
              display: 'flex', flexDirection: 'column',
              borderRadius: '12px',
              background: isTarget ? 'rgba(99,102,241,0.06)' : 'rgba(15,23,42,0.5)',
              border: `2px solid ${isTarget ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
              borderTopColor: isTarget ? 'rgba(99,102,241,0.5)' : topColor,
              borderTopWidth: '3px',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            {/* Column header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
            }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{status}</span>
              <span style={{
                fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,255,255,0.08)',
                color: 'var(--text-secondary)', padding: '1px 8px', borderRadius: '999px', minWidth: '22px', textAlign: 'center',
              }}>{colActs.length}</span>
            </div>

            {/* Cards */}
            <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {colActs.length === 0 && (
                <div style={{
                  padding: '24px 12px', textAlign: 'center', fontSize: '0.75rem',
                  color: isTarget ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.2)',
                  border: `2px dashed ${isTarget ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '8px', transition: 'all 0.2s',
                }}>
                  {isTarget ? '↓ Thả vào đây' : 'Chưa có hoạt động'}
                </div>
              )}
              {colActs.slice(0, 3).map(act => {
                const computed = getDeadlineIndicator(act);
                const overdue = computed.isOverdue;
                return (
                  <div
                    key={act.id}
                    draggable
                    onDragStart={e => onDragStart(e, act.id)}
                    onClick={() => onOpenDetail(act)}
                    style={{
                      background: 'rgba(30,41,59,0.8)', backdropFilter: 'blur(8px)',
                      border: `1px solid ${overdue ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '10px', padding: '12px', cursor: 'pointer',
                      userSelect: 'none', transition: 'border-color 0.15s',
                      display: 'flex', flexDirection: 'column', gap: '8px',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.5)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = overdue ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}
                  >
                    {/* Activity title */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <p style={{
                        fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)',
                        lineHeight: '1.4', margin: 0, wordBreak: 'break-word', flex: 1,
                      }}>
                        {act.name}
                      </p>
                    </div>

                    {/* Project Name (if showProjectName) */}
                    {showProjectName && (
                      <div style={{ fontSize: '0.6875rem', color: '#818cf8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getProjectName(act.projectId)}
                      </div>
                    )}

                    {/* Badges: Priority, then Deadline */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '0.625rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', ...PRIORITY_STYLE[act.priority] }}>
                        {act.priority}
                      </span>
                      {computed.indicator && (
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 500, padding: '2px 6px', borderRadius: '4px',
                          background: overdue ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
                          color: overdue ? '#f87171' : 'var(--text-secondary)'
                        }}>
                          {computed.indicator}
                        </span>
                      )}
                    </div>

                    {/* Assignee + Deadline */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {act.assignee ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.625rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                          }} title={act.assignee}>
                            {act.assignee.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90px' }}>
                            {act.assignee.split(' ').slice(-1)[0]}
                          </span>
                        </div>
                      ) : <span />}
                      {act.deadline && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.6875rem', color: overdue ? '#f87171' : 'var(--text-secondary)', flexShrink: 0 }}>
                          <Calendar size={11} />
                          <span>{formatDate(act.deadline)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {colActs.length > 3 && (
                <div style={{
                  marginTop: '4px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  border: '1px dashed rgba(255,255,255,0.1)'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    +{colActs.length - 3} hoạt động khác
                  </span>
                  <button
                    onClick={() => onViewAll?.(status)}
                    style={{
                      background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer',
                      fontSize: '0.75rem', fontWeight: 600, color: '#818cf8',
                      padding: '4px 10px', borderRadius: '6px', transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
                  >
                    Xem tất cả
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Activities Page ─────────────────────────────────────────────────────
export function Activities() {
  const { activities, projects, addActivity, updateActivity, deleteActivity, addProject, updateProject, deleteProject } = useData();

  // Navigation state
  const [pageView, setPageView] = useState<PageView>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null); // null = all projects in kanban

  // Modals
  const [modalMode, setModalMode] = useState<ModalMode>('none');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [viewAllStatus, setViewAllStatus] = useState<Status | null>(null);

  // Kanban sub-state
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);

  // ── Derived data ────────────────────────────────────────────────────────────
  const filteredActivities = selectedProjectId
    ? activities.filter(a => a.projectId === selectedProjectId)
    : activities;

  const currentProject = selectedProjectId
    ? projects.find(p => p.id === selectedProjectId)
    : null;

  const getProjectName = (id: string) =>
    projects.find(p => p.id === id)?.name || 'Không có dự án';

  const getProjectActivities = (pid: string) =>
    activities.filter(a => a.projectId === pid);

  // ── Activity handlers ───────────────────────────────────────────────────────
  const handleCreateActivity = (newAct: Omit<Activity, 'id'>) => {
    addActivity(newAct);
    setModalMode('none');
  };

  const handleUpdateActivity = (updates: Omit<Activity, 'id'>) => {
    if (selectedActivity) {
      updateActivity(selectedActivity.id, updates);
      setSelectedActivity({ ...selectedActivity, ...updates });
    }
    setModalMode('detail');
  };

  const handleDeleteActivity = (id: string) => {
    deleteActivity(id);
    setModalMode('none');
    setSelectedActivity(null);
  };

  // ── Project handlers ────────────────────────────────────────────────────────
  const handleSaveProject = (data: Omit<Project, 'id'>) => {
    if (editingProject) {
      updateProject(editingProject.id, data);
    } else {
      addProject(data);
    }
    setModalMode('none');
    setEditingProject(null);
  };

  const handleDeleteProject = (pid: string) => {
    deleteProject(pid);
    if (selectedProjectId === pid) {
      setSelectedProjectId(null);
      setPageView('projects');
    }
  };

  // ── Open project detail ─────────────────────────────────────────────────────
  const openProject = (pid: string) => {
    setSelectedProjectId(pid);
    setPageView('kanban');
    setViewMode('board');
  };

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('activityId', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    setDragOverCol(status);
  };
  const onDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (related && (e.currentTarget as Node).contains(related)) return;
    setDragOverCol(null);
  };
  const onDrop = (e: React.DragEvent, targetStatus: Status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('activityId');
    if (id) updateActivity(id, { status: targetStatus });
    setDragOverCol(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="kanban-page">

      {/* ── HEADER ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Back button when inside a project */}
          {pageView !== 'projects' && (
            <button
              onClick={() => { setPageView('projects'); setSelectedProjectId(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.8125rem', transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'}
            >
              <ChevronLeft size={15} /> Dự án
            </button>
          )}
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1px' }}>
              {pageView === 'projects'
                ? 'Quản lý hoạt động'
                : currentProject
                  ? currentProject.name
                  : 'Tất cả dự án'}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {pageView === 'projects'
                ? `${projects.length} dự án · ${activities.length} hoạt động`
                : `${filteredActivities.length} hoạt động trong dự án này`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {pageView === 'projects' && (
            <Button
              variant="secondary"
              icon={<FolderOpen size={15} />}
              onClick={() => { setEditingProject(null); setModalMode('newProject'); }}
            >
              Tạo dự án mới
            </Button>
          )}

          {pageView !== 'projects' && (
            <>
              {/* View toggle */}
              <div style={{ display: 'flex', padding: '3px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {(['board', 'list'] as const).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    style={{
                      padding: '6px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                      background: viewMode === mode ? '#6366f1' : 'transparent',
                      color: viewMode === mode ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                    }}>
                    {mode === 'board' ? <LayoutGrid size={15} /> : <ListIcon size={15} />}
                  </button>
                ))}
              </div>
              <Button icon={<Plus size={15} />} onClick={() => setModalMode('create')}>
                Tạo hoạt động
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── PROJECT GRID VIEW ─────────────────────────────── */}
      {pageView === 'projects' && (
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
          {projects.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '1rem', padding: '4rem 2rem', textAlign: 'center',
              border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '16px',
            }}>
              <FolderOpen size={40} style={{ color: 'rgba(255,255,255,0.15)' }} />
              <div>
                <p style={{ fontWeight: 600, marginBottom: '4px' }}>Chưa có dự án nào</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Tạo dự án mới hoặc sử dụng Workflow để tạo tự động từ template.
                </p>
              </div>
              <Button icon={<Plus size={15} />} onClick={() => { setEditingProject(null); setModalMode('newProject'); }}>
                Tạo dự án đầu tiên
              </Button>
            </div>
          ) : (
            <>
              {/* Quick stats */}
              <div style={{ display: 'flex', gap: '0.875rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Tổng dự án', value: projects.length, icon: <FolderOpen size={16} />, color: '#818cf8' },
                  { label: 'Tổng hoạt động', value: activities.length, icon: <ListIcon size={16} />, color: '#60a5fa' },
                  { label: 'Sắp đến hạn', value: activities.filter(a => getDeadlineIndicator(a).indicator === 'Sắp đến hạn').length, icon: <Clock size={16} />, color: '#fbbf24' },
                  { label: 'Quá hạn', value: activities.filter(a => getDeadlineIndicator(a).indicator === 'Quá hạn').length, icon: <AlertCircle size={16} />, color: '#f87171' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: 'rgba(22,32,52,0.8)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px', padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 160px',
                  }}>
                    <div style={{ color: stat.color }}>{stat.icon}</div>
                    <div>
                      <p style={{ fontSize: '1.125rem', fontWeight: 700, lineHeight: 1 }}>{stat.value}</p>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Project grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem',
              }}>
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

      {/* ── PROJECT FILTER TABS (above kanban) ─────────────── */}
      {pageView !== 'projects' && (
        <div style={{
          display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '0.875rem',
        }}>
          <button
            onClick={() => { setSelectedProjectId(null); setPageView('projects'); }}
            style={{
              padding: '5px 14px', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 500,
              cursor: 'pointer', border: '1px solid',
              borderColor: selectedProjectId === null ? '#6366f1' : 'rgba(255,255,255,0.1)',
              background: selectedProjectId === null ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: selectedProjectId === null ? '#818cf8' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            Tất cả dự án
          </button>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              style={{
                padding: '5px 14px', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 500,
                cursor: 'pointer', border: '1px solid',
                borderColor: selectedProjectId === p.id ? '#6366f1' : 'rgba(255,255,255,0.1)',
                background: selectedProjectId === p.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: selectedProjectId === p.id ? '#818cf8' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {p.name}
              <span style={{ marginLeft: '6px', fontSize: '0.6875rem', opacity: 0.6 }}>
                {getProjectActivities(p.id).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── KANBAN BOARD ──────────────────────────────────── */}
      {pageView !== 'projects' && viewMode === 'board' && selectedProjectId !== null && (
        <KanbanBoard
          filteredActivities={filteredActivities}
          allActivities={activities}
          onOpenDetail={act => { setSelectedActivity(act); setModalMode('detail'); }}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          dragOverCol={dragOverCol}
          getProjectName={getProjectName}
          showProjectName={selectedProjectId === null}
          onViewAll={setViewAllStatus}
        />
      )}

      {/* ── LIST VIEW ─────────────────────────────────────── */}
      {pageView !== 'projects' && viewMode === 'list' && selectedProjectId !== null && (
        <div style={{ flex: 1, overflow: 'auto', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(30,41,59,0.6)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
                {['Tên hoạt động', ...(selectedProjectId === null ? ['Dự án'] : []), 'Phụ trách', 'Deadline', 'Trạng thái'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Chưa có hoạt động nào trong dự án này.</td></tr>
              ) : filteredActivities.map(act => {
                const computed = getDeadlineIndicator(act);
                const overdue = computed.isOverdue;
                return (
                  <tr key={act.id} onClick={() => { setSelectedActivity(act); setModalMode('detail'); }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{act.name}</td>
                    {selectedProjectId === null && (
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{getProjectName(act.projectId)}</td>
                    )}
                    <td style={{ padding: '12px 16px' }}>{act.assignee || '—'}</td>
                    <td style={{ padding: '12px 16px', color: overdue ? '#f87171' : 'var(--text-secondary)' }}>{act.deadline || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <Badge status={act.status} />
                        {computed.indicator && <span style={{ fontSize: '0.625rem', color: overdue ? '#f87171' : 'var(--text-secondary)' }}>({computed.indicator})</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODALS ────────────────────────────────────────── */}
      <Modal isOpen={modalMode === 'create'} onClose={() => setModalMode('none')} title="Tạo hoạt động mới">
        <ActivityForm
          initialData={selectedProjectId ? { projectId: selectedProjectId } as Partial<Activity> as Activity : undefined}
          onSubmit={handleCreateActivity}
          onCancel={() => setModalMode('none')}
        />
      </Modal>

      <Modal
        isOpen={modalMode === 'detail' && !!selectedActivity}
        onClose={() => { setModalMode('none'); setSelectedActivity(null); }}
        title="Chi tiết hoạt động"
      >
        {selectedActivity && (
          <ActivityDetail
            activity={selectedActivity}
            onEdit={() => setModalMode('edit')}
            onDelete={() => handleDeleteActivity(selectedActivity.id)}
            onClose={() => { setModalMode('none'); setSelectedActivity(null); }}
          />
        )}
      </Modal>

      <Modal
        isOpen={modalMode === 'edit' && !!selectedActivity}
        onClose={() => setModalMode('detail')}
        title="Chỉnh sửa hoạt động"
      >
        {selectedActivity && (
          <ActivityForm
            initialData={selectedActivity}
            onSubmit={handleUpdateActivity}
            onCancel={() => setModalMode('detail')}
          />
        )}
      </Modal>

      <Modal
        isOpen={modalMode === 'newProject' || modalMode === 'editProject'}
        onClose={() => { setModalMode('none'); setEditingProject(null); }}
        title={editingProject ? 'Chỉnh sửa dự án' : 'Tạo dự án mới'}
      >
        <ProjectForm
          initialData={editingProject || undefined}
          onSubmit={handleSaveProject}
          onCancel={() => { setModalMode('none'); setEditingProject(null); }}
        />
      </Modal>

      <Modal
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        title="Xóa dự án?"
      >
        {deletingProject && (
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Tất cả hoạt động thuộc dự án này cũng sẽ bị xóa. Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="secondary" onClick={() => setDeletingProject(null)}>
                Hủy
              </Button>
              <Button
                onClick={() => {
                  handleDeleteProject(deletingProject.id);
                  setDeletingProject(null);
                }}
                style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
              >
                Xóa dự án
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!viewAllStatus}
        onClose={() => setViewAllStatus(null)}
        title={`${viewAllStatus} - ${filteredActivities.filter(a => a.status === viewAllStatus).length} hoạt động`}
      >
        {viewAllStatus && (
          <div style={{ maxHeight: '65vh', overflowY: 'auto', padding: '0.5rem 0' }} className="hide-scrollbar">
            <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(30,41,59,0.4)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
                    {['Tên hoạt động', ...(selectedProjectId === null ? ['Dự án'] : []), 'Phụ trách', 'Deadline', 'Trạng thái'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.filter(a => a.status === viewAllStatus).map(act => {
                    const computed = getDeadlineIndicator(act);
                    const overdue = computed.isOverdue;
                    return (
                      <tr key={act.id} onClick={() => { setSelectedActivity(act); setModalMode('detail'); }}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span>{act.name}</span>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', width: 'fit-content', ...PRIORITY_STYLE[act.priority] }}>
                              {act.priority}
                            </span>
                          </div>
                        </td>
                        {selectedProjectId === null && (
                          <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{getProjectName(act.projectId)}</td>
                        )}
                        <td style={{ padding: '10px 14px' }}>{act.assignee || '—'}</td>
                        <td style={{ padding: '10px 14px', color: overdue ? '#f87171' : 'var(--text-secondary)' }}>{act.deadline || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            <Badge status={act.status} />
                            {computed.indicator && <span style={{ fontSize: '0.625rem', color: overdue ? '#f87171' : 'var(--text-secondary)' }}>({computed.indicator})</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="secondary" onClick={() => setViewAllStatus(null)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
