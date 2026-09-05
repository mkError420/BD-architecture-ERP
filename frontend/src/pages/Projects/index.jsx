import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, clientsAPI, usersAPI } from '../../api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import {
  formatCurrency,
  formatDate,
  formatStatus,
  getStatusClass,
  BD_DIVISIONS,
  BD_DISTRICTS,
  PROJECT_TYPES,
  BUILDING_TYPES,
  STRUCTURAL_SYSTEMS,
  FOUNDATION_TYPES,
  FIRE_SAFETY_STATUSES,
} from '../../utils/helpers';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle2,
  Layers,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialFormData = {
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
    progress: 0,
    // Building Specs
    building_type: 'Residential Apartment',
    stories_above_ground: 1,
    basement_floors: 0,
    total_units: 0,
    gross_floor_area: '',
    footprint_area: '',
    far_value: '',
    mgc_percentage: '',
    structural_system: 'RCC Frame with Shear Wall Core',
    foundation_system: 'Cast-in-situ Bored Piles',
    parking_capacity: 0,
    rajuk_approval_no: '',
    approval_date: '',
    soil_bearing_capacity: '',
    elevators_count: 0,
    generator_capacity: '',
    fire_safety_status: 'Pending Inspection',
    setback_front: '',
    setback_rear: '',
    setback_left: '',
    setback_right: '',
  };

  const [formData, setFormData] = useState(initialFormData);

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
        {
          id: 1,
          project_code: 'PRJ-00001',
          name: 'Gulshan Heights Luxury Tower',
          client_name: 'Rahman Real Estate',
          project_type: 'residential',
          building_type: 'Luxury High-Rise Tower',
          status: 'active',
          start_date: '2025-01-15',
          end_date: '2026-08-30',
          total_budget: 65000000,
          spent_amount: 38450000,
          progress: 62,
          location: 'Road 11, Gulshan-2',
          district: 'Dhaka',
          stories_above_ground: 14,
          basement_floors: 2,
          total_units: 42,
          gross_floor_area: 58000,
          rajuk_approval_no: 'RAJUK/BC-2024/0981',
        },
        {
          id: 2,
          project_code: 'PRJ-00002',
          name: 'Uttara Commercial Mega Complex',
          client_name: 'Karim Enterprises Ltd.',
          project_type: 'commercial',
          building_type: 'Commercial Shopping Mall',
          status: 'active',
          start_date: '2025-03-01',
          end_date: '2026-12-31',
          total_budget: 85000000,
          spent_amount: 34000000,
          progress: 40,
          location: 'Sector 4, Uttara',
          district: 'Dhaka',
          stories_above_ground: 12,
          basement_floors: 3,
          total_units: 120,
          gross_floor_area: 95000,
          rajuk_approval_no: 'RAJUK/ZON-3/2024/1102',
        },
        {
          id: 3,
          project_code: 'PRJ-00003',
          name: 'Dhanmondi Luxury Duplex Villa',
          client_name: 'Engr. Hasan Ahmed',
          project_type: 'residential',
          building_type: 'Duplex / Triplex Villa',
          status: 'completed',
          start_date: '2024-06-01',
          end_date: '2025-08-01',
          total_budget: 15000000,
          spent_amount: 14800000,
          progress: 100,
          location: 'Road 7/A, Dhanmondi',
          district: 'Dhaka',
          stories_above_ground: 3,
          basement_floors: 0,
          total_units: 2,
          gross_floor_area: 7200,
          rajuk_approval_no: 'RAJUK/DHN/2024/045',
        },
        {
          id: 4,
          project_code: 'PRJ-00004',
          name: 'Chittagong Port Logistics Terminal',
          client_name: 'Eastern Logistics BD',
          project_type: 'industrial',
          building_type: 'Industrial Factory / Warehouse',
          status: 'planning',
          start_date: '2025-11-01',
          end_date: '2026-09-30',
          total_budget: 45000000,
          spent_amount: 4500000,
          progress: 10,
          location: 'Agrabad C/A',
          district: 'Chittagong',
          stories_above_ground: 4,
          basement_floors: 0,
          total_units: 8,
          gross_floor_area: 36000,
          rajuk_approval_no: 'CDA/AGR/2025/087',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadClientsAndUsers = async () => {
    try {
      const [resClients, resUsers] = await Promise.allSettled([
        clientsAPI.getAll({ per_page: 100 }),
        usersAPI.getAll(),
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
    setPagination((p) => ({ ...p, page: 1 }));
    loadProjects();
  };

  const openCreateModal = () => {
    setSelectedProject(null);
    setFormData(initialFormData);
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
      progress: project.progress || 0,
      building_type: project.building_type || 'Residential Apartment',
      stories_above_ground: project.stories_above_ground || 1,
      basement_floors: project.basement_floors || 0,
      total_units: project.total_units || 0,
      gross_floor_area: project.gross_floor_area || '',
      footprint_area: project.footprint_area || '',
      far_value: project.far_value || '',
      mgc_percentage: project.mgc_percentage || '',
      structural_system: project.structural_system || 'RCC Frame with Shear Wall Core',
      foundation_system: project.foundation_system || 'Cast-in-situ Bored Piles',
      parking_capacity: project.parking_capacity || 0,
      rajuk_approval_no: project.rajuk_approval_no || '',
      approval_date: project.approval_date || '',
      soil_bearing_capacity: project.soil_bearing_capacity || '',
      elevators_count: project.elevators_count || 0,
      generator_capacity: project.generator_capacity || '',
      fire_safety_status: project.fire_safety_status || 'Pending Inspection',
      setback_front: project.setback_front || '',
      setback_rear: project.setback_rear || '',
      setback_left: project.setback_left || '',
      setback_right: project.setback_right || '',
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (project) => {
    setSelectedProject(project);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Project Name is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        client_id: formData.client_id ? Number(formData.client_id) : null,
        total_budget: formData.total_budget !== '' ? Number(formData.total_budget) : 0,
        approved_budget: formData.approved_budget !== '' ? Number(formData.approved_budget) : 0,
        total_area: formData.total_area !== '' ? Number(formData.total_area) : null,
        stories_above_ground: formData.stories_above_ground !== '' ? Number(formData.stories_above_ground) : 1,
        basement_floors: formData.basement_floors !== '' ? Number(formData.basement_floors) : 0,
        total_units: formData.total_units !== '' ? Number(formData.total_units) : 0,
        gross_floor_area: formData.gross_floor_area !== '' ? Number(formData.gross_floor_area) : 0,
        footprint_area: formData.footprint_area !== '' ? Number(formData.footprint_area) : 0,
        far_value: formData.far_value !== '' ? Number(formData.far_value) : 0,
        mgc_percentage: formData.mgc_percentage !== '' ? Number(formData.mgc_percentage) : 0,
        parking_capacity: formData.parking_capacity !== '' ? Number(formData.parking_capacity) : 0,
        elevators_count: formData.elevators_count !== '' ? Number(formData.elevators_count) : 0,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        approval_date: formData.approval_date || null,
      };

      if (selectedProject) {
        await projectsAPI.update(selectedProject.id, payload);
        toast.success('Project updated successfully!');
      } else {
        await projectsAPI.create(payload);
        toast.success('Project created successfully!');
      }
      setIsModalOpen(false);
      loadProjects();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Operation failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
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

  const handleRowClick = (project) => {
    navigate(`/projects/${project.id}`);
  };

  const columns = [
    {
      header: 'Code & Project Name',
      render: (row) => (
        <div
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/projects/${row.id}`);
          }}
          className="group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-primary-700 bg-primary-50 border border-primary-200/60 px-2 py-0.5 rounded-md font-bold">
              {row.project_code}
            </span>
            <span className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors flex items-center gap-1.5">
              {row.name}
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-primary-600 -translate-x-1 group-hover:translate-x-0" />
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-gray-400" /> {row.location || row.district || 'Bangladesh'}
            </span>
            <span>•</span>
            <span className="font-medium text-gray-700">{row.client_name || 'Direct Client'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Building Specs',
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold text-gray-900 block">
            {row.stories_above_ground ? `${row.stories_above_ground} Floors (G+${Math.max(0, row.stories_above_ground - 1)})` : '1 Story'}
            {row.basement_floors > 0 ? ` + ${row.basement_floors}B` : ''}
          </span>
          <span className="text-[11px] text-gray-500 block mt-0.5">
            {row.total_units ? `${row.total_units} Units` : ''}
            {row.gross_floor_area ? ` • ${row.gross_floor_area} sft` : ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Type',
      render: (row) => (
        <div>
          <span className="capitalize px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 inline-block">
            {row.project_type}
          </span>
        </div>
      ),
    },
    {
      header: 'Budget (BDT)',
      render: (row) => (
        <div>
          <span className="font-bold text-gray-900 block text-xs">{formatCurrency(row.total_budget)}</span>
          {row.spent_amount > 0 && (
            <span className="text-[10px] text-gray-500 block">Spent: {formatCurrency(row.spent_amount)}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Progress',
      render: (row) => (
        <div className="w-28">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-bold text-gray-800">{row.progress || 0}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                row.progress >= 100 ? 'bg-emerald-500' : 'bg-primary-600'
              }`}
              style={{ width: `${row.progress || 0}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getStatusClass(row.status)}`}>
          {formatStatus(row.status)}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/projects/${row.id}`)}
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Open Details & Building Specs"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit Project"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Project"
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
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Project Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Click on any project to view architectural parameters, floor schedules, work orders & building specifications
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2 shadow-sm">
          <Plus size={18} /> New Construction Project
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <form onSubmit={handleSearch} className="flex-1 w-full md:w-auto relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by project name, code or plot location..."
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
            {PROJECT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table with Clickable Rows */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <DataTable
          columns={columns}
          data={projects}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProject ? 'Edit Project & Building Specs' : 'Create New Project'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">
              1. Project Core Details
            </h3>
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
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
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
                  {PROJECT_TYPES.map((t) => (
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
                  placeholder="e.g. 50000000"
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
                  {BD_DIVISIONS.map((d) => (
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
                  {BD_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Site Address / Plot Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Plot #, Road #, Sector, Thana"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Building Specifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-primary-700 uppercase tracking-wider border-b border-gray-200 pb-2">
              2. Building & Structural Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Building Typology</label>
                <select
                  value={formData.building_type}
                  onChange={(e) => setFormData({ ...formData, building_type: e.target.value })}
                  className="form-input"
                >
                  {BUILDING_TYPES.map((bt) => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Stories Above Ground</label>
                <input
                  type="number"
                  min="1"
                  value={formData.stories_above_ground}
                  onChange={(e) => setFormData({ ...formData, stories_above_ground: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 14"
                />
              </div>

              <div>
                <label className="form-label">Basement Floors</label>
                <input
                  type="number"
                  min="0"
                  value={formData.basement_floors}
                  onChange={(e) => setFormData({ ...formData, basement_floors: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 2"
                />
              </div>

              <div>
                <label className="form-label">Total Units / Flats</label>
                <input
                  type="number"
                  min="0"
                  value={formData.total_units}
                  onChange={(e) => setFormData({ ...formData, total_units: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 36"
                />
              </div>

              <div>
                <label className="form-label">Gross Floor Area (GFA sqft)</label>
                <input
                  type="number"
                  value={formData.gross_floor_area}
                  onChange={(e) => setFormData({ ...formData, gross_floor_area: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 52000"
                />
              </div>

              <div>
                <label className="form-label">RAJUK / CDA Approval No</label>
                <input
                  type="text"
                  value={formData.rajuk_approval_no}
                  onChange={(e) => setFormData({ ...formData, rajuk_approval_no: e.target.value })}
                  className="form-input"
                  placeholder="e.g. RAJUK/BC-2024/0981"
                />
              </div>

              <div>
                <label className="form-label">Structural Frame</label>
                <select
                  value={formData.structural_system}
                  onChange={(e) => setFormData({ ...formData, structural_system: e.target.value })}
                  className="form-input"
                >
                  {STRUCTURAL_SYSTEMS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Foundation Substructure</label>
                <select
                  value={formData.foundation_system}
                  onChange={(e) => setFormData({ ...formData, foundation_system: e.target.value })}
                  className="form-input"
                >
                  {FOUNDATION_TYPES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Fire Safety Status</label>
                <select
                  value={formData.fire_safety_status}
                  onChange={(e) => setFormData({ ...formData, fire_safety_status: e.target.value })}
                  className="form-input"
                >
                  {FIRE_SAFETY_STATUSES.map((fs) => (
                    <option key={fs} value={fs}>{fs}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-3">
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
            <button type="button" disabled={submitting} onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary inline-flex items-center gap-2">
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{selectedProject ? 'Saving...' : 'Creating...'}</span>
                </>
              ) : (
                <span>{selectedProject ? 'Save Changes' : 'Create Project'}</span>
              )}
            </button>
          </div>

        </form>
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
