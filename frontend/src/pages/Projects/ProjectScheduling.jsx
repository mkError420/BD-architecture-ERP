import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { projectScheduleAPI } from '../../api';
import { Calendar, Plus } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';

export default function ProjectScheduling() {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [formData, setFormData] = useState({
    project_id: projectId,
    task_name: '',
    task_description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'not_started',
    priority: 'medium',
    progress: 0,
    notes: '',
  });

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await projectScheduleAPI.getAll({ project_id: projectId });
      if (res.data.success) {
        setTasks(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTask) {
        await projectScheduleAPI.update(selectedTask.id, formData);
        toast.success('Task updated successfully!');
      } else {
        await projectScheduleAPI.create(formData);
        toast.success('Task created successfully!');
      }
      setIsModalOpen(false);
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    try {
      await projectScheduleAPI.delete(selectedTask.id);
      toast.success('Task deleted');
      setIsDeleteOpen(false);
      loadTasks();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const columns = [
    { header: 'Task Name', render: (row) => <span className="font-medium">{row.task_name}</span> },
    { header: 'Start Date', render: (row) => <span>{row.start_date}</span> },
    { header: 'End Date', render: (row) => <span>{row.end_date}</span> },
    { header: 'Progress', render: (row) => <span>{row.progress}%</span> },
    { header: 'Status', render: (row) => <span className="capitalize">{row.status?.replace('_', ' ')}</span> },
    { header: 'Priority', render: (row) => <span className="capitalize">{row.priority}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #A0975A, #8a824a)' }}>
            <Calendar size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Scheduling</h1>
            <p className="text-gray-500 text-sm">Manage project timeline and tasks</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Add Task
        </button>
      </div>

      <DataTable columns={columns} data={tasks} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Task" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Task Name *</label>
              <input type="text" required value={formData.task_name} onChange={(e) => setFormData({ ...formData, task_name: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Start Date *</label>
              <input type="date" required value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">End Date *</label>
              <input type="date" required value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="form-input">
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="form-input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="form-label">Progress (%)</label>
              <input type="number" min="0" max="100" value={formData.progress} onChange={(e) => setFormData({ ...formData, progress: e.target.value })} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Description</label>
              <textarea rows="2" value={formData.task_description} onChange={(e) => setFormData({ ...formData, task_description: e.target.value })} className="form-input"></textarea>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input"></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Task</button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Task" message="Are you sure you want to delete this task?" />
    </div>
  );
}
