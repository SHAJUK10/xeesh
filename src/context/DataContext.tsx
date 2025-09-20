import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Project, Stage, CommentTask, GlobalComment, File, Task, Meeting, BrochureProject, BrochurePage, PageComment, Lead, STAGE_NAMES, DownloadHistory, User } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { supabase as externalSupabase } from '../superBaseClient';

interface DataContextType {
  projects: Project[];
  stages: Stage[];
  commentTasks: CommentTask[];
  globalComments: GlobalComment[];
  users: User[];
  files: File[];
  tasks: Task[];
  meetings: Meeting[];
  brochureProjects: BrochureProject[];
  brochurePages: BrochurePage[];
  pageComments: PageComment[];
  leads: Lead[];
  downloadHistory: DownloadHistory[];
  createProject: (project: Omit<Project, 'id' | 'created_at'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addCommentTask: (data: Omit<CommentTask, 'id' | 'timestamp'>) => void;
  addGlobalComment: (data: Omit<GlobalComment, 'id' | 'timestamp'>) => void;
  updateCommentTaskStatus: (taskId: string, status: 'open' | 'in-progress' | 'done') => void;
  updateStageApproval: (stageId: string, status: 'approved' | 'rejected', comment?: string) => void;
  uploadFile: (fileData: Omit<File, 'id' | 'timestamp'>) => void;
  uploadFileFromInput: (stageId: string, file: globalThis.File, uploaderName: string) => void;
  updateStageProgress: (stageId: string, progress: number) => void;
  scheduleMeeting: (meeting: Omit<Meeting, 'id'>) => void;
  createTask: (task: Omit<Task, 'id' | 'created_at'>) => void;
  updateTaskStatus: (taskId: string, status: 'open' | 'in-progress' | 'done') => void;
  createBrochureProject: (clientId: string, clientName: string) => string;
  updateBrochureProject: (id: string, updates: Partial<BrochureProject>) => void;
  saveBrochurePage: (pageData: Omit<BrochurePage, 'id' | 'created_at' | 'updated_at'>) => void;
  getBrochurePages: (projectId: string) => BrochurePage[];
  addPageComment: (comment: Omit<PageComment, 'id' | 'timestamp'>) => void;
  getPageComments: (pageId: string) => PageComment[];
  markCommentDone: (commentId: string) => void;
  downloadFile: (fileId: string) => void;
  downloadMultipleFiles: (fileIds: string[]) => void;
  getDownloadHistory: () => DownloadHistory[];
  updateFileMetadata: (fileId: string, metadata: Partial<File>) => void;
  createLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  approveBrochurePage: (pageId: string, status: 'approved' | 'rejected', comment?: string) => void;
  getBrochureProjectsForReview: () => BrochureProject[];
  lockBrochurePage: (pageId: string) => void;
  unlockBrochurePage: (pageId: string) => void;
  createUserAccount: (params: { email: string; password: string; full_name: string; role: 'employee' | 'client' }) => Promise<{ id: string } | null>;
  refreshUsers: () => Promise<void>;
  loadProjects: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Supabase client
let supabase: SupabaseClient | null = externalSupabase;

// Enhanced mock data with Indian names
const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Website for Xee Design',
    description: 'Complete website redesign and development for Xee Design agency with modern UI/UX, responsive design, and CMS integration',
    client_id: '3',
    client_name: 'Priya Sharma',
    deadline: '2025-03-15',
    progress_percentage: 65,
    assigned_employees: ['2', '4'],
    created_at: '2025-01-01',
    status: 'active',
    priority: 'high'
  },
  {
    id: '2',
    title: 'E-commerce Mobile App',
    description: 'Native mobile application for online shopping with payment gateway integration and inventory management',
    client_id: '5',
    client_name: 'Rajesh Kumar',
    deadline: '2025-04-30',
    progress_percentage: 30,
    assigned_employees: ['2'],
    created_at: '2025-01-10',
    status: 'active',
    priority: 'medium'
  }
];

const mockStages: Stage[] = [
  {
    id: '1',
    project_id: '1',
    name: 'Planning',
    notes: 'Project requirements gathering, wireframes, and technical specifications completed',
    progress_percentage: 100,
    approval_status: 'approved',
    files: [],
    comments: [],
    order: 0
  },
  {
    id: '2',
    project_id: '1',
    name: 'Design',
    notes: 'UI/UX design mockups and prototypes ready for client review',
    progress_percentage: 90,
    approval_status: 'pending',
    files: [],
    comments: [],
    order: 1
  },
  {
    id: '3',
    project_id: '1',
    name: 'Development',
    notes: 'Frontend development in progress, backend API integration started',
    progress_percentage: 45,
    approval_status: 'pending',
    files: [],
    comments: [],
    order: 2
  }
];

const mockCommentTasks: CommentTask[] = [
  {
    id: '1',
    stage_id: '2',
    project_id: '1',
    text: 'Please update the color scheme to match our brand guidelines. The current blue is too dark.',
    added_by: '3',
    author_name: 'Priya Sharma',
    author_role: 'client',
    status: 'open',
    assigned_to: '2',
    timestamp: '2025-01-15T10:30:00Z'
  },
  {
    id: '2',
    stage_id: '3',
    project_id: '1',
    text: 'Need to implement responsive design for mobile devices',
    added_by: '1',
    author_name: 'Arjun Singh',
    author_role: 'manager',
    status: 'in-progress',
    assigned_to: '2',
    deadline: '2025-02-01',
    timestamp: '2025-01-12T14:20:00Z'
  },
  {
    id: '3',
    stage_id: '3',
    project_id: '1',
    text: 'Database optimization completed, performance improved by 40%',
    added_by: '2',
    author_name: 'Rakesh Gupta',
    author_role: 'employee',
    status: 'done',
    timestamp: '2025-01-14T16:45:00Z'
  }
];

const mockFiles: File[] = [
  {
    id: '1',
    stage_id: '1',
    project_id: '1',
    filename: 'project-requirements.pdf',
    file_url: '#',
    uploaded_by: '1',
    uploader_name: 'Arjun Singh',
    timestamp: '2025-01-02T09:00:00Z',
    size: 2048576,
    file_type: 'pdf',
    category: 'requirements',
    description: 'Initial project requirements and specifications',
    download_count: 5,
    last_downloaded: '2025-01-15T14:30:00Z',
    last_downloaded_by: '2',
    is_archived: false,
    tags: ['requirements', 'initial', 'specifications']
  },
  {
    id: '2',
    stage_id: '2',
    project_id: '1',
    filename: 'design-mockups.fig',
    file_url: '#',
    uploaded_by: '2',
    uploader_name: 'Rakesh Gupta',
    timestamp: '2025-01-08T11:15:00Z',
    size: 5242880,
    file_type: 'fig',
    category: 'assets',
    description: 'Figma design mockups for homepage and key pages',
    download_count: 3,
    last_downloaded: '2025-01-14T16:20:00Z',
    last_downloaded_by: '3',
    is_archived: false,
    tags: ['design', 'mockups', 'figma']
  }
];

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [stages, setStages] = useState<Stage[]>(mockStages);
  const [commentTasks, setCommentTasks] = useState<CommentTask[]>(mockCommentTasks);
  const [globalComments, setGlobalComments] = useState<GlobalComment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [files, setFiles] = useState<File[]>(mockFiles);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [brochureProjects, setBrochureProjects] = useState<BrochureProject[]>([]);
  const [brochurePages, setBrochurePages] = useState<BrochurePage[]>([]);
  const [pageComments, setPageComments] = useState<PageComment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>([]);

  const createUserAccount = async (params: { email: string; password: string; full_name: string; role: 'employee' | 'client' }) => {
    if (!supabase) {
      alert('User creation requires Supabase to be configured.');
      return null;
    }
    const { email, password, full_name, role } = params;
    const signup = await supabase.auth.signUp({ email, password });
    if (signup.error || !signup.data.user) {
      alert(signup.error?.message || 'Failed to create user');
      return null;
    }
    const userId = signup.data.user.id;
    const { error: upsertErr } = await supabase.from('profiles').upsert({ id: userId, full_name, role, email });
    if (upsertErr) {
      alert(upsertErr.message);
      return null;
    }
    setUsers(prev => [...prev, { id: userId, name: full_name, email, role } as User]);
    return { id: userId };
  };

  const refreshUsers = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('profiles').select('id, full_name, role, email');
    if (!error && data) {
      const mapped: User[] = (data as any[]).map(p => ({ id: p.id, name: p.full_name || p.email || 'User', email: p.email || '', role: p.role }));
      setUsers(mapped);
    }
  };

  const loadProjects = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:profiles!projects_client_id_fkey(full_name)
        `);
      
      if (!error && data) {
        const mappedProjects: Project[] = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description || '',
          client_id: p.client_id,
          client_name: p.client?.full_name || 'Unknown Client',
          deadline: p.deadline,
          progress_percentage: p.progress_percentage,
          assigned_employees: p.assigned_employees || [],
          created_at: p.created_at,
          status: p.status,
          priority: p.priority
        }));
        setProjects(mappedProjects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  useEffect(() => {
    refreshUsers();
    loadProjects();
    
    // Set up real-time subscriptions
    if (supabase) {
      const projectsSubscription = supabase
        .channel('projects')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
          loadProjects();
        })
        .subscribe();

      const profilesSubscription = supabase
        .channel('profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          refreshUsers();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(projectsSubscription);
        supabase.removeChannel(profilesSubscription);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-generate stages for new projects
  useEffect(() => {
    const existingProjectIds = new Set(stages.map(s => s.project_id));
    const newProjects = projects.filter(p => !existingProjectIds.has(p.id));
    
    if (newProjects.length > 0) {
      const newStages: Stage[] = [];
      newProjects.forEach(project => {
        STAGE_NAMES.forEach((stageName, index) => {
          newStages.push({
            id: uuidv4(),
            project_id: project.id,
            name: stageName,
            notes: '',
            progress_percentage: 0,
            approval_status: 'pending',
            files: [],
            comments: [],
            order: index
          });
        });
      });
      setStages(prev => [...prev, ...newStages]);
    }
  }, [projects]);

  const downloadFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file || !user) return;

    // Update download count and last downloaded info
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { 
            ...f, 
            download_count: f.download_count + 1,
            last_downloaded: new Date().toISOString(),
            last_downloaded_by: user.id
          }
        : f
    ));

    // Add to download history
    const historyEntry: DownloadHistory = {
      id: uuidv4(),
      file_id: fileId,
      downloaded_by: user.id,
      downloader_name: user.name,
      download_date: new Date().toISOString(),
      file_name: file.filename,
      file_size: file.size
    };
    setDownloadHistory(prev => [...prev, historyEntry]);

    // Trigger actual download
    const link = document.createElement('a');
    link.href = file.file_url;
    link.download = file.filename;
    link.click();
  };

  const downloadMultipleFiles = (fileIds: string[]) => {
    if (!user) return;

    const filesToDownload = files.filter(f => fileIds.includes(f.id));
    
    // In a real implementation, this would create a zip file on the server
    // For now, we'll download files individually
    filesToDownload.forEach(file => {
      setTimeout(() => downloadFile(file.id), 100);
    });
  };

  const getDownloadHistory = (): DownloadHistory[] => {
    return downloadHistory
      .filter(entry => {
        const file = files.find(f => f.id === entry.file_id);
        if (!file) return false;
        
        // Filter based on user role and project access
        if (user?.role === 'manager') return true;
        if (user?.role === 'employee') {
          const project = projects.find(p => p.id === file.project_id);
          return project?.assigned_employees.includes(user.id);
        }
        return false;
      })
      .sort((a, b) => new Date(b.download_date).getTime() - new Date(a.download_date).getTime());
  };

  const updateFileMetadata = (fileId: string, metadata: Partial<File>) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, ...metadata } : f
    ));
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'created_at'>) => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            title: projectData.title,
            description: projectData.description,
            client_id: projectData.client_id,
            deadline: projectData.deadline,
            progress_percentage: projectData.progress_percentage,
            assigned_employees: projectData.assigned_employees,
            status: projectData.status,
            priority: projectData.priority
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating project:', error);
          throw error;
        }

        // Create default stages for the new project
        if (data) {
          const stageInserts = STAGE_NAMES.map((stageName, index) => ({
            project_id: data.id,
            name: stageName,
            notes: '',
            progress_percentage: 0,
            approval_status: 'pending',
            order: index
          }));

          await supabase.from('stages').insert(stageInserts);
        }

        // Refresh projects to get the updated list
        await loadProjects();
      } catch (error) {
        console.error('Error creating project:', error);
        throw error;
      }
    } else {
      // Fallback to local state if Supabase is not available
      const newProject: Project = {
        ...projectData,
        id: uuidv4(),
        created_at: new Date().toISOString()
      };
      setProjects(prev => [...prev, newProject]);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('projects')
          .update({
            title: updates.title,
            description: updates.description,
            client_id: updates.client_id,
            deadline: updates.deadline,
            progress_percentage: updates.progress_percentage,
            assigned_employees: updates.assigned_employees,
            status: updates.status,
            priority: updates.priority
          })
          .eq('id', id);

        if (error) {
          console.error('Error updating project:', error);
          throw error;
        }

        // Refresh projects to get the updated list
        await loadProjects();
      } catch (error) {
        console.error('Error updating project:', error);
        throw error;
      }
    } else {
      // Fallback to local state if Supabase is not available
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  };

  const addCommentTask = async (data: Omit<CommentTask, 'id' | 'timestamp'>) => {
    const newCommentTask: CommentTask = {
      ...data,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };
    setCommentTasks(prev => [...prev, newCommentTask]);
    if (supabase) await supabase.from('comment_tasks').insert(newCommentTask);
  };

  const addGlobalComment = async (data: Omit<GlobalComment, 'id' | 'timestamp'>) => {
    const newGlobalComment: GlobalComment = {
      ...data,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };
    setGlobalComments(prev => [...prev, newGlobalComment]);
    if (supabase) await supabase.from('global_comments').insert(newGlobalComment);
  };

  const updateCommentTaskStatus = async (taskId: string, status: 'open' | 'in-progress' | 'done') => {
    setCommentTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status } : task
    ));
    if (supabase) await supabase.from('comment_tasks').update({ status }).eq('id', taskId);
  };

  const updateStageApproval = async (stageId: string, status: 'approved' | 'rejected', comment?: string) => {
    setStages(prev => prev.map(s => 
      s.id === stageId ? { ...s, approval_status: status } : s
    ));
    if (supabase) await supabase.from('stages').update({ approval_status: status }).eq('id', stageId);
    
    if (comment) {
      const stage = stages.find(s => s.id === stageId);
      if (stage) {
        await addCommentTask({
          stage_id: stageId,
          project_id: stage.project_id,
          text: comment,
          added_by: 'client',
          author_name: 'Client',
          author_role: 'client',
          status: 'open'
        });
      }
    }
  };

  const uploadFile = async (fileData: Omit<File, 'id' | 'timestamp'>) => {
    const newFile: File = {
      ...fileData,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };
    setFiles(prev => [...prev, newFile]);
    if (supabase) await supabase.from('files').insert(newFile);
  };

  // Fix for FileManager component - handle File object upload
  const uploadFileFromInput = (stageId: string, file: globalThis.File, uploaderName: string) => {
    const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    const newFile: File = {
      id: uuidv4(),
      stage_id: stageId,
      project_id: stages.find(s => s.id === stageId)?.project_id || '',
      filename: file.name,
      file_url: URL.createObjectURL(file),
      uploaded_by: user?.id || '',
      uploader_name: uploaderName,
      timestamp: new Date().toISOString(),
      size: file.size,
      file_type: fileType,
      category: 'other',
      description: '',
      download_count: 0,
      is_archived: false,
      tags: []
    };
    setFiles(prev => [...prev, newFile]);
  };

  const updateStageProgress = async (stageId: string, progress: number) => {
    setStages(prev => prev.map(s => 
      s.id === stageId ? { ...s, progress_percentage: progress } : s
    ));
    if (supabase) await supabase.from('stages').update({ progress_percentage: progress }).eq('id', stageId);
  };

  const scheduleMeeting = async (meetingData: Omit<Meeting, 'id'>) => {
    const newMeeting: Meeting = {
      ...meetingData,
      id: uuidv4()
    };
    setMeetings(prev => [...prev, newMeeting]);
    if (supabase) await supabase.from('meetings').insert(newMeeting);
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'created_at'>) => {
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    setTasks(prev => [...prev, newTask]);
    if (supabase) await supabase.from('tasks').insert(newTask);
  };

  const updateTaskStatus = async (taskId: string, status: 'open' | 'in-progress' | 'done') => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status } : task
    ));
    if (supabase) await supabase.from('tasks').update({ status }).eq('id', taskId);
  };

  const createBrochureProject = (clientId: string, clientName: string): string => {
    const newProject: BrochureProject = {
      id: uuidv4(),
      client_id: clientId,
      client_name: clientName,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pages: []
    };
    setBrochureProjects(prev => [...prev, newProject]);
    // Optionally persist in Supabase table 'brochure_projects'
    if (supabase) supabase.from('brochure_projects').insert(newProject);
    return newProject.id;
  };

  const updateBrochureProject = async (id: string, updates: Partial<BrochureProject>) => {
    setBrochureProjects(prev => prev.map(project => 
      project.id === id ? { ...project, ...updates, updated_at: new Date().toISOString() } : project
    ));
    if (supabase) await supabase.from('brochure_projects').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  };

  const saveBrochurePage = async (pageData: Omit<BrochurePage, 'id' | 'created_at' | 'updated_at'>) => {
    const existingPageIndex = brochurePages.findIndex(
      page => page.project_id === pageData.project_id && page.page_number === pageData.page_number
    );

    if (existingPageIndex >= 0) {
      // Update existing page
      setBrochurePages(prev => prev.map((page, index) => 
        index === existingPageIndex 
          ? { ...page, content: pageData.content, updated_at: new Date().toISOString() }
          : page
      ));
      if (supabase) await supabase.from('brochure_pages').update({ content: pageData.content, updated_at: new Date().toISOString() }).eq('id', brochurePages[existingPageIndex].id);
    } else {
      // Create new page
      const newPage: BrochurePage = {
        ...pageData,
        approval_status: pageData.approval_status ?? 'pending',
        is_locked: pageData.is_locked ?? false,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setBrochurePages(prev => [...prev, newPage]);
      if (supabase) await supabase.from('brochure_pages').insert(newPage);
    }
  };

  const getBrochurePages = (projectId: string): BrochurePage[] => {
    return brochurePages
      .filter(page => page.project_id === projectId)
      .sort((a, b) => a.page_number - b.page_number);
  };

  const addPageComment = async (commentData: Omit<PageComment, 'id' | 'timestamp'>) => {
    const newComment: PageComment = {
      ...commentData,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };
    setPageComments(prev => [...prev, newComment]);
    if (supabase) await supabase.from('page_comments').insert(newComment);
  };

  const getPageComments = (pageId: string): PageComment[] => {
    return pageComments
      .filter(comment => comment.page_id === pageId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const markCommentDone = async (commentId: string) => {
    setPageComments(prev => prev.map(comment => 
      comment.id === commentId ? { ...comment, marked_done: true } : comment
    ));
    if (supabase) await supabase.from('page_comments').update({ marked_done: true }).eq('id', commentId);
  };

  const approveBrochurePage = (pageId: string, status: 'approved' | 'rejected', comment?: string) => {
    setBrochurePages(prev => prev.map(page => 
      page.id === pageId ? { ...page, approval_status: status, updated_at: new Date().toISOString() } : page
    ));
    
    // Add approval action comment
    const actionText = status === 'approved' 
      ? `Page has been approved by ${user?.name || 'Manager'}${comment ? `: ${comment}` : ''}`
      : `Page requires changes - ${user?.name || 'Manager'}${comment ? `: ${comment}` : ''}`;
    
    addPageComment({
      page_id: pageId,
      text: actionText,
      added_by: user?.id || '',
      author_name: user?.name || 'Manager',
      author_role: user?.role || 'manager',
      marked_done: false,
      action_type: 'approval'
    });
  };

  const getBrochureProjectsForReview = (): BrochureProject[] => {
    return brochureProjects.filter(project => 
      project.status === 'ready_for_design' || project.status === 'in_design'
    );
  };

  const createLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    const newLead: Lead = {
      ...leadData,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setLeads(prev => [...prev, newLead]);
    if (supabase) await supabase.from('leads').insert(newLead);
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id 
        ? { ...lead, ...updates, updated_at: new Date().toISOString() }
        : lead
    ));
    if (supabase) await supabase.from('leads').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  };

  const deleteLead = async (id: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
    if (supabase) await supabase.from('leads').delete().eq('id', id);
  };

  const lockBrochurePage = async (pageId: string) => {
    if (!user) return;
    
    setBrochurePages(prev => prev.map(page => 
      page.id === pageId 
        ? { 
            ...page, 
            is_locked: true,
            locked_by: user.id,
            locked_by_name: user.name,
            locked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        : page
    ));
    if (supabase) await supabase.from('brochure_pages').update({ is_locked: true, locked_by: user?.id, locked_by_name: user?.name, locked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', pageId);
  };

  const unlockBrochurePage = async (pageId: string) => {
    setBrochurePages(prev => prev.map(page => 
      page.id === pageId 
        ? { 
            ...page, 
            is_locked: false,
            locked_by: undefined,
            locked_by_name: undefined,
            locked_at: undefined,
            updated_at: new Date().toISOString()
          }
        : page
    ));
    if (supabase) await supabase.from('brochure_pages').update({ is_locked: false, locked_by: null, locked_by_name: null, locked_at: null, updated_at: new Date().toISOString() }).eq('id', pageId);
  };

  return (
    <DataContext.Provider value={{
      projects,
      stages,
      commentTasks,
      globalComments,
      users,
      files,
      tasks,
      meetings,
      brochureProjects,
      brochurePages,
      pageComments,
      leads,
      downloadHistory,
      createProject,
      updateProject,
      addCommentTask,
      addGlobalComment,
      updateCommentTaskStatus,
      updateStageApproval,
      uploadFile,
      uploadFileFromInput,
      updateStageProgress,
      scheduleMeeting,
      createTask,
      updateTaskStatus,
      createBrochureProject,
      updateBrochureProject,
      saveBrochurePage,
      getBrochurePages,
      addPageComment,
      getPageComments,
      markCommentDone,
      approveBrochurePage,
      getBrochureProjectsForReview,
      downloadFile,
      downloadMultipleFiles,
      getDownloadHistory,
      updateFileMetadata,
      createLead,
      updateLead,
      deleteLead,
      lockBrochurePage,
      unlockBrochurePage,
      createUserAccount,
      refreshUsers,
      loadProjects
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}