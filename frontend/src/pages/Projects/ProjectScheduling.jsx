import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { projectScheduleAPI, projectsAPI } from '../../api';
import { Calendar, Plus, Edit2, Trash2, ArrowLeft, AlertCircle, CheckCircle2, Clock, Play, PauseCircle } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

const DEMO_TASKS = [
  { id: 1, task_code: 'SCH-001', task_name: 'Site Preparation & Demolition', task_description: 'Clear existing structure, hoardings, and prepare site', start_date: '2025-01-15', end_date: '2025-02-15', status: 'completed', priority: 'high', progress: 100, category: 'Pre-Construction' },
  { id: 2, task_code: 'SCH-002', task_name: 'Piling & Foundation Work', task_description: '48 nos bored piles (800mm dia, 85ft depth) + pile cap', start_date: '2025-02-16', end_date: '2025-04-30', status: 'completed', priority: 'high', progress: 100, category: 'Substructure' },
  { id: 3, task_code: 'SCH-003', task_name: 'Basement 1 & 2 Construction', task_description: 'RCC retaining walls, slabs, columns & MEP rough works', start_date: '2025-05-01', end_date: '2025-07-31', status: 'completed', priority: 'high', progress: 100, category: 'Substructure' },
  { id: 4, task_code: 'SCH-004', task_name: 'Ground to 4th Floor Structure', task_description: 'RCC column, beam, slab casting for ground to 4th floor', start_date: '2025-08-01', end_date: '2025-10-15', status: 'in_progress', priority: 'high', progress: 70, category: 'Superstructure' },
  { id: 5, task_code: 'SCH-005', task_name: '5th to 8th Floor Structure', task_description: 'RCC column, beam & slab casting for 5-8 floor', start_date: '2025-10-16', end_date: '2025-12-31', status: 'in_progress', priority: 'high', progress: 35, category: 'Superstructure' },
  { id: 6, task_code: 'SCH-006', task_name: '9th to 14th Floor Structure', task_description: 'Upper floors RCC work + rooftop slab', start_date: '2026-01-01', end_date: '2026-04-30', status: 'not_started', priority: 'medium', progress: 0, category: 'Superstructure' },
  { id: 7, task_code: 'SCH-007', task_name: 'External Brick Masonry & Plaster', task_description: 'All floor brickwork, external plaster & treatment', start_date: '2026-02-01', end_date: '2026-06-30', status: 'not_started', priority: 'medium', progress: 0, category: 'Finishes' },
  { id: 8, task_code: 'SCH-008', task_name: 'Internal Finishing & Fit-Out', task_description: 'Tiles, doors, windows, paint, furniture, and fixtures', start_date: '2026-05-01', end_date: '2026-08-30', status: 'not_started', priority: 'medium', progress: 0, category: 'Finishes' },
];

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', icon: Clock, color: 'bg-gray-50 text-gray-600 border-gray-200' },
  in_progress: { label: 'In Progress', icon: Play, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  on_hold: { label: 'On Hold', icon: PauseCircle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, color: 'bg-red-50 text-red-600 border-red-200' },
};

const PRIORITY_COLORS = { high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-gray-300' };

export default function ProjectScheduling() {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const initForm = () => ({
    project_id: projectId,
    task_name: '',
    task_description: '',
    category: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'not_started',
    priority: 'medium',
    progress: 0,
    notes: '',
  });
  const [formData, setFormData] = useState(initForm());

  useEffect(() => { loadAll(); }, [projectId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [taskRes, projRes] = await Promise.allSettled([
        projectScheduleAPI.getAll({ project_id: projectId }),
        projectsAPI.getOne(projectId),
      ]);
      if (taskRes.status === 'fulfilled' && taskRes.value?.data) {
        const raw = taskRes.value.data;
        const taskList = Array.isArray(raw.data) ? raw.data : (Array.isArray(raw.data?.data) ? raw.data.data : (Array.isArray(raw) ? raw : null));
        if (taskList !== null) {
          setTasks(taskList);
          setIsDemo(false);
        } else {
          setTasks(DEMO_TASKS);
          setIsDemo(true);
        }
      } else {
        setTasks(DEMO_TASKS);
        setIsDemo(true);
      }
      if (projRes.status === 'fulfilled' && projRes.value?.data) {
        setProject(projRes.value.data.data || projRes.value.data);
      }
    } catch {
      setTasks(DEMO_TASKS);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        project_id: projectId,
        progress: parseInt(formData.progress) || 0,
        end_date: formData.end_date || formData.start_date,
      };
      if (selectedTask) {
        await projectScheduleAPI.update(selectedTask.id, payload);
        toast.success('Task updated!');
      } else {
        await projectScheduleAPI.create(payload);
        toast.success('Task added to schedule!');
      }
      setIsModalOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await projectScheduleAPI.delete(selectedTask.id);
      toast.success('Task deleted');
      setIsDeleteOpen(false);
      loadAll();
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (t) => {
    setSelectedTask(t);
    setFormData({
      project_id: projectId,
      task_name: t.task_name || '',
      task_description: t.task_description || '',
      category: t.category || '',
      start_date: t.start_date || '',
      end_date: t.end_date || '',
      status: t.status || 'not_started',
      priority: t.priority || 'medium',
      progress: t.progress || 0,
      notes: t.notes || '',
    });
    setIsModalOpen(true);
  };

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const filteredTasks = filterStatus === 'all' ? safeTasks : safeTasks.filter((t) => t.status === filterStatus);
  const completedCount = safeTasks.filter((t) => t.status === 'completed').length;
  const avgProgress = safeTasks.length > 0 ? Math.round(safeTasks.reduce((s, t) => s + (parseInt(t.progress) || 0), 0) / safeTasks.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}`} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 bg-white">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
            <Calendar size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Project Scheduling</h1>
            <p className="text-sm text-gray-500">{project?.name || `Project #${projectId}`}</p>
          </div>
        </div>
        <button onClick={() => { setSelectedTask(null); setFormData(initForm()); setIsModalOpen(true); }} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Add Task
        </button>
      </div>

      {isDemo && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-sm flex items-center gap-2"><AlertCircle size={16} /> Showing demo schedule.</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500">Total Tasks</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{tasks.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500">Completed</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500">In Progress</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{tasks.filter((t) => t.status === 'in_progress').length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500">Avg Progress</span>
          <p className="text-2xl font-bold text-primary-600 mt-1">{avgProgress}%</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'not_started', 'in_progress', 'completed', 'on_hold'].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${filterStatus === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
            {s === 'all' ? 'All Tasks' : STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
          <Calendar size={36} className="opacity-30" />
          <p className="text-sm">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.not_started;
            const StatusIcon = cfg.icon;
            return (
              <div key={task.id} className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 hover:border-primary-200 transition-colors group">
                <div className="flex flex-wrap items-start gap-4 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs text-gray-400">{task.task_code}</span>
                      {task.category && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{task.category}</span>}
                      <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: PRIORITY_COLORS[task.priority] || '#9ca3af' }} title={`${task.priority} priority`} />
                    </div>
                    <h3 className="font-semibold text-gray-900">{task.task_name}</h3>
                    {task.task_description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{task.task_description}</p>}
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={12} /> {formatDate(task.start_date)}</span>
                      {task.end_date && <span className="text-xs text-gray-500">→ {formatDate(task.end_date)}</span>}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span className="font-semibold">{task.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${task.progress || 0}%`,
                            background: task.status === 'completed' ? '#10b981' : 'linear-gradient(to right, #A0975A, #8a824a)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>
                      <StatusIcon size={11} /> {cfg.label}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Edit2 size={14} /></button>
                      <button onClick={() => { setSelectedTask(task); setIsDeleteOpen(true); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedTask ? 'Edit Task' : 'Add Schedule Task'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Task Name *</label>
              <input type="text" required value={formData.task_name} onChange={(e) => setFormData({ ...formData, task_name: e.target.value })} className="form-input" placeholder="e.g., Foundation Pile Casting" />
            </div>
            <div>
              <label className="form-label">Category</label>
              <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="form-input" placeholder="e.g., Substructure, Superstructure" />
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="form-input">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="form-label">Start Date *</label>
              <input type="date" required value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="form-input">
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="form-label">Progress ({formData.progress}%)</label>
              <input type="range" min="0" max="100" value={formData.progress} onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })} className="w-full accent-primary-600" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Description</label>
              <textarea rows="2" value={formData.task_description} onChange={(e) => setFormData({ ...formData, task_description: e.target.value })} className="form-input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">{submitting ? 'Saving...' : selectedTask ? 'Update Task' : 'Add Task'}</button>
          </div>
        </form>
      </Modal>
      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Task" message="Delete this schedule task?" />
    </div>
  );
}
