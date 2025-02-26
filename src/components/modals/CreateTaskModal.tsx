
// src/components/modals/CreateTaskModal.tsx
import React, { useState, useEffect } from 'react'
import {
  CheckCircle,
  X,
  AlertTriangle,
  Plus,
    Info, // Import the Info icon
    File, //NEW
    Download, //NEW
    Trash2
} from 'lucide-react'
import { taskService } from '../../services/TaskService'
import { projectService } from '../../services/ProjectService'
import { userManagementService } from '../../services/UserManagementService'
import { TaskSchema, TaskAction } from '../../types/firestore-schema'
import { systemSettingsService } from '../../services/SystemSettingsService'
import { actionTemplateService } from '../../services/ActionTemplateService';
import { deepCopy } from '../../utils/helpers';

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated: (task: TaskSchema) => void
  projectId?: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  projectId
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: projectId || '',
    assignedTo: '', // Changed to single string
    priority: 'medium' as TaskSchema['priority'],
    startDate: new Date().toISOString().split('T')[0], // Added start date
    dueDate: new Date().toISOString().split('T')[0],
    difficultyLevel: 5,
    actions: [] as TaskAction[]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [projects, setProjects] = useState<{ id: string, name: string }[]>([])
  const [users, setUsers] = useState<{ id: string, name: string }[]>([])
  const [coinsReward, setCoinsReward] = useState(0);
  const [templates, setTemplates] = useState<{ id: string, title: string }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedProjectName, setSelectedProjectName] = useState('');
    //NEW
    const [attachments, setAttachments] = useState<{ [actionId: string]: File[] }>({});


    useEffect(() => {
        if (!isOpen) {
            setFormData({
                title: '',
                description: '',
                projectId: projectId || '',
                assignedTo: '', // Reset to empty string
                priority: 'medium',
                startDate: new Date().toISOString().split('T')[0], // Reset start date
                dueDate: new Date().toISOString().split('T')[0],
                difficultyLevel: 5,
                actions: []
            });
            setError(null);
            setFormErrors({});
            setSelectedTemplate('');
            setSelectedProjectName('');
            setAttachments({}); // Reset attachments
        } else {
            setFormData(prev => ({ ...prev, projectId: projectId || '' }));
        }
    }, [isOpen, projectId]);

  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const [projectsRes, usersRes, settings, templatesRes] = await Promise.all([
            projectService.fetchProjects(),
            userManagementService.fetchUsers(),
            systemSettingsService.getSettings(),
            actionTemplateService.fetchActionTemplates()
          ]);

          setProjects(projectsRes.data.map(p => ({ id: p.id, name: p.name })));
          setUsers(usersRes.data.map(u => ({ id: u.id, name: u.name })));
          setCoinsReward(Math.round(settings.taskCompletionBase * formData.difficultyLevel * settings.complexityMultiplier));
          setTemplates(templatesRes.map(t => ({ id: t.id, title: t.title })));

          if (projectId) {
            const preselectedProject = projectsRes.data.find(p => p.id === projectId);
            if (preselectedProject) {
              setSelectedProjectName(preselectedProject.name);
            }
          }
        } catch (err) {
          setError('Failed to load data');
        }
      };

      loadData();
    }
  }, [isOpen, formData.difficultyLevel, projectId]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.title.trim()) errors.title = 'Título é obrigatório';
    if (!formData.description.trim()) errors.description = 'Descrição é obrigatória';
    if (!formData.projectId) errors.projectId = 'Projeto é obrigatório';
    if (!formData.assignedTo) errors.assignedTo = 'Um responsável é obrigatório'; // Validate single assignee
    if (!formData.startDate) errors.startDate = 'Data de início é obrigatória'; // Validate start date
    if (!formData.dueDate) errors.dueDate = 'Data de vencimento é obrigatória';
    setFormErrors(errors