import { useState } from 'react';
import { WORKFLOW_TEMPLATES, CATEGORY_COLORS, type WorkflowTemplate } from '../data/workflowTemplates';
import { useData } from '../context/DataContext';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function TemplateCard({ template, onPreview, onCreateProject }: {
  template: WorkflowTemplate;
  onPreview: (t: WorkflowTemplate) => void;
  onCreateProject: (t: WorkflowTemplate) => void;
}) {
  const catColor = CATEGORY_COLORS[template.category] || CATEGORY_COLORS['Truyền thông nội bộ'];

  return (
    <div className="bg-surface rounded-xl border border-border p-6 flex flex-col gap-4 transition-all duration-200 hover:shadow-md hover:border-primary/30">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold w-fit border`}
        style={{ background: catColor.bg, color: catColor.text, borderColor: catColor.border }}>
        {template.category}
      </span>

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
          className="flex-1 py-2 rounded-lg bg-surface-secondary border border-border text-sm font-medium text-text-primary hover:bg-surface-tertiary transition-colors">
          Xem quy trình
        </button>
        <button onClick={() => onCreateProject(template)}
          className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm">
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
          <div key={idx} className="flex gap-4 relative pb-5">
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
                <span>{step.durationDays} ngày</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateProjectForm({ template, onSuccess, onCancel }: {
  template: WorkflowTemplate;
  onSuccess: (name: string) => void;
  onCancel: () => void;
}) {
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
    });

    const start = new Date(form.startDate || new Date());
    for (const step of template.steps) {
      const stepStart = new Date(start);
      stepStart.setDate(stepStart.getDate() + step.daysFromStart);
      const stepDeadline = new Date(stepStart);
      stepDeadline.setDate(stepDeadline.getDate() + step.durationDays);

      await addActivity({
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
      <div className="w-14 h-14 rounded-full bg-success-light border-2 border-success/40 flex items-center justify-center">
        <span className="text-success text-xl font-bold">&#10003;</span>
      </div>
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

type ModalMode = 'none' | 'preview' | 'create' | 'success';

export function WorkflowAssistant() {
  const navigate = useNavigate();
  const [modalMode, setModalMode] = useState<ModalMode>('none');
  const [activeTemplate, setActiveTemplate] = useState<WorkflowTemplate | null>(null);
  const [createdProjectName, setCreatedProjectName] = useState('');

  const openPreview = (t: WorkflowTemplate) => { setActiveTemplate(t); setModalMode('preview'); };
  const openCreate = (t: WorkflowTemplate) => { setActiveTemplate(t); setModalMode('create'); };
  const handleSuccess = (name: string) => { setCreatedProjectName(name); setModalMode('success'); };
  const handleClose = () => { setModalMode('none'); setActiveTemplate(null); };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1.5">Workflow Templates</h1>
          <p className="text-sm text-text-secondary max-w-lg leading-relaxed">
            Chọn một quy trình mẫu phù hợp, điền thông tin cơ bản và hệ thống sẽ tự động tạo toàn bộ hoạt động cho bạn.
          </p>
        </div>
        <span className="text-xs text-text-secondary bg-surface border border-border px-4 py-2 rounded-full font-medium">
          {WORKFLOW_TEMPLATES.length} templates có sẵn
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {WORKFLOW_TEMPLATES.map(template => (
          <TemplateCard key={template.id} template={template} onPreview={openPreview} onCreateProject={openCreate} />
        ))}
      </div>

      <Modal isOpen={modalMode === 'preview' && !!activeTemplate} onClose={handleClose} title={activeTemplate?.name || ''} maxWidth="max-w-2xl">
        {activeTemplate && (
          <div className="flex flex-col gap-5">
            <WorkflowPreview template={activeTemplate} />
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="ghost" onClick={handleClose}>Đóng</Button>
              <Button onClick={() => openCreate(activeTemplate)}>Tạo dự án từ template này</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={modalMode === 'create' && !!activeTemplate} onClose={handleClose} title={`Tạo dự án — ${activeTemplate?.name || ''}`}>
        {activeTemplate && <CreateProjectForm template={activeTemplate} onSuccess={handleSuccess} onCancel={handleClose} />}
      </Modal>

      <Modal isOpen={modalMode === 'success'} onClose={handleClose} title="Hoàn tất">
        <SuccessScreen projectName={createdProjectName} onGoToActivities={() => navigate('/activities')} onClose={handleClose} />
      </Modal>
    </div>
  );
}
