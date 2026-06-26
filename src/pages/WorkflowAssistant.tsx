import { useState } from 'react';
import { CATEGORY_COLORS, type WorkflowStep, type WorkflowTemplate } from '../data/workflowTemplates';
import { useData } from '../context/DataContext';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DEFAULT_STEP: WorkflowStep = {
  name: '',
  description: '',
  channel: 'GTalk',
  daysFromStart: 0,
  durationDays: 1,
  priority: 'Medium',
};

const DEFAULT_TEMPLATE: Omit<WorkflowTemplate, 'id'> = {
  name: '',
  description: '',
  category: 'Truyền thông nội bộ',
  estimatedWeeks: 1,
  steps: [{ ...DEFAULT_STEP }],
};

function TemplateCard({ template, onPreview, onCreateProject, onEdit, onDelete }: {
  template: WorkflowTemplate;
  onPreview: (t: WorkflowTemplate) => void;
  onCreateProject: (t: WorkflowTemplate) => void;
  onEdit: (t: WorkflowTemplate) => void;
  onDelete: (t: WorkflowTemplate) => void;
}) {
  const catColor = CATEGORY_COLORS[template.category] || CATEGORY_COLORS['Truyền thông nội bộ'];

  return (
    <div className="professional-card rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold w-fit border"
          style={{ background: catColor.bg, color: catColor.text, borderColor: catColor.border }}>
          {template.category}
        </span>
        <div className="workflow-card-actions">
          <button onClick={() => onEdit(template)}>Sửa</button>
          <button onClick={() => onDelete(template)}>Xóa</button>
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold text-text-primary mb-1.5">{template.name}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{template.description}</p>
      </div>

      <div className="flex gap-5 text-xs text-text-secondary">
        <span className="font-medium">{template.steps.length} hoạt động</span>
        <span>~{template.estimatedWeeks} tuần</span>
      </div>

      <div className="flex gap-3 mt-auto">
        <button onClick={() => onPreview(template)}
          className="flex-1 py-2.5 rounded-xl bg-white border border-border text-sm font-bold text-text-primary hover:bg-slate-50 transition-colors">
          Xem quy trình
        </button>
        <button onClick={() => onCreateProject(template)}
          className="flex-1 py-2.5 rounded-xl bg-slate-950 text-white text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
          Tạo dự án
        </button>
      </div>
    </div>
  );
}

function WorkflowPreview({ template }: { template: WorkflowTemplate }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-text-secondary">{template.steps.length} bước</span>
        <span className="text-xs text-text-secondary">~{template.estimatedWeeks} tuần</span>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{template.description}</p>

      <div className="flex flex-col gap-0 pl-2">
        {template.steps.map((step, idx) => (
          <div key={`${step.name}-${idx}`} className="flex gap-4 relative pb-5">
            {idx < template.steps.length - 1 && (
              <div className="absolute left-[11px] top-6 w-0.5 bottom-0 bg-primary/20" />
            )}
            <div className="w-6 h-6 rounded-full bg-primary-light border-2 border-primary/40 flex items-center justify-center text-[11px] font-bold text-primary shrink-0 z-10">
              {idx + 1}
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-sm font-semibold text-text-primary">{step.name}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${step.priority === 'High' ? 'bg-danger-light text-danger' : step.priority === 'Medium' ? 'bg-warning-light text-warning' : 'bg-success-light text-success'}`}>
                  {step.priority}
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{step.description}</p>
              <div className="flex gap-3 mt-1.5 text-[11px] text-text-tertiary">
                {step.channel && <span>{step.channel}</span>}
                <span>Bắt đầu +{step.daysFromStart} ngày</span>
                <span>{step.durationDays} ngày</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkflowTemplateForm({ initialData, onSubmit, onCancel }: {
  initialData?: WorkflowTemplate;
  onSubmit: (template: Omit<WorkflowTemplate, 'id'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<WorkflowTemplate, 'id'>>({
    name: initialData?.name || DEFAULT_TEMPLATE.name,
    description: initialData?.description || DEFAULT_TEMPLATE.description,
    category: initialData?.category || DEFAULT_TEMPLATE.category,
    estimatedWeeks: initialData?.estimatedWeeks || DEFAULT_TEMPLATE.estimatedWeeks,
    steps: initialData?.steps?.length ? initialData.steps : [{ ...DEFAULT_STEP }],
  });
  const [isSaving, setIsSaving] = useState(false);

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    setForm(prev => ({
      ...prev,
      steps: prev.steps.map((step, idx) => idx === index ? { ...step, ...updates } : step),
    }));
  };

  const addStep = () => {
    setForm(prev => ({ ...prev, steps: [...prev.steps, { ...DEFAULT_STEP, daysFromStart: prev.steps.length * 2 }] }));
  };

  const removeStep = (index: number) => {
    setForm(prev => ({ ...prev, steps: prev.steps.filter((_, idx) => idx !== index) }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleaned = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim() || 'Truyền thông nội bộ',
      estimatedWeeks: Number(form.estimatedWeeks) || 1,
      steps: form.steps
        .map(step => ({
          ...step,
          name: step.name.trim(),
          description: step.description.trim(),
          channel: step.channel.trim(),
          daysFromStart: Number(step.daysFromStart) || 0,
          durationDays: Math.max(Number(step.durationDays) || 1, 1),
        }))
        .filter(step => step.name),
    };

    if (!cleaned.name) {
      toast.error('Vui lòng nhập tên template');
      return;
    }
    if (cleaned.steps.length === 0) {
      toast.error('Template cần ít nhất một hoạt động');
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit(cleaned);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="workflow-template-form">
      <div className="form-section-card">
        <div className="form-section-head">
          <p className="eyebrow">Template</p>
          <h3>Thông tin quy trình mẫu</h3>
        </div>
        <Input label="Tên template *" value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} />
        <Textarea label="Mô tả" value={form.description} onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))} rows={3} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Danh mục" value={form.category} onChange={event => setForm(prev => ({ ...prev, category: event.target.value }))} />
          <Input type="number" min={1} label="Số tuần ước tính" value={form.estimatedWeeks} onChange={event => setForm(prev => ({ ...prev, estimatedWeeks: Number(event.target.value) }))} />
        </div>
      </div>

      <div className="workflow-steps-editor">
        <div className="workflow-steps-head">
          <div>
            <p className="eyebrow">Steps</p>
            <h3>Hoạt động sẽ được tạo tự động</h3>
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={addStep}>Thêm step</Button>
        </div>

        {form.steps.map((step, index) => (
          <div key={index} className="workflow-step-editor-card">
            <div className="workflow-step-editor-head">
              <strong>Step {index + 1}</strong>
              {form.steps.length > 1 && <button type="button" onClick={() => removeStep(index)}>Xóa</button>}
            </div>
            <Input label="Tên hoạt động *" value={step.name} onChange={event => updateStep(index, { name: event.target.value })} />
            <Textarea label="Mô tả" value={step.description} onChange={event => updateStep(index, { description: event.target.value })} rows={2} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Kênh" value={step.channel} onChange={event => updateStep(index, { channel: event.target.value })} />
              <Select label="Ưu tiên" value={step.priority} onChange={event => updateStep(index, { priority: event.target.value as WorkflowStep['priority'] })}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input type="number" min={0} label="Ngày bắt đầu từ project" value={step.daysFromStart} onChange={event => updateStep(index, { daysFromStart: Number(event.target.value) })} />
              <Input type="number" min={1} label="Thời lượng ngày" value={step.durationDays} onChange={event => updateStep(index, { durationDays: Number(event.target.value) })} />
            </div>
          </div>
        ))}
      </div>

      <div className="modal-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>Hủy</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu template'}</Button>
      </div>
    </form>
  );
}

function CreateProjectForm({ template, onSuccess, onCancel }: {
  template: WorkflowTemplate;
  onSuccess: (name: string) => void;
  onCancel: () => void;
}) {
  const { addProject, addActivities } = useData();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || isSubmitting) return;
    setIsSubmitting(true);

    const projectId = await addProject({
      name: form.name,
      description: `Tạo từ template: ${template.name}`,
      assignee: form.assignee,
      startDate: form.startDate,
      deadline: form.deadline,
      status: 'Chưa bắt đầu',
      notes: '',
      objective: '',
      audience: '',
      keyMessage: '',
      cta: '',
      channels: template.steps.map(step => step.channel).filter(Boolean).join(', '),
      toneOfVoice: '',
      stakeholder: '',
      successMetric: '',
      mandatoryInfo: '',
    });

    const start = new Date(form.startDate || new Date());
    const newActivities = template.steps.map((step, index) => {
      const stepStart = new Date(start);
      stepStart.setDate(stepStart.getDate() + step.daysFromStart);
      const stepDeadline = new Date(stepStart);
      stepDeadline.setDate(stepDeadline.getDate() + step.durationDays);

      return {
        projectId,
        name: step.name,
        description: step.description,
        assignee: form.assignee,
        priority: step.priority,
        status: 'Chưa bắt đầu' as const,
        startDate: stepStart.toISOString().split('T')[0],
        deadline: stepDeadline.toISOString().split('T')[0],
        channel: step.channel,
        attachmentLink: '',
        notes: '',
        approver: '',
        reviewDueDate: '',
        reviewNotes: '',
        checklist: JSON.stringify([
          { id: `copy_${Date.now()}_${index}`, title: 'Chuẩn bị nội dung', done: false },
          { id: `review_${Date.now()}_${index}`, title: 'Gửi review', done: false },
          { id: `publish_${Date.now()}_${index}`, title: 'Hoàn tất / đăng tải', done: false },
        ]),
      };
    });

    if (newActivities.length > 0) {
      await addActivities(newActivities);
    }

    setIsSubmitting(false);
    toast.success(`Đã tạo dự án "${form.name}" với ${template.steps.length} hoạt động`);
    onSuccess(form.name);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="p-3 rounded-lg bg-primary-light border border-primary/20 text-xs text-primary font-medium">
        Sẽ tự động tạo <strong>{template.steps.length} hoạt động</strong> từ template "{template.name}"
      </div>
      <Input label="Tên dự án *" name="name" value={form.name} onChange={handleChange} required autoFocus />
      <Input label="Người phụ trách" name="assignee" value={form.assignee} onChange={handleChange} />
      <div className="grid grid-cols-2 gap-4">
        <Input type="date" label="Ngày bắt đầu *" name="startDate" value={form.startDate} onChange={handleChange} required />
        <Input type="date" label="Ngày kết thúc" name="deadline" value={form.deadline} onChange={handleChange} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang tạo...' : 'Tạo dự án'}</Button>
      </div>
    </form>
  );
}

function SuccessScreen({ projectName, onGoToActivities, onClose }: {
  projectName: string;
  onGoToActivities: () => void;
  onClose: () => void;
}) {
  return (
    <div className="text-center py-4 flex flex-col items-center gap-4">
      <div className="rounded-2xl bg-success-light border border-emerald-200 px-4 py-2 text-sm font-extrabold text-success">Hoàn tất</div>
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-1">Tạo dự án thành công!</h3>
        <p className="text-sm text-text-secondary">Dự án <strong className="text-text-primary">"{projectName}"</strong> đã được tạo.</p>
      </div>
      <div className="flex gap-3 mt-2">
        <Button variant="ghost" onClick={onClose}>Đóng</Button>
        <Button onClick={onGoToActivities}>Đi tới Activities</Button>
      </div>
    </div>
  );
}

type ModalMode = 'none' | 'preview' | 'create' | 'success' | 'templateForm' | 'deleteTemplate';

export function WorkflowAssistant() {
  const navigate = useNavigate();
  const { workflowTemplates, addWorkflowTemplate, updateWorkflowTemplate, deleteWorkflowTemplate } = useData();
  const [modalMode, setModalMode] = useState<ModalMode>('none');
  const [activeTemplate, setActiveTemplate] = useState<WorkflowTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);
  const [createdProjectName, setCreatedProjectName] = useState('');

  const openPreview = (t: WorkflowTemplate) => { setActiveTemplate(t); setModalMode('preview'); };
  const openCreate = (t: WorkflowTemplate) => { setActiveTemplate(t); setModalMode('create'); };
  const openTemplateForm = (t?: WorkflowTemplate) => { setEditingTemplate(t || null); setModalMode('templateForm'); };
  const openDeleteTemplate = (t: WorkflowTemplate) => { setActiveTemplate(t); setModalMode('deleteTemplate'); };
  const handleSuccess = (name: string) => { setCreatedProjectName(name); setModalMode('success'); };
  const handleClose = () => { setModalMode('none'); setActiveTemplate(null); setEditingTemplate(null); };

  const handleSaveTemplate = async (template: Omit<WorkflowTemplate, 'id'>) => {
    try {
      if (editingTemplate) {
        await updateWorkflowTemplate(editingTemplate.id, template);
        toast.success('Đã cập nhật workflow template');
      } else {
        await addWorkflowTemplate(template);
        toast.success('Đã thêm workflow template');
      }
      handleClose();
    } catch {
      // DataContext already shows the user-facing error and rolls back optimistic state.
    }
  };

  const handleDeleteTemplate = async () => {
    if (!activeTemplate) return;
    try {
      await deleteWorkflowTemplate(activeTemplate.id);
      toast.success('Đã xóa workflow template');
      handleClose();
    } catch {
      // DataContext already shows the user-facing error and rolls back optimistic state.
    }
  };

  return (
    <div className="page-shell flex flex-col gap-8">
      <div className="page-header">
        <p className="page-subtitle !mt-0">
          Tạo, chỉnh sửa và sử dụng quy trình mẫu để tự động sinh project cùng toàn bộ hoạt động truyền thông.
        </p>
        <div className="workflow-header-actions">
          <span className="text-xs text-text-secondary bg-surface border border-border px-4 py-2 rounded-full font-medium">
            {workflowTemplates.length} templates có sẵn
          </span>
          <Button onClick={() => openTemplateForm()}>Thêm template</Button>
        </div>
      </div>

      {workflowTemplates.length === 0 ? (
        <div className="empty-state">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Chưa có workflow template</h3>
          <p className="text-sm text-text-secondary mb-6">Tạo template đầu tiên để chuẩn hóa quy trình truyền thông của team.</p>
          <Button onClick={() => openTemplateForm()}>Tạo template</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {workflowTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={openPreview}
              onCreateProject={openCreate}
              onEdit={openTemplateForm}
              onDelete={openDeleteTemplate}
            />
          ))}
        </div>
      )}

      <Modal isOpen={modalMode === 'preview' && !!activeTemplate} onClose={handleClose} title={activeTemplate?.name || ''} maxWidth="max-w-2xl">
        {activeTemplate && (
          <div className="flex flex-col gap-5">
            <WorkflowPreview template={activeTemplate} />
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="ghost" onClick={handleClose}>Đóng</Button>
              <Button variant="secondary" onClick={() => openTemplateForm(activeTemplate)}>Sửa template</Button>
              <Button onClick={() => openCreate(activeTemplate)}>Tạo dự án từ template này</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={modalMode === 'create' && !!activeTemplate} onClose={handleClose} title={`Tạo dự án — ${activeTemplate?.name || ''}`}>
        {activeTemplate && <CreateProjectForm template={activeTemplate} onSuccess={handleSuccess} onCancel={handleClose} />}
      </Modal>

      <Modal isOpen={modalMode === 'templateForm'} onClose={handleClose} title={editingTemplate ? 'Chỉnh sửa workflow template' : 'Thêm workflow template'} maxWidth="max-w-4xl">
        <WorkflowTemplateForm initialData={editingTemplate || undefined} onSubmit={handleSaveTemplate} onCancel={handleClose} />
      </Modal>

      <Modal isOpen={modalMode === 'deleteTemplate' && !!activeTemplate} onClose={handleClose} title="Xóa workflow template?">
        {activeTemplate && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              Template <strong className="text-text-primary">{activeTemplate.name}</strong> sẽ bị xóa khỏi workspace. Các project đã tạo từ template này không bị ảnh hưởng.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={handleClose}>Hủy</Button>
              <Button variant="danger" onClick={handleDeleteTemplate}>Xóa template</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={modalMode === 'success'} onClose={handleClose} title="Hoàn tất">
        <SuccessScreen projectName={createdProjectName} onGoToActivities={() => navigate('/activities')} onClose={handleClose} />
      </Modal>
    </div>
  );
}
