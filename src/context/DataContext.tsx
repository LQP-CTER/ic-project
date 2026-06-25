/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { initialProjects, initialActivities, initialContents, type Project, type Activity, type Content } from '../data/mockData';
import { sheetsApi } from '../lib/sheetsApi';
import toast from 'react-hot-toast';

const SHEETS = {
  PROJECTS: 'Projects',
  ACTIVITIES: 'Activities',
  CONTENTS: 'Contents',
};

interface DataContextType {
  projects: Project[];
  activities: Activity[];
  contents: Content[];
  loading: boolean;
  addProject: (p: Omit<Project, 'id'>) => Promise<string>;
  updateProject: (id: string, p: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addActivity: (a: Omit<Activity, 'id'>) => Promise<string>;
  updateActivity: (id: string, a: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  addContent: (c: Omit<Content, 'id'>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

const API_URL = import.meta.env.VITE_GOOGLE_SHEETS_API_URL?.trim();
const useApi = !!API_URL;

export function DataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [contents, setContents] = useState<Content[]>(initialContents);
  const [loading, setLoading] = useState(useApi);

  useEffect(() => {
    if (!useApi) return;
    sheetsApi.getAll()
      .then(data => {
        if (data.projects) setProjects(data.projects);
        if (data.activities) setActivities(data.activities);
        if (data.contents) setContents(data.contents);
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
        // Persist the client ID so activities can safely reference this project.
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
      }
    }
  }, []);

  const deleteContent = useCallback(async (id: string) => {
    setContents(prev => prev.filter(c => c.id !== id));
    if (useApi) {
      try {
        await sheetsApi.delete(SHEETS.CONTENTS, id);
      } catch {
        toast.error('Không thể xóa nội dung');
      }
    }
  }, []);

  return (
    <DataContext.Provider value={{
      projects, activities, contents, loading,
      addProject, updateProject, deleteProject,
      addActivity, updateActivity, deleteActivity,
      addContent, deleteContent,
    }}>
      {children}
    </DataContext.Provider>
  );
}
