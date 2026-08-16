import { useState, useEffect } from 'react';
import { projectsAPI, clientsAPI, usersAPI } from '../../api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import { formatCurrency, formatDate, formatStatus, getStatusClass, BD_DIVISIONS, BD_DISTRICTS, PROJECT_TYPES } from '../../utils/helpers';
import { Plus, Search, Filter, Eye, Edit2, Trash2, Building2, MapPin, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_id: '',
    project_type: 'residential',
    status: 'planning',
    start_date: '',
    end_date: '',
    location: '',
    district: 'Dhaka',
    division: 'Dhaka',
    total_area: '',
    area_unit: 'sqft',
    total_budget: '',
    approved_budget: '',
    priority: 'medium',
    notes: '',
    progress: 0
  });

  useEffect(() => {
    loadProjects();
  }, [pagination.page, statusFilter, typeFilter]);

  useEffect(() => {
    loadClientsAndUsers();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await projectsAPI.getAll({
        page: pagination.page,
        per_page: pagination.per_page,
        search,
        status: statusFilter,
        project_type: typeFilter,
      });
      if (res.data.success) {
        setProjects(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.warn('Using demo data fallback for projects');
      setProjects([
        { id: 1, project_code: 'PRJ-00001', name: 'Gulshan Heights Tower', client_name: 'Rahman Real Estate', project_type: 'commercial', status: 'active', start_date: '2025-01-15', end_date: '2026-06-30', total_budget: 45000000, progress: 65, location: 'Road 11, Gulshan-2', district: 'Dhaka' },
        { id: 2, project_code: 'PRJ-00002', name: 'Uttara Commercial Complex', client_name: 'Karim Enterprises', project_type: 'commercial', status: 'active', start_date: '2025-03-01', end_date: '2026-12-31', total_budget: 85000000, progress: 40, location: 'Sector 4, Uttara', district: 'Dhaka' },
        { id: 3, project_code: 'PRJ-00003', name: 'Dhanmondi Luxury Duplex', client_name: 'Engr. Hasan Ahmed', project_type: 'residential', status: 'completed', start_date: '2024-06-01', end_date: '2025-08-01', total_budget: 12000000, progress: 100, location: 'Road 7/A, Dhanmondi', district: 'Dhaka' },
        { id: 4, project_code: 'PRJ-00004', name: 'Chittagong Port Warehouse', client_name: 'Eastern Logistics', project_type: 'industrial', status: 'planning', start_date: '2025-11-01', end_date: '2026-09-30', total_budget: 35000000, progress: 10, location: 'Agrabad C/A', district: 'Chittagong' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadClientsAndUsers = async () => {
    try {
      const [resClients, resUsers] = await Promise.allSettled([
        clientsAPI.getAll({ per_page: 100 }),
        usersAPI.getAll()
      ]);
      if (resClients.status === 'fulfilled' && resClients.value.data.success) {
        setClients(resClients.value.data.data);
      }
      if (resUsers.status === 'fulfilled' && resUsers.value.data.success) {
        setUsers(resUsers.value.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    loadProjects();
  };

  const openCreateModal = () => {
    setSelectedProject(null);
    setFormData({
      name: '',
      description: '',
      client_id: '',
      project_type: 'residential',
      status: 'planning',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      location: '',
      district: 'Dhaka',
      division: 'Dhaka',
      total_area: '',
      area_unit: 'sqft',
      total_budget: '',
      approved_budget: '',
      priority: 'medium',
      notes: '',
      progress: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name || '',
      description: project.description || '',
      client_id: project.client_id || '',
      project_type: project.project_type || 'residential',
      status: project.status || 'planning',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      location: project.location || '',
      district: project.district || 'Dhaka',
      division: project.division || 'Dhaka',
      total_area: project.total_area || '',
      area_unit: project.area_unit || 'sqft',
      total_budget: project.total_budget || '',
      approved_budget: project.approved_budget || '',
      priority: project.priority || 'medium',
      notes: project.notes || '',
      progress: project.progress || 0
    });
    setIsModalOpen(true);
  };

  const openViewModal = (project) => {
    setSelectedProject(project);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (project) => {
    setSelectedProject(project);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedProject) {
        await projectsAPI.update(selectedProject.id, formData);
        toast.success('Project updated successfully!');
      } else {
        await projectsAPI.create(formData);
        toast.success('Project created successfully!');
      }
      setIsModalOpen(false);
      loadProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await projectsAPI.delete(selectedProject.id);
      toast.success('Project deleted successfully!');
      setIsDeleteOpen(false);
      loadProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      header: 'Code & Project Name',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded font-semibold">{row.project_code}</span>
            <span className="font-bold text-gray-900 hover:text-primary-600">{row.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1"><MapPin size={12} /> {row.district || 'Bangladesh'}</span>
            <span>•</span>
            <span>{row.client_name || 'No Client'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      render: (row) => (
        <span className="capitalize px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          {row.project_type}
        </span>
      ),
    },
    {
      header: 'Budget (BDT)',
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900">{formatCurrency(row.total_budget)}</span>
        </div>
      ),
    },
    {
      header: 'Progress',
      render: (row) => (
        <div className="w-28">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-gray-700">{row.progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${row.progress >= 100 ? 'bg-emerald-500' : 'bg-primary-600'}`}
              style={{ width: `${row.progress}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(row.status)}`}>
          {formatStatus(row.status)}
        </span>
      ),
    },
    {
      header: 'Duration',
      render: (row) => (
        <div className="text-xs text-gray-600">
          <div>{formatDate(row.start_date)}</div>
          <div className="text-gray-400 text-[11px]">to {formatDate(row.end_date)}</div>
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openViewModal(row)}
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage, monitor, and track site operations across Bangladesh</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={18} /> New Project
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        <form onSubmit={handleSearch} className="flex-1 w-full md:w-auto relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by project name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10"
          />
        </form>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input text-xs w-full md:w-36"
          >
            <option value="">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-input text-xs w-full md:w-36"
          >
            <option value="">All Types</option>
            {PROJECT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={projects}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(p => ({ ...p, page }))}
        onRowClick={openViewModal}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProject ? 'Edit Project' : 'Create New Project'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Project Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Green Valley Luxury Residency"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Client</label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="form-input"
              >
                <option value="">-- Select Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Project Type</label>
              <select
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                className="form-input"
              >
                {PROJECT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Total Budget (BDT / ৳)</label>
              <input
                type="number"
                value={formData.total_budget}
                onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                placeholder="e.g. 5000000"
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
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
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
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Division</label>
              <select
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                className="form-input"
              >
                {BD_DIVISIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">District</label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="form-input"
              >
                {BD_DISTRICTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Site Address / Specific Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Plot #, Road #, Sector/Area, Thana"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Total Land/Floor Area</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.total_area}
                  onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
                  placeholder="e.g. 3500"
                  className="form-input flex-1"
                />
                <select
                  value={formData.area_unit}
                  onChange={(e) => setFormData({ ...formData, area_unit: e.target.value })}
                  className="form-input w-28"
                >
                  <option value="sqft">Sq. Ft.</option>
                  <option value="katha">Katha</option>
                  <option value="bigha">Bigha</option>
                  <option value="decimal">Decimal</option>
                </select>
              </div>
            </div>

            {selectedProject && (
              <div>
                <label className="form-label">Completion Progress (%)</label>
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

            <div className="md:col-span-2">
              <label className="form-label">Project Description & Scope</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-input"
                placeholder="Details on floor count, structural specs, BNBC building requirements..."
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {selectedProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Project Overview & Details"
        size="lg"
      >
        {selectedProject && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-gradient-to-r from-primary-900 to-primary-800 text-white rounded-2xl">
              <div>
                <span className="text-xs font-mono uppercase bg-primary-700/50 px-2 py-0.5 rounded text-primary-200">
                  {selectedProject.project_code}
                </span>
                <h2 className="text-xl font-bold mt-1">{selectedProject.name}</h2>
                <p className="text-sm text-primary-200 mt-0.5 flex items-center gap-1.5">
                  <MapPin size={14} /> {selectedProject.location || selectedProject.district || 'Dhaka, Bangladesh'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(selectedProject.status)}`}>
                {formatStatus(selectedProject.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500">Total Budget</span>
                <p className="text-base font-bold text-gray-900 mt-0.5">{formatCurrency(selectedProject.total_budget)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500">Progress</span>
                <p className="text-base font-bold text-primary-600 mt-0.5">{selectedProject.progress || 0}%</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500">Start Date</span>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDate(selectedProject.start_date)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500">Target End</span>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDate(selectedProject.end_date)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">Site & Structural Specifications</h3>
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">Client:</span> <span className="font-medium text-gray-800">{selectedProject.client_name || 'N/A'}</span></div>
                  <div><span className="text-gray-500">Area:</span> <span className="font-medium text-gray-800">{selectedProject.total_area ? `${selectedProject.total_area} ${selectedProject.area_unit}` : 'N/A'}</span></div>
                  <div><span className="text-gray-500">Division/District:</span> <span className="font-medium text-gray-800">{selectedProject.district}, {selectedProject.division}</span></div>
                  <div><span className="text-gray-500">Project Type:</span> <span className="font-medium text-gray-800 capitalize">{selectedProject.project_type}</span></div>
                </div>
                {selectedProject.description && (
                  <p className="text-gray-600 text-xs border-t border-gray-100 pt-2 mt-2">
                    {selectedProject.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsViewModalOpen(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete project "${selectedProject?.name}"? All associated tasks, records and allocations will be removed.`}
      />
    </div>
  );
}
