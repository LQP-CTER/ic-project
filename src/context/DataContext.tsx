/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  initialProjects,
  initialActivities,
  initialContents,
  initialUsers,
  initialStyleReferences,
  type Project,
  type Activity,
  type Content,
  type UserRecord,
  type StyleReference,
} from '../data/mockData';
import { WORKFLOW_TEMPLATES, type WorkflowTemplate, type WorkflowStep } from '../data/workflowTemplates';
import { sheetsApi } from '../lib/sheetsApi';
import toast from 'react-hot-toast';

const SHEETS = {
  PROJECTS: 'Projects',
  ACTIVITIES: 'Activities',
  CONTENTS: 'Contents',
  USERS: 'Users',
  WORKFLOW_TEMPLATES: 'WorkflowTemplates',
  STYLE_REFERENCES: 'StyleReferences',
};

interface DataContextType {
  projects: Project[];
  activities: Activity[];
  contents: Content[];
  users: UserRecord[];
  workflowTemplates: WorkflowTemplate[];
  styleReferences: StyleReference[];
  loading: boolean;
  addProject: (p: Omit<Project, 'id'>) => Promise<string>;
  updateProject: (id: string, p: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addActivity: (a: Omit<Activity, 'id'>) => Promise<string>;
  addActivities: (activities: Omit<Activity, 'id'>[]) => Promise<string[]>;
  updateActivity: (id: string, a: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  addContent: (c: Omit<Content, 'id'>) => Promise<string>;
  updateContent: (id: string, c: Partial<Content>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  addUser: (u: Omit<UserRecord, 'id'>) => Promise<string>;
  updateUser: (id: string, u: Partial<UserRecord>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addWorkflowTemplate: (template: Omit<WorkflowTemplate, 'id'>) => Promise<string>;
  updateWorkflowTemplate: (id: string, template: Partial<WorkflowTemplate>) => Promise<void>;
  deleteWorkflowTemplate: (id: string) => Promise<void>;
  addStyleReference: (reference: Omit<StyleReference, 'id'>) => Promise<string>;
  updateStyleReference: (id: string, reference: Partial<StyleReference>) => Promise<void>;
  deleteStyleReference: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

const API_URL = import.meta.env.VITE_GOOGLE_SHEETS_API_URL?.trim();
const useApi = !!API_URL;

function normalizeEmail(value: string) {
  return value.toLowerCase().trim();
}


const VALID_STATUSES = ['Chưa bắt đầu', 'Đang thực hiện', 'Chờ duyệt', 'Hoàn thành', 'Tạm dừng', 'Kết thúc'] as const;
const VALID_PRIORITIES = ['High', 'Medium', 'Low'] as const;

function cleanString(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeDateString(value: unknown) {
  const raw = cleanString(value);
  if (!raw) return '';
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return parsed.toISOString().split('T')[0];
  }
  return raw;
}

function normalizeStatus(value: unknown, fallback: Project['status'] = 'Chưa bắt đầu'): Project['status'] {
  const raw = cleanString(value);
  const compact = raw.toLowerCase().replace(/\s+/g, ' ');
  const aliases: Record<string, Project['status']> = {
    'todo': 'Chưa bắt đầu',
    'to do': 'Chưa bắt đầu',
    'backlog': 'Chưa bắt đầu',
    'chua bat dau': 'Chưa bắt đầu',
    'chưa bắt đầu': 'Chưa bắt đầu',
    'in progress': 'Đang thực hiện',
    'doing': 'Đang thực hiện',
    'dang thuc hien': 'Đang thực hiện',
    'đang thực hiện': 'Đang thực hiện',
    'review': 'Chờ duyệt',
    'in review': 'Chờ duyệt',
    'cho duyet': 'Chờ duyệt',
    'chờ duyệt': 'Chờ duyệt',
    'done': 'Hoàn thành',
    'completed': 'Hoàn thành',
    'complete': 'Hoàn thành',
    'hoan thanh': 'Hoàn thành',
    'hoàn thành': 'Hoàn thành',
    'paused': 'Tạm dừng',
    'tam dung': 'Tạm dừng',
    'tạm dừng': 'Tạm dừng',
    'closed': 'Kết thúc',
    'ended': 'Kết thúc',
    'ket thuc': 'Kết thúc',
    'kết thúc': 'Kết thúc',
  };
  const direct = VALID_STATUSES.find(status => status === raw);
  return direct || aliases[compact] || fallback;
}

function normalizePriority(value: unknown): Activity['priority'] {
  const raw = cleanString(value);
  const direct = VALID_PRIORITIES.find(priority => priority === raw);
  if (direct) return direct;
  const lower = raw.toLowerCase();
  if (lower.includes('high') || lower.includes('cao')) return 'High';
  if (lower.includes('low') || lower.includes('thấp') || lower.includes('thap')) return 'Low';
  return 'Medium';
}

function hasAnyValue(raw: Record<string, unknown>, fields: string[]) {
  return fields.some(field => cleanString(raw[field]));
}

function normalizeProject(rawProject: Partial<Project>): Project | null {
  const raw = rawProject as Record<string, unknown>;
  if (!hasAnyValue(raw, ['id', 'name', 'description', 'assignee', 'deadline', 'status'])) return null;
  return {
    id: cleanString(rawProject.id) || `p_${Math.random().toString(36).slice(2, 9)}`,
    name: cleanString(rawProject.name) || 'Dự án chưa đặt tên',
    description: cleanString(rawProject.description),
    assignee: cleanString(rawProject.assignee),
    startDate: normalizeDateString(rawProject.startDate),
    deadline: normalizeDateString(rawProject.deadline),
    status: normalizeStatus(rawProject.status),
    notes: cleanString(rawProject.notes),
    objective: cleanString(rawProject.objective),
    audience: cleanString(rawProject.audience),
    keyMessage: cleanString(rawProject.keyMessage),
    cta: cleanString(rawProject.cta),
    channels: cleanString(rawProject.channels),
    toneOfVoice: cleanString(rawProject.toneOfVoice),
    stakeholder: cleanString(rawProject.stakeholder),
    successMetric: cleanString(rawProject.successMetric),
    mandatoryInfo: cleanString(rawProject.mandatoryInfo),
  };
}

function normalizeActivity(rawActivity: Partial<Activity>): Activity | null {
  const raw = rawActivity as Record<string, unknown>;
  if (!hasAnyValue(raw, ['id', 'projectId', 'name', 'assignee', 'deadline', 'status'])) return null;
  return {
    id: cleanString(rawActivity.id) || `a_${Math.random().toString(36).slice(2, 9)}`,
    projectId: cleanString(rawActivity.projectId),
    name: cleanString(rawActivity.name) || 'Hoạt động chưa đặt tên',
    description: cleanString(rawActivity.description),
    assignee: cleanString(rawActivity.assignee),
    startDate: normalizeDateString(rawActivity.startDate),
    deadline: normalizeDateString(rawActivity.deadline),
    priority: normalizePriority(rawActivity.priority),
    status: normalizeStatus(rawActivity.status),
    channel: cleanString(rawActivity.channel),
    attachmentLink: cleanString(rawActivity.attachmentLink),
    notes: cleanString(rawActivity.notes),
    approver: cleanString(rawActivity.approver),
    reviewDueDate: normalizeDateString(rawActivity.reviewDueDate),
    reviewNotes: cleanString(rawActivity.reviewNotes),
    checklist: cleanString(rawActivity.checklist),
  };
}

function normalizeContent(rawContent: Partial<Content>): Content | null {
  const raw = rawContent as Record<string, unknown>;
  if (!hasAnyValue(raw, ['id', 'title', 'content', 'contentType', 'projectName', 'activityName'])) return null;
  const rawStatus = cleanString(rawContent.status);
  const allowedStatuses: NonNullable<Content['status']>[] = ['Draft', 'In review', 'Approved', 'Published', 'Archived'];
  return {
    id: cleanString(rawContent.id) || `c_${Math.random().toString(36).slice(2, 9)}`,
    title: cleanString(rawContent.title) || 'Nội dung chưa đặt tên',
    contentType: cleanString(rawContent.contentType) || 'Khác',
    projectId: cleanString(rawContent.projectId),
    projectName: cleanString(rawContent.projectName),
    activityId: cleanString(rawContent.activityId),
    activityName: cleanString(rawContent.activityName),
    prompt: cleanString(rawContent.prompt),
    content: cleanString(rawContent.content),
    createdAt: cleanString(rawContent.createdAt) || new Date().toISOString(),
    status: allowedStatuses.includes(rawStatus as NonNullable<Content['status']>) ? rawStatus as Content['status'] : 'Draft',
    approver: cleanString(rawContent.approver),
    reviewNotes: cleanString(rawContent.reviewNotes),
    publishedAt: normalizeDateString(rawContent.publishedAt),
  };
}

function normalizeArray<TInput, TOutput>(items: TInput[] | undefined, normalizer: (item: TInput) => TOutput | null): TOutput[] {
  return Array.isArray(items) ? items.map(normalizer).filter((item): item is TOutput => Boolean(item)) : [];
}
function normalizeUser(rawUser: Partial<UserRecord>): UserRecord {
  const email = normalizeEmail(String(rawUser.email || ''));
  return {
    id: rawUser.id ? String(rawUser.id) : email,
    email,
    name: String(rawUser.name || email.split('@')[0] || 'Người dùng'),
    role: rawUser.role === 'admin' ? 'admin' : 'member',
  };
}

function parseTemplateSteps(value: unknown): WorkflowStep[] {
  if (Array.isArray(value)) return value as WorkflowStep[];
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as WorkflowStep[] : [];
  } catch {
    return [];
  }
}

function normalizeWorkflowTemplate(rawTemplate: Partial<WorkflowTemplate> & { steps?: unknown }): WorkflowTemplate {
  return {
    id: String(rawTemplate.id || `wf_${Math.random().toString(36).slice(2, 9)}`),
    name: String(rawTemplate.name || 'Template mới'),
    description: String(rawTemplate.description || ''),
    category: String(rawTemplate.category || 'Truyền thông nội bộ'),
    estimatedWeeks: Number(rawTemplate.estimatedWeeks || 1),
    steps: parseTemplateSteps(rawTemplate.steps),
  };
}

function serializeWorkflowTemplate(template: WorkflowTemplate | Partial<WorkflowTemplate>) {
  return {
    ...template,
    steps: JSON.stringify(template.steps || []),
  };
}

function normalizeBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value ?? '').toLowerCase().trim();
  return !['false', '0', 'no', 'inactive', ''].includes(normalized);
}

function normalizeStyleReference(rawReference: Partial<StyleReference>): StyleReference {
  return {
    id: String(rawReference.id || `style_${Math.random().toString(36).slice(2, 9)}`),
    title: String(rawReference.title || 'Bài mẫu mới'),
    channel: String(rawReference.channel || 'GTalk'),
    purpose: String(rawReference.purpose || 'General'),
    tone: String(rawReference.tone || ''),
    content: String(rawReference.content || ''),
    isActive: normalizeBoolean(rawReference.isActive),
    createdAt: String(rawReference.createdAt || new Date().toISOString()),
  };
}

function serializeStyleReference(reference: StyleReference | Partial<StyleReference>) {
  return {
    ...reference,
    isActive: reference.isActive === undefined ? undefined : String(reference.isActive),
  };
}
export function DataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(useApi ? [] : initialProjects);
  const [activities, setActivities] = useState<Activity[]>(useApi ? [] : initialActivities);
  const [contents, setContents] = useState<Content[]>(useApi ? [] : initialContents);
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplate[]>(WORKFLOW_TEMPLATES);
  const [styleReferences, setStyleReferences] = useState<StyleReference[]>(initialStyleReferences);
  const [loading, setLoading] = useState(useApi);

  useEffect(() => {
    if (!useApi) return;
    sheetsApi.getAll()
      .then(data => {
        if (Array.isArray(data.projects)) setProjects(normalizeArray(data.projects, normalizeProject));
        if (Array.isArray(data.activities)) setActivities(normalizeArray(data.activities, normalizeActivity));
        if (Array.isArray(data.contents)) setContents(normalizeArray(data.contents, normalizeContent));
        if (data.users) setUsers(data.users.map(normalizeUser).filter((user: UserRecord) => user.email));
        if (Array.isArray(data.workflowTemplates) && data.workflowTemplates.length > 0) {
          setWorkflowTemplates(data.workflowTemplates.map(normalizeWorkflowTemplate));
        }
        if (Array.isArray(data.styleReferences) && data.styleReferences.length > 0) {
          setStyleReferences(data.styleReferences.map(normalizeStyleReference).filter((reference: StyleReference) => reference.content.trim()));
        }
      })
      .catch(err => {
        console.error('Failed to load data from sheets:', err);
        toast.error('Không thể tải dữ liệu từ Google Sheets');
      })
      .finally(() => setLoading(false));
  }, []);

  const addProject = useCallback(async (p: Omit<Project, 'id'>) => {
    const id = 'p_' + Math.random().toString(36).substr(2, 9);
    const newProject = { ...p, id };
    setProjects(prev => [...prev, newProject]);
    if (useApi) {
      try {
        await sheetsApi.add(SHEETS.PROJECTS, newProject);
      } catch {
        setProjects(prev => prev.filter(project => project.id !== id));
        toast.error('Không thể lưu dự án lên Google Sheets');
      }
    }
    return id;
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    if (useApi) {
      try {
        await sheetsApi.update(SHEETS.PROJECTS, id, updates);
      } catch {
        toast.error('Không thể cập nhật dự án');
      }
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setActivities(prev => prev.filter(a => a.projectId !== id));
    if (useApi) {
      try {
        await sheetsApi.delete(SHEETS.PROJECTS, id);
        await sheetsApi.deleteRelated(SHEETS.ACTIVITIES, 'projectId', id);
      } catch {
        toast.error('Không thể xóa dự án');
      }
    }
  }, []);

  const addActivity = useCallback(async (a: Omit<Activity, 'id'>) => {
    const id = 'a_' + Math.random().toString(36).substr(2, 9);
    const newActivity = { ...a, id };
    setActivities(prev => [...prev, newActivity]);
    if (useApi) {
      try {
        await sheetsApi.add(SHEETS.ACTIVITIES, newActivity);
      } catch {
        setActivities(prev => prev.filter(activity => activity.id !== id));
        toast.error('Không thể lưu hoạt động');
      }
    }
    return id;
  }, []);

  const addActivities = useCallback(async (activities: Omit<Activity, 'id'>[]) => {
    const newActivities = activities.map(a => ({ ...a, id: 'a_' + Math.random().toString(36).substr(2, 9) }));
    setActivities(prev => [...prev, ...newActivities]);
    if (useApi) {
      // Fire and forget sequentially to avoid Google Apps Script concurrency issues
      (async () => {
        for (const newActivity of newActivities) {
          try {
            await sheetsApi.add(SHEETS.ACTIVITIES, newActivity);
          } catch {
            setActivities(prev => prev.filter(a => a.id !== newActivity.id));
            toast.error('Không thể lưu hoạt động: ' + newActivity.name);
          }
        }
      })();
    }
    return newActivities.map(a => a.id);
  }, []);

  const updateActivity = useCallback(async (id: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    if (useApi) {
      try {
        await sheetsApi.update(SHEETS.ACTIVITIES, id, updates);
      } catch {
        toast.error('Không thể cập nhật hoạt động');
      }
    }
  }, []);

  const deleteActivity = useCallback(async (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    if (useApi) {
      try {
        await sheetsApi.delete(SHEETS.ACTIVITIES, id);
      } catch {
        toast.error('Không thể xóa hoạt động');
      }
    }
  }, []);

  const addContent = useCallback(async (c: Omit<Content, 'id'>) => {
    const id = 'c_' + Math.random().toString(36).substr(2, 9);
    const newContent = { ...c, id };
    setContents(prev => [newContent, ...prev]);
    if (useApi) {
      try {
        await sheetsApi.add(SHEETS.CONTENTS, newContent);
      } catch {
        setContents(prev => prev.filter(content => content.id !== id));
        toast.error('Không thể lưu nội dung');
        throw new Error('Failed to add content');
      }
    }
    return id;
  }, []);

  const updateContent = useCallback(async (id: string, updates: Partial<Content>) => {
    const previousContents = contents;
    setContents(prev => prev.map(content => content.id === id ? { ...content, ...updates } : content));
    if (useApi) {
      try {
        await sheetsApi.update(SHEETS.CONTENTS, id, updates);
      } catch {
        setContents(previousContents);
        toast.error('Không thể cập nhật nội dung');
        throw new Error('Failed to update content');
      }
    }
  }, [contents]);

  const deleteContent = useCallback(async (id: string) => {
    const previousContents = contents;
    setContents(prev => prev.filter(c => c.id !== id));
    if (useApi) {
      try {
        await sheetsApi.delete(SHEETS.CONTENTS, id);
      } catch {
        setContents(previousContents);
        toast.error('Không thể xóa nội dung');
        throw new Error('Failed to delete content');
      }
    }
  }, [contents]);

  const addUser = useCallback(async (u: Omit<UserRecord, 'id'>) => {
    const newUser = normalizeUser({ ...u, id: normalizeEmail(u.email) });
    const previousUsers = users;

    if (!newUser.email) throw new Error('Email is required');
    if (users.some(user => user.email === newUser.email)) {
      toast.error('Email này đã có quyền truy cập');
      throw new Error('Duplicate user email');
    }

    setUsers(prev => [...prev, newUser]);
    if (useApi) {
      try {
        await sheetsApi.add(SHEETS.USERS, newUser);
      } catch {
        setUsers(previousUsers);
        toast.error('Không thể thêm người dùng');
        throw new Error('Failed to add user');
      }
    }
    return newUser.id;
  }, [users]);

  const updateUser = useCallback(async (id: string, updates: Partial<UserRecord>) => {
    const nextId = updates.email ? normalizeEmail(updates.email) : id;
    const normalizedUpdates = {
      ...updates,
      ...(updates.email ? { email: normalizeEmail(updates.email), id: nextId } : {}),
      ...(updates.role ? { role: updates.role === 'admin' ? 'admin' as const : 'member' as const } : {}),
    };
    const previousUsers = users;

    if (normalizedUpdates.email && users.some(user => user.id !== id && user.email === normalizedUpdates.email)) {
      toast.error('Email này đã có quyền truy cập');
      throw new Error('Duplicate user email');
    }

    setUsers(prev => prev.map(user => user.id === id ? normalizeUser({ ...user, ...normalizedUpdates, id: nextId }) : user));
    if (useApi) {
      try {
        await sheetsApi.update(SHEETS.USERS, id, normalizedUpdates);
      } catch {
        setUsers(previousUsers);
        toast.error('Không thể cập nhật người dùng');
        throw new Error('Failed to update user');
      }
    }
  }, [users]);

  const deleteUser = useCallback(async (id: string) => {
    const previousUsers = users;
    setUsers(prev => prev.filter(user => user.id !== id));
    if (useApi) {
      try {
        await sheetsApi.delete(SHEETS.USERS, id);
      } catch {
        setUsers(previousUsers);
        toast.error('Không thể xóa người dùng');
        throw new Error('Failed to delete user');
      }
    }
  }, [users]);

  const addWorkflowTemplate = useCallback(async (template: Omit<WorkflowTemplate, 'id'>) => {
    const id = 'wf_' + Math.random().toString(36).substr(2, 9);
    const newTemplate = normalizeWorkflowTemplate({ ...template, id });
    setWorkflowTemplates(prev => [...prev, newTemplate]);
    if (useApi) {
      try {
        await sheetsApi.add(SHEETS.WORKFLOW_TEMPLATES, serializeWorkflowTemplate(newTemplate));
      } catch {
        setWorkflowTemplates(prev => prev.filter(item => item.id !== id));
        toast.error('Không thể lưu workflow template');
        throw new Error('Failed to add workflow template');
      }
    }
    return id;
  }, []);

  const updateWorkflowTemplate = useCallback(async (id: string, updates: Partial<WorkflowTemplate>) => {
    const previousTemplates = workflowTemplates;
    setWorkflowTemplates(prev => prev.map(template => template.id === id ? normalizeWorkflowTemplate({ ...template, ...updates, id }) : template));
    if (useApi) {
      try {
        await sheetsApi.update(SHEETS.WORKFLOW_TEMPLATES, id, serializeWorkflowTemplate(updates));
      } catch {
        setWorkflowTemplates(previousTemplates);
        toast.error('Không thể cập nhật workflow template');
        throw new Error('Failed to update workflow template');
      }
    }
  }, [workflowTemplates]);

  const deleteWorkflowTemplate = useCallback(async (id: string) => {
    const previousTemplates = workflowTemplates;
    setWorkflowTemplates(prev => prev.filter(template => template.id !== id));
    if (useApi) {
      try {
        await sheetsApi.delete(SHEETS.WORKFLOW_TEMPLATES, id);
      } catch {
        setWorkflowTemplates(previousTemplates);
        toast.error('Không thể xóa workflow template');
        throw new Error('Failed to delete workflow template');
      }
    }
  }, [workflowTemplates]);

  const addStyleReference = useCallback(async (reference: Omit<StyleReference, 'id'>) => {
    const id = 'style_' + Math.random().toString(36).substr(2, 9);
    const newReference = normalizeStyleReference({ ...reference, id });
    setStyleReferences(prev => [newReference, ...prev]);
    if (useApi) {
      try {
        await sheetsApi.add(SHEETS.STYLE_REFERENCES, serializeStyleReference(newReference));
      } catch {
        setStyleReferences(prev => prev.filter(item => item.id !== id));
        toast.error('Không thể lưu bài mẫu Team Voice');
        throw new Error('Failed to add style reference');
      }
    }
    return id;
  }, []);

  const updateStyleReference = useCallback(async (id: string, updates: Partial<StyleReference>) => {
    const previousReferences = styleReferences;
    setStyleReferences(prev => prev.map(reference => reference.id === id ? normalizeStyleReference({ ...reference, ...updates, id }) : reference));
    if (useApi) {
      try {
        await sheetsApi.update(SHEETS.STYLE_REFERENCES, id, serializeStyleReference(updates));
      } catch {
        setStyleReferences(previousReferences);
        toast.error('Không thể cập nhật bài mẫu Team Voice');
        throw new Error('Failed to update style reference');
      }
    }
  }, [styleReferences]);

  const deleteStyleReference = useCallback(async (id: string) => {
    const previousReferences = styleReferences;
    setStyleReferences(prev => prev.filter(reference => reference.id !== id));
    if (useApi) {
      try {
        await sheetsApi.delete(SHEETS.STYLE_REFERENCES, id);
      } catch {
        setStyleReferences(previousReferences);
        toast.error('Không thể xóa bài mẫu Team Voice');
        throw new Error('Failed to delete style reference');
      }
    }
  }, [styleReferences]);
  return (
    <DataContext.Provider value={{
      projects, activities, contents, users, workflowTemplates, styleReferences, loading,
      addProject, updateProject, deleteProject,
      addActivity, addActivities, updateActivity, deleteActivity,
      addContent, updateContent, deleteContent,
      addUser, updateUser, deleteUser,
      addWorkflowTemplate, updateWorkflowTemplate, deleteWorkflowTemplate,
      addStyleReference, updateStyleReference, deleteStyleReference,
    }}>
      {children}
    </DataContext.Provider>
  );
}
