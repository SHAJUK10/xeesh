import React, { useState, useEffect } from 'react';
import { Project, User } from '../../types';
import { X, Calendar, Users, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  users: User[]; // Renamed from employees to match broader context
  onSave?: (projectData: Partial<Project>) => Promise<void>; // Optional save callback
}

export function ProjectModal({ isOpen, onClose, project, users, onSave }: ProjectModalProps) {
  const { user } = useAuth();
  const { createProject, updateProject } = useData();
  
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    client_id: project?.client_id || '',
    client_name: project?.client_name || '',
    deadline: project?.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '', // Format as YYYY-MM-DD
    assigned_employees: project?.assigned_employees || [],
    priority: project?.priority || 'medium'
  });
  const [clients, setClients] = useState<User[]>([]);

  // Filter clients from users list
  useEffect(() => {
    const clientUsers = users.filter(u => u.role === 'client');
    setClients(clientUsers);
    
    // Set default client if none selected and clients available
    if (!formData.client_id && clientUsers.length > 0) {
      setFormData(prev => ({
        ...prev,
        client_id: clientUsers[0].id,
        client_name: clientUsers[0].name
      }));
    }
  }, [users, formData.client_id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const projectData = {
      title: formData.title,
      description: formData.description,
      client_id: formData.client_id,
      client_name: formData.client_name,
      deadline: formData.deadline,
      assigned_employees: formData.assigned_employees,
      priority: formData.priority,
      progress_percentage: project ? project.progress_percentage : 0,
      status: project ? project.status : 'active'
    };

    try {
      if (project && updateProject) {
        await updateProject(project.id, projectData);
      } else if (createProject && onSave) {
        await createProject(projectData); // Let DataContext handle timestamps
        await onSave(projectData); // Notify parent to refresh
      }
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
    }
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_employees: prev.assigned_employees.includes(employeeId)
        ? prev.assigned_employees.filter(id => id !== employeeId)
        : [...prev.assigned_employees, employeeId]
    }));
  };

  const handleClientChange = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_name: selectedClient?.name || ''
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {project ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Project Title
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
              Client
            </label>
            <select
              id="client"
              value={formData.client_id}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name} ({client.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
              Deadline
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                id="deadline"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {user?.role === 'manager' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Assign Employees
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {users.filter(u => u.role === 'employee').map(employee => (
                  <label key={employee.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.assigned_employees.includes(employee.id)}
                      onChange={() => handleEmployeeToggle(employee.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{employee.name} ({employee.email})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Project Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              disabled={!formData.title || !formData.client_id || !formData.deadline}
            >
              {project ? 'Update' : 'Create'} Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}