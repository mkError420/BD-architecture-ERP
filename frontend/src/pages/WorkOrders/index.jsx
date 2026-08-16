import { useState, useEffect } from 'react';
import { workOrdersAPI, projectsAPI, employeesAPI } from '../../api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import { formatCurrency, formatDate, formatStatus, getStatusClass, WO_CATEGORIES } from '../../utils/helpers';
import { Plus, Search, ClipboardList, CheckCircle2, Clock, AlertCircle, Edit2, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkOrders() {
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    category: 'foundation',
    assigned_to: '',
    start_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'pending',
    priority: 'medium',
    progress: 0,
    estimated_cost: '',
    actual_cost: '',
    notes: '',
  });

  useEffect(() => {
    loadProjectsAndEmployees();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [pagination.page, projectFilter, statusFilter]);

  const loadProjectsAndEmployees = async () => {
    try {
      const [projRes, empRes] = await Promise.allSettled([
        projectsAPI.getAll({ per_page: 100 }),
        employeesAPI.getAll({ per_page: 100 })
      ]);
      if (projRes.status === 'fulfilled' && projRes.value.data.success) {
        setProjects(projRes.value.data.data);
      }
      if (empRes.status === 'fulfilled' && empRes.value.data.success) {
        setEmployees(empRes.value.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await workOrdersAPI.getAll({
        page: pagination.page,
        per_page: pagination.per_page,
        search,
        project_id: projectFilter,
        status: statusFilter,
      });
      if (res.data.success) {
        setOrders(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load work orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    loadOrders();
  };

  const openCreateModal = () => {
    setSelectedOrder(null);
    setFormData({
      project_id: projects[0]?.id || '',
      title: '',
      description: '',
      category: 'structure',
      assigned_to: '',
      start_date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'pending',
      priority: 'medium',
      progress: 0,
      estimated_cost: '',
      actual_cost: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (order) => {
    setSelectedOrder(order);
    setFormData({
      project_id: order.project_id || '',
      title: order.title || '',
      description: order.description || '',
      category: order.category || 'structure',
      assigned_to: order.assigned_to || '',
      start_date: order.start_date || '',
      due_date: order.due_date || '',
      status: order.status || 'pending',
      priority: order.priority || 'medium',
      progress: order.progress || 0,
      estimated_cost: order.estimated_cost || '',
      actual_cost: order.actual_cost || '',
      notes: order.notes || '',
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (order) => {
    setSelectedOrder(order);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedOrder) {
        await workOrdersAPI.update(selectedOrder.id, formData);
        toast.success('Work order updated!');
      } else {
        await workOrdersAPI.create(formData);
        toast.success('Work order issued successfully!');
      }
      setIsModalOpen(false);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    try {
      await workOrdersAPI.delete(selectedOrder.id);
      toast.success('Work order deleted');
      setIsDeleteOpen(false);
      loadOrders();
    } catch (err) {
      toast.error('Failed to delete work order');
    }
  };

  const getCategoryLabel = (cat) => {
    const c = WO_CATEGORIES.find(item => item.value === cat);
    return c ? c.label : cat;
  };

  const columns = [
    {
      header: 'Code & Task Title',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded font-semibold">{row.order_code}</span>
            <span className="font-bold text-gray-900">{row.title}</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Project: <span className="font-medium text-gray-700">{row.project_name || 'General'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Work Scope',
      render: (row) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {getCategoryLabel(row.category)}
        </span>
      ),
    },
    {
      header: 'Lead / Assigned To',
      render: (row) => (
        <span className="text-xs font-medium text-gray-800 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
          {row.assigned_name || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Progress',
      render: (row) => (
        <div className="w-24">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-gray-700">{row.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${row.progress >= 100 ? 'bg-emerald-500' : 'bg-primary-600'}`}
              style={{ width: `${row.progress}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: 'Status & Priority',
      render: (row) => (
        <div className="space-y-1">
          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusClass(row.status)}`}>
            {formatStatus(row.status)}
          </span>
          {row.priority === 'urgent' && (
            <span className="block text-[10px] text-red-600 font-bold uppercase tracking-wider">Urgent Priority</span>
          )}
        </div>
      ),
    },
    {
      header: 'Target Date',
      render: (row) => (
        <span className="text-xs text-gray-600 font-medium">{formatDate(row.due_date)}</span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Orders & Site Execution</h1>
          <p className="text-gray-500 text-sm mt-1">Assign tasks, structural milestones, quality checks, and track trade progress</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={18} /> New Work Order
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex-1 w-full md:w-auto relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search task title or work order code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10"
          />
        </form>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="form-input text-xs w-full md:w-48"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input text-xs w-full md:w-36"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(p => ({ ...p, page }))}
      />

      {/* Modal Create / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedOrder ? 'Edit Work Order' : 'Create New Work Order'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Task Title (কাজের শিরোনাম) *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. 4th Floor Slab Rebar Binding & Shuttering"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Project (প্রজেক্ট) *</label>
              <select
                required
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="form-input"
              >
                <option value="">-- Select Project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Work Scope / Trade *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-input"
              >
                {WO_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Assigned Supervisor / Lead Mason</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="form-input"
              >
                <option value="">-- Select Worker / Engineer --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role?.replace('_', ' ')})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Priority Level</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="form-input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent (জরুরী)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Target Completion Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Estimated Cost (BDT / ৳)</label>
              <input
                type="number"
                value={formData.estimated_cost}
                onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                placeholder="e.g. 250000"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-input"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {selectedOrder && (
              <div>
                <label className="form-label">Task Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                  className="form-input"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="form-label">Detailed Work Instructions</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Concrete mix ratio (1:1.5:3), curing schedule, safety gear requirements..."
                className="form-input"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {selectedOrder ? 'Save Changes' : 'Issue Work Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Work Order"
        message={`Are you sure you want to delete work order "${selectedOrder?.title}"?`}
      />
    </div>
  );
}
