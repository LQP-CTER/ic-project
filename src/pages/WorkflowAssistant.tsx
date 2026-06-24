import React, { useState } from 'react';
import { WORKFLOW_TEMPLATES, CATEGORY_COLORS, type WorkflowTemplate } from '../data/workflowTemplates';
import { useData } from '../context/DataContext';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Layers, Eye, Play, CheckCircle, X,
  ArrowRight, Sparkles, CalendarDays, User
} from 'lucide-react';

// ─── Template Card ────────────────────────────────────────────────────────────
function TemplateCard({
  template,
  onPreview,
  onCreateProject,
}: {
  template: WorkflowTemplate;
  onPreview: (t: WorkflowTemplate) => void;
  onCreateProject: (t: WorkflowTemplate) => void;
}) {
  const catColor = CATEGORY_COLORS[template.category] || CATEGORY_COLORS['Truyền thông nội bộ'];

  return (
    <div style={{
      background: 'rgba(22,32,52,0.8)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      transition: 'border-color 0.2s, transform 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'rgba(99,102,241,0.35)';
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'rgba(255,255,255,0.07)';
        el.style.transform = 'translateY(0)';
      }}
    >
      {/* Category badge */}
      <span style={{
        display: 'inline-block',
        fontSize: '0.6875rem', fontWeight: 600,
        padding: '3px 10px', borderRadius: '999px',
        alignSelf: 'flex-start',
        background: catColor.bg, color: catColor.text,
        border: `1px solid ${catColor.border}`,
      }}>
        {template.category}
      </span>

      {/* Name */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
          {template.name}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
          {template.description}
        </p>
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <Layers size={13} style={{ color: '#818cf8' }} />
          <span>{template.steps.length} hoạt động</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <Clock size={13} style={{ color: '#818cf8' }} />
          <span>~{template.estimatedWeeks} tuần</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.25rem' }}>
        <button
          onClick={() => onPreview(template)}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 500,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'}
        >
          <Eye size={14} /> Xem quy trình
        </button>
        <button
          onClick={() => onCreateProject(template)}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600,
            background: '#6366f1', border: 'none',
            color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px', transition: 'background 0.15s',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#4f46e5'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#6366f1'}
        >
          <Play size={14} /> Tạo dự án
        </button>
      </div>
    </div>
  );
}

// ─── Preview Modal Content ─────────────────────────────────────────────────────
function WorkflowPreview({ template }: { template: WorkflowTemplate }) {
  const catColor = CATEGORY_COLORS[template.category] || CATEGORY_COLORS['Truyền thông nội bộ'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '0.6875rem', fontWeight: 600, padding: '3px 10px',
          borderRadius: '999px', background: catColor.bg,
          color: catColor.text, border: `1px solid ${catColor.border}`,
        }}>{template.category}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Layers size={12} /> {template.steps.length} bước
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> ~{template.estimatedWeeks} tuần
        </span>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginTop: '-0.5rem' }}>
        {template.description}
      </p>

      {/* Steps timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', paddingLeft: '8px' }}>
        {template.steps.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '14px', position: 'relative', paddingBottom: '16px' }}>
            {/* Timeline line */}
            {idx < template.steps.length - 1 && (
              <div style={{
                position: 'absolute', left: '11px', top: '24px',
                width: '2px', bottom: 0,
                background: 'rgba(99,102,241,0.2)',
              }} />
            )}

            {/* Step number circle */}
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(99,102,241,0.15)', border: '1.5px solid rgba(99,102,241,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6875rem', fontWeight: 700, color: '#818cf8', zIndex: 1,
            }}>
              {idx + 1}
            </div>

            {/* Step content */}
            <div style={{ flex: 1, paddingTop: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '3px' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>{step.name}</p>
                <span style={{
                  background: step.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : step.priority === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  color: step.priority === 'High' ? '#EF4444' : step.priority === 'Medium' ? '#F59E0B' : '#22C55E',
                  padding: '2px 8px', borderRadius: '4px',
                  fontWeight: 500, fontSize: '0.625rem'
                }}>
                  {step.priority}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{step.description}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '5px' }}>
                {step.channel && (
                  <span style={{ fontSize: '0.6875rem', color: '#818cf8' }}>📡 {step.channel}</span>
                )}
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                  ⏱ {step.durationDays} ngày
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Create Project Form ───────────────────────────────────────────────────────
interface CreateProjectFormProps {
  template: WorkflowTemplate;
  onSuccess: (projectName: string) => void;
  onCancel: () => void;
}

function CreateProjectForm({ template, onSuccess, onCancel }: CreateProjectFormProps) {
  const { addProject, addActivity } = useData();
  const [form, setForm] = useState({
    name: template.name,
    assignee: '',
    startDate: new Date().toISOString().split('T')[0],
    deadline: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || isSubmitting) return;
    setIsSubmitting(true);

    const projectId = addProject({
      name: form.name,
      description: `Tạo từ template: ${template.name}`,
      assignee: form.assignee,
      startDate: form.startDate,
      deadline: form.deadline,
      status: 'Chưa bắt đầu',
      notes: '',
    });

    // Auto-generate activities from template steps
    const start = new Date(form.startDate || new Date());
    template.steps.forEach(step => {
      const stepStart = new Date(start);
      stepStart.setDate(stepStart.getDate() + step.daysFromStart);
      const stepDeadline = new Date(stepStart);
      stepDeadline.setDate(stepDeadline.getDate() + step.durationDays);

      addActivity({
        projectId,
        name: step.name,
        description: step.description,
        assignee: form.assignee,
        priority: step.priority,
        status: 'Chưa bắt đầu',
        startDate: stepStart.toISOString().split('T')[0],
        deadline: stepDeadline.toISOString().split('T')[0],
        channel: step.channel,
        attachmentLink: '',
        notes: '',
      });
    });

    setIsSubmitting(false);
    onSuccess(form.name);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Template info banner */}
      <div style={{
        padding: '12px 14px', borderRadius: '10px',
        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
        fontSize: '0.8125rem', color: '#818cf8',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <Sparkles size={14} />
        <span>
          Sẽ tự động tạo <strong>{template.steps.length} hoạt động</strong> từ template "{template.name}"
        </span>
      </div>

      <Input
        label="Tên dự án *"
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Ví dụ: EES 2026..."
        required
        autoFocus
      />
      <Input
        label="Người phụ trách"
        name="assignee"
        value={form.assignee}
        onChange={handleChange}
        placeholder="Ví dụ: Alex Nguyễn..."
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        <Input
          type="date"
          label="Ngày bắt đầu *"
          name="startDate"
          value={form.startDate}
          onChange={handleChange}
          required
        />
        <Input
          type="date"
          label="Ngày kết thúc"
          name="deadline"
          value={form.deadline}
          onChange={handleChange}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
        <Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Đang tạo...' : 'Tạo dự án'}
        </Button>
      </div>
    </form>
  );
}

// ─── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ projectName, onGoToActivities, onClose }: {
  projectName: string;
  onGoToActivities: () => void;
  onClose: () => void;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '50%',
        background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircle size={28} style={{ color: '#34d399' }} />
      </div>
      <div>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '6px' }}>Tạo dự án thành công!</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Dự án <strong style={{ color: '#f8fafc' }}>"{projectName}"</strong> đã được tạo thành công.
          <br />Các hoạt động đã được thêm vào danh sách công việc.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <Button variant="ghost" onClick={onClose}>Đóng</Button>
        <Button variant="primary" icon={<ArrowRight size={16} />} onClick={onGoToActivities}>
          Đi tới Activities
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
type ModalMode = 'none' | 'preview' | 'create' | 'success';

export function WorkflowAssistant() {
  const navigate = useNavigate();
  const [modalMode, setModalMode] = useState<ModalMode>('none');
  const [activeTemplate, setActiveTemplate] = useState<WorkflowTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [createdProjectName, setCreatedProjectName] = useState('');

  const openPreview = (t: WorkflowTemplate) => {
    setActiveTemplate(t);
    setModalMode('preview');
  };

  const openCreate = (t: WorkflowTemplate) => {
    setActiveTemplate(t);
    setModalMode('create');
  };

  const handleSuccess = (name: string) => {
    setCreatedProjectName(name);
    setModalMode('success');
  };

  const handleClose = () => {
    setModalMode('none');
    setActiveTemplate(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '6px' }}>
            Workflow Templates
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: '1.6' }}>
            Chọn một quy trình mẫu phù hợp, điền thông tin cơ bản và hệ thống sẽ tự động tạo toàn bộ hoạt động cho bạn.
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '0.8125rem', color: 'var(--text-secondary)',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          padding: '6px 14px', borderRadius: '999px',
        }}>
          <Layers size={14} />
          {WORKFLOW_TEMPLATES.length} templates có sẵn
        </div>
      </div>

      {/* ── TEMPLATE GRID ──────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.25rem',
      }}>
        {WORKFLOW_TEMPLATES.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onPreview={openPreview}
            onCreateProject={openCreate}
          />
        ))}
      </div>

      {/* ── PREVIEW MODAL ───────────────────────────────────── */}
      <Modal
        isOpen={modalMode === 'preview' && !!activeTemplate}
        onClose={handleClose}
        title={activeTemplate?.name || ''}
      >
        {activeTemplate && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <WorkflowPreview template={activeTemplate} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Button variant="ghost" onClick={handleClose}>Đóng</Button>
              <Button variant="primary" icon={<Play size={15} />} onClick={() => openCreate(activeTemplate)}>
                Tạo dự án từ template này
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── CREATE PROJECT MODAL ─────────────────────────────── */}
      <Modal
        isOpen={modalMode === 'create' && !!activeTemplate}
        onClose={handleClose}
        title={`Tạo dự án — ${activeTemplate?.name || ''}`}
      >
        {activeTemplate && (
          <CreateProjectForm
            template={activeTemplate}
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        )}
      </Modal>

      {/* ── SUCCESS MODAL ─────────────────────────────────────── */}
      <Modal
        isOpen={modalMode === 'success'}
        onClose={handleClose}
        title="Hoàn tất"
      >
        <SuccessScreen
          projectName={createdProjectName}
          onGoToActivities={() => navigate('/activities')}
          onClose={handleClose}
        />
      </Modal>
    </div>
  );
}
