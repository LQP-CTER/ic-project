import React, { createContext, useContext, useEffect, useState } from 'react';
import { initialProjects, initialActivities, initialContents, type Project, type Activity, type Content } from '../data/mockData';

interface DataContextType {
  projects: Project[];
  activities: Activity[];
  contents: Content[];
  addProject: (p: Omit<Project, 'id'>) => string;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addActivity: (a: Omit<Activity, 'id'>) => string;
  updateActivity: (id: string, a: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  addContent: (c: Omit<Content, 'id'>) => void;
  deleteContent: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('exhub_projects');
    return saved ? JSON.parse(saved) : initialProjects;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('exhub_activities');
    if (!saved) return initialActivities;
    // Migrate old schema (contentLink/designLink) to new (attachmentLink)
    const parsed = JSON.parse(saved);
    return parsed.map((a: Activity & { contentLink?: string; designLink?: string; priority?: string }) => {
      let migrated = { ...a };
      
      if ('contentLink' in a || 'designLink' in a) {
        const { contentLink, designLink, ...rest } = a as Activity & { contentLink: string; designLink: string };
        migrated = { ...rest, attachmentLink: contentLink || designLink || '' };
      }
      
      // Migrate priority
      if (migrated.priority === 'Ưu tiên cao') migrated.priority = 'High' as any;
      else if (migrated.priority === 'Ưu tiên trung bình') migrated.priority = 'Medium' as any;
      else if (migrated.priority === 'Ưu tiên thấp') migrated.priority = 'Low' as any;
      
      return migrated;
    });
  });

  const [contents, setContents] = useState<Content[]>(() => {
    const saved = localStorage.getItem('exhub_contents');
    if (!saved) return initialContents;
    const parsed = JSON.parse(saved);
    return parsed.map((c: any) => {
      const migrated = { ...c };
      if (migrated.type && !migrated.contentType) {
        migrated.contentType = migrated.type;
        delete migrated.type;
      }
      if (!migrated.projectId) migrated.projectId = '';
      if (!migrated.activityId) migrated.activityId = '';
      if (!migrated.prompt) migrated.prompt = '';

      if (c.prompt && c.result && !c.content) {
        // Migrate old content
        return {
          id: c.id,
          title: `Nội dung cũ (${migrated.contentType})`,
          projectId: '',
          projectName: 'Không xác định',
          activityId: '',
          activityName: 'Không xác định',
          contentType: migrated.contentType,
          prompt: c.prompt,
          content: `[Prompt: ${c.prompt}]\n\n${c.result}`,
          createdAt: c.createdAt,
        };
      }
      return migrated;
    });
  });

  useEffect(() => {
    localStorage.setItem('exhub_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('exhub_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('exhub_contents', JSON.stringify(contents));
  }, [contents]);

  const addProject = (p: Omit<Project, 'id'>) => {
    const id = 'p_' + Math.random().toString(36).substr(2, 9);
    setProjects(prev => [...prev, { ...p, id }]);
    return id;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    // Also delete associated activities
    setActivities(prev => prev.filter(a => a.projectId !== id));
  };

  const addActivity = (a: Omit<Activity, 'id'>) => {
    let migratedPriority = a.priority;
    if (migratedPriority === 'Ưu tiên cao' as any) migratedPriority = 'High';
    else if (migratedPriority === 'Ưu tiên trung bình' as any) migratedPriority = 'Medium';
    else if (migratedPriority === 'Ưu tiên thấp' as any) migratedPriority = 'Low';

    const id = 'a_' + Math.random().toString(36).substr(2, 9);
    setActivities(prev => [...prev, { ...a, priority: migratedPriority, id }]);
    return id;
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const addContent = (c: Omit<Content, 'id'>) => {
    const id = 'c_' + Math.random().toString(36).substr(2, 9);
    setContents(prev => [{ ...c, id }, ...prev]); // Add to top
  };

  const deleteContent = (id: string) => {
    setContents(prev => prev.filter(c => c.id !== id));
  };

  return (
    <DataContext.Provider value={{
      projects, activities, contents,
      addProject, updateProject, deleteProject,
      addActivity, updateActivity, deleteActivity,
      addContent, deleteContent
    }}>
      {children}
    </DataContext.Provider>
  );
};
