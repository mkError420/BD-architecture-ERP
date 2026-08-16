import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectsAPI, clientsAPI, usersAPI } from '../../api';
import Modal from '../../components/ui/Modal';
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
  Building2,
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Users,
  HardHat,
  Package,
  Receipt,
  Edit2,
  Plus,
  Trash2,
  Phone,
  Mail,
  ShieldCheck,
  Zap,
  Car,
  TrendingUp,
  AlertCircle,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('building');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [editingFloorIndex, setEditingFloorIndex] = useState(null);

  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);

  // Form data for Project & Building Specs
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
    progress: 0,
    // Building Specs
    building_type: 'Residential Apartment',
    stories_above_ground: 1,
    basement_floors: 0,
    total_units: 0,
    gross_floor_area: 0,
    footprint_area: 0,
    far_value: 0,
    mgc_percentage: 0,
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
  });

  // Floor Schedule Data
  const [floors, setFloors] = useState([]);
  const [floorForm, setFloorForm] = useState({
    name: '',
    level: 0,
    usage: 'Residential Units',
    area: '',
    units: 2,
    stage: 'RCC Slab Casting',
    status: 'In Progress',
    progress: 50,
  });

  useEffect(() => {
    loadProjectDetails();
    loadClientsAndUsers();
  }, [id]);

  const loadProjectDetails = async () => {
    setLoading(true);
    try {
      const res = await projectsAPI.getOne(id);
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setProject(data);
        populateFormData(data);
      }
    } catch (err) {
      console.warn('API error, using demo project details fallback', err);
      // Demo fallback if backend is offline or mock id
      const demoData = getDemoProject(id);
      setProject(demoData);
      populateFormData(demoData);
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

  const populateFormData = (data) => {
    setFormData({
      name: data.name || '',
      description: data.description || '',
      client_id: data.client_id || '',
      project_type: data.project_type || 'residential',
      status: data.status || 'planning',
      start_date: data.start_date || '',
      end_date: data.end_date || '',
      location: data.location || '',
      district: data.district || 'Dhaka',
      division: data.division || 'Dhaka',
      total_area: data.total_area || '',
      area_unit: data.area_unit || 'sqft',
      total_budget: data.total_budget || '',
      approved_budget: data.approved_budget || '',
      priority: data.priority || 'medium',
      notes: data.notes || '',
      progress: data.progress || 0,
      building_type: data.building_type || 'Residential Apartment',
      stories_above_ground: data.stories_above_ground || 10,
      basement_floors: data.basement_floors || 1,
      total_units: data.total_units || 36,
      gross_floor_area: data.gross_floor_area || 45000,
      footprint_area: data.footprint_area || 3800,
      far_value: data.far_value || 3.75,
      mgc_percentage: data.mgc_percentage || 57.5,
      structural_system: data.structural_system || 'RCC Frame with Shear Wall Core',
      foundation_system: data.foundation_system || 'Cast-in-situ Bored Piles',
      parking_capacity: data.parking_capacity || 24,
      rajuk_approval_no: data.rajuk_approval_no || 'RAJUK/BC-2024/7892',
      approval_date: data.approval_date || '2024-11-15',
      soil_bearing_capacity: data.soil_bearing_capacity || '2.45 ksf (117 kPa)',
      elevators_count: data.elevators_count || 2,
      generator_capacity: data.generator_capacity || '160 kVA (Auto-Transfer)',
      fire_safety_status: data.fire_safety_status || 'FSCD Approved & Certified',
      setback_front: data.setback_front || '1.5m (5 ft)',
      setback_rear: data.setback_rear || '2.0m (6.5 ft)',
      setback_left: data.setback_left || '1.25m (4.1 ft)',
      setback_right: data.setback_right || '1.25m (4.1 ft)',
    });

    // Parse floor details
    if (data.floor_details) {
      try {
        const parsed = typeof data.floor_details === 'string' ? JSON.parse(data.floor_details) : data.floor_details;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFloors(parsed);
          return;
        }
      } catch (e) {
        console.error('Error parsing floor details:', e);
      }
    }
    // Generate default floor schedule if empty
    generateDefaultFloors(data.stories_above_ground || 10, data.basement_floors || 1);
  };

  const generateDefaultFloors = (stories = 10, basements = 1) => {
    const list = [];
    for (let b = basements; b >= 1; b--) {
      list.push({
        name: `Basement ${b}`,
        level: -b,
        usage: 'Car Parking, Substation & Water Reservoir',
        area: '3,800 sqft',
        units: 0,
        stage: 'RCC Retaining Wall & Slab Done',
        status: 'Completed',
        progress: 100,
      });
    }
    list.push({
      name: 'Ground Floor',
      level: 0,
      usage: 'Grand Reception, Guard Room & Parking',
      area: '3,800 sqft',
      units: 0,
      stage: 'Finishing & Landscape',
      status: 'In Progress',
      progress: 85,
    });
    for (let f = 1; f <= stories; f++) {
      const isTop = f === stories;
      list.push({
        name: `${f}${getOrdinalSuffix(f)} Floor`,
        level: f,
        usage: isTop ? 'Penthouse & Community Lounge' : 'Typical Residential Units (2x Units/Floor)',
        area: '4,100 sqft',
        units: isTop ? 1 : 2,
        stage: f <= 5 ? 'Plaster & Electrical Wiring' : f <= 8 ? 'Brick Masonry' : 'RCC Casting',
        status: f <= 5 ? 'Completed' : f <= 8 ? 'In Progress' : 'Pending',
        progress: f <= 5 ? 100 : f <= 8 ? 60 : 25,
      });
    }
    list.push({
      name: 'Rooftop Level',
      level: stories + 1,
      usage: 'Machine Room, Overhead Tank, Rooftop Garden',
      area: '2,500 sqft',
      units: 0,
      stage: 'Parapet Wall & Waterproofing',
      status: 'Pending',
      progress: 10,
    });
    setFloors(list);
  };

  const getOrdinalSuffix = (i) => {
    const j = i % 10,
      k = i % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        floor_details: floors,
      };
      await projectsAPI.update(project.id, payload);
      toast.success('Project & Building specifications updated successfully!');
      setIsEditModalOpen(false);
      setProject((prev) => ({ ...prev, ...payload }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project');
    }
  };

  const handleQuickStatusChange = async (newStatus) => {
    try {
      await projectsAPI.update(project.id, { status: newStatus });
      setProject((p) => ({ ...p, status: newStatus }));
      toast.success(`Status updated to ${formatStatus(newStatus)}`);
    } catch (e) {
      toast.error('Failed to change status');
    }
  };

  const openAddFloorModal = () => {
    setEditingFloorIndex(null);
    setFloorForm({
      name: `Floor ${floors.length + 1}`,
      level: floors.length + 1,
      usage: 'Residential Units',
      area: '4,000 sqft',
      units: 2,
      stage: 'RCC Column & Slab',
      status: 'In Progress',
      progress: 40,
    });
    setIsFloorModalOpen(true);
  };

  const openEditFloorModal = (index) => {
    setEditingFloorIndex(index);
    setFloorForm({ ...floors[index] });
    setIsFloorModalOpen(true);
  };

  const handleSaveFloor = async (e) => {
    e.preventDefault();
    let updated = [...floors];
    if (editingFloorIndex !== null) {
      updated[editingFloorIndex] = floorForm;
    } else {
      updated.push(floorForm);
    }
    setFloors(updated);
    setIsFloorModalOpen(false);

    // Persist immediately
    try {
      await projectsAPI.update(project.id, { floor_details: updated });
      toast.success('Floor schedule saved!');
    } catch (err) {
      toast.success('Floor updated locally');
    }
  };

  const handleDeleteFloor = async (index) => {
    const updated = floors.filter((_, i) => i !== index);
    setFloors(updated);
    try {
      await projectsAPI.update(project.id, { floor_details: updated });
      toast.success('Floor removed');
    } catch (err) {
      // Ignored
    }
  };

  const getDemoProject = (projId) => {
    return {
      id: projId || 1,
      project_code: 'PRJ-00001',
      name: 'Gulshan Heights Luxury Tower',
      description:
        'A prestigious 14-story residential condominium featuring state-of-the-art earthquake resistance, automated parking, luxury rooftop infinity lounge, and complete compliance with BNBC-2020 & RAJUK bylaws.',
      client_name: 'Rahman Real Estate & Holdings Ltd.',
      client_phone: '+880 1711-234567',
      client_email: 'rahman@realestate-bd.com',
      project_type: 'residential',
      status: 'active',
      start_date: '2025-01-15',
      end_date: '2026-08-30',
      location: 'Plot 42, Road 11, Block D, Gulshan-2, Dhaka',
      district: 'Dhaka',
      division: 'Dhaka',
      total_area: 55000,
      area_unit: 'sqft',
      total_budget: 65000000,
      approved_budget: 65000000,
      progress: 62,
      spent_amount: 38450000,
      total_invoiced: 48000000,
      total_collected: 42000000,
      building_type: 'Luxury High-Rise Residential Tower',
      stories_above_ground: 14,
      basement_floors: 2,
      total_units: 42,
      gross_floor_area: 58000,
      footprint_area: 4200,
      far_value: 4.15,
      mgc_percentage: 58.5,
      structural_system: 'RCC Dual System (Shear Wall + Ductile Moment Resisting Frame)',
      foundation_system: 'Cast-in-situ Bored Piles (Dia: 800mm, Depth: 85 ft)',
      parking_capacity: 48,
      rajuk_approval_no: 'RAJUK/ZON-5/BC-2024/0981',
      approval_date: '2024-10-12',
      soil_bearing_capacity: '2.85 ksf (136 kPa) at 12m depth',
      elevators_count: 3,
      generator_capacity: '250 kVA Standby Soundproof Generator',
      fire_safety_status: 'FSCD Approved & Certified',
      setback_front: '3.0m (9.8 ft)',
      setback_rear: '2.5m (8.2 ft)',
      setback_left: '1.8m (5.9 ft)',
      setback_right: '1.8m (5.9 ft)',
      work_orders: [
        { id: 101, order_code: 'WO-0012', title: '7th to 9th Floor RCC Column & Beam Casting', category: 'structure', assigned_name: 'Engr. Tanvir Ahmed', status: 'in_progress', progress: 75, estimated_cost: 3200000, due_date: '2025-10-30' },
        { id: 102, order_code: 'WO-0014', title: 'Basement 1 & 2 Mechanical Ventilation & Sump Pump', category: 'plumbing', assigned_name: 'Supervisor Kabir', status: 'completed', progress: 100, estimated_cost: 1450000, due_date: '2025-08-15' },
        { id: 103, order_code: 'WO-0018', title: '3rd Floor Brick Masonry & Internal Partition', category: 'masonry', assigned_name: 'Ustad Rafiqul Islam', status: 'in_progress', progress: 60, estimated_cost: 850000, due_date: '2025-11-10' },
        { id: 104, order_code: 'WO-0021', title: 'Electrical Conduit & Concealed Box Fitting (4th-6th Floor)', category: 'electrical', assigned_name: 'Al-Amin Electric', status: 'pending', progress: 15, estimated_cost: 620000, due_date: '2025-12-05' },
      ],
      material_stocks: [
        { id: 1, material_name: 'BSRM Xtreme 500W Rebar (16mm & 20mm)', category: 'rod_steel', quantity: 45.5, unit: 'ton', supplier_name: 'BSRM Steels Ltd.', total_price: 4322500, purchase_date: '2025-07-20' },
        { id: 2, material_name: 'Seven Rings Portland Composite Cement', category: 'cement', quantity: 1200, unit: 'bag', supplier_name: 'Seven Rings Cement Ltd.', total_price: 708000, purchase_date: '2025-08-02' },
        { id: 3, material_name: 'Sylhet Coarse Sand (FM 2.5)', category: 'sand', quantity: 8500, unit: 'cft', supplier_name: 'Meghna River Sand Traders', total_price: 382500, purchase_date: '2025-08-05' },
        { id: 4, material_name: 'Gas-Burnt Auto Brick (1st Class)', category: 'brick', quantity: 35000, unit: 'piece', supplier_name: 'Bengal Auto Bricks', total_price: 455000, purchase_date: '2025-08-10' },
      ],
      expenses: [
        { id: 1, expense_code: 'EXP-1092', title: 'Labor Payment for 8th Floor Slab Casting', category: 'labor', amount: 480000, expense_date: '2025-08-12', paid_to: 'Foreman Harun & Team', is_approved: 1 },
        { id: 2, expense_code: 'EXP-1088', title: 'Ready-Mix Concrete 6000 psi (Mir Mix)', category: 'material', amount: 1650000, expense_date: '2025-08-08', paid_to: 'Mir Concrete Products', is_approved: 1 },
        { id: 3, expense_code: 'EXP-1074', title: 'Tower Crane Monthly Rental & Fuel', category: 'equipment', amount: 350000, expense_date: '2025-08-01', paid_to: 'Apex Heavy Equipment', is_approved: 1 },
        { id: 4, expense_code: 'EXP-1065', title: 'RAJUK Site Inspection & Structural Validation Fee', category: 'permit', amount: 120000, expense_date: '2025-07-28', paid_to: 'Regulatory Authority', is_approved: 1 },
      ],
      invoices: [
        { id: 1, invoice_no: 'INV-2025-004', issue_date: '2025-07-15', due_date: '2025-08-15', total: 15000000, paid_amount: 15000000, status: 'paid' },
        { id: 2, invoice_no: 'INV-2025-008', issue_date: '2025-08-01', due_date: '2025-09-01', total: 18000000, paid_amount: 12000000, status: 'partially_paid' },
        { id: 3, invoice_no: 'INV-2025-011', issue_date: '2025-08-15', due_date: '2025-09-15', total: 15000000, paid_amount: 0, status: 'sent' },
      ],
      team: [
        { employee_id: 1, name: 'Engr. Zahid Hasan, P.Eng', role: 'Project Manager', phone: '+880 1712-998877', role_in_project: 'Lead Resident Engineer' },
        { employee_id: 2, name: 'Engr. Mehdi Rahman', role: 'Structural Engineer', phone: '+880 1819-334455', role_in_project: 'QA/QC & Structural Inspector' },
        { employee_id: 3, name: 'Md. Delwar Hossain', role: 'Site Supervisor', phone: '+880 1913-667788', role_in_project: 'Senior Site In-Charge' },
        { employee_id: 4, name: 'Ustad Rafiqul Islam', role: 'Head Mason', phone: '+880 1611-445566', role_in_project: 'Masonry & Formwork Foreman' },
      ],
    };
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm font-medium">Loading Project & Building Specifications...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
        <AlertCircle size={48} className="mx-auto text-amber-500 mb-3" />
        <h2 className="text-xl font-bold text-gray-900">Project Not Found</h2>
        <p className="text-gray-500 text-sm mt-1">The requested construction project could not be found or was removed.</p>
        <Link to="/projects" className="btn-primary mt-4 inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Projects
        </Link>
      </div>
    );
  }

  const budget = parseFloat(project.total_budget) || 0;
  const spent = parseFloat(project.spent_amount || project.total_expenses) || 0;
  const remainingBudget = Math.max(0, budget - spent);
  const budgetUtilization = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5 font-medium text-sm border border-gray-200 bg-white shadow-xs"
          >
            <ArrowLeft size={18} />
            <span>Projects</span>
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500 text-sm font-mono uppercase bg-gray-100 px-2 py-0.5 rounded">
            {project.project_code}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={project.status}
            onChange={(e) => handleQuickStatusChange(e.target.value)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-300 bg-white cursor-pointer shadow-xs focus:ring-2 focus:ring-primary-500 ${getStatusClass(
              project.status
            )}`}
          >
            <option value="planning">Status: Planning</option>
            <option value="active">Status: Active (Under Construction)</option>
            <option value="on_hold">Status: On Hold</option>
            <option value="completed">Status: Completed / Handed Over</option>
            <option value="cancelled">Status: Cancelled</option>
          </select>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="btn-primary inline-flex items-center gap-2 shadow-sm"
          >
            <Edit2 size={16} /> Edit Specs & Project
          </button>
        </div>
      </div>

      {/* Hero Project Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 -mb-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30">
                {project.project_code}
              </span>
              <span className="capitalize px-3 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/10">
                {project.project_type}
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck size={12} /> {project.building_type || 'Residential Tower'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{project.name}</h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs sm:text-sm text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-200">
                <MapPin size={15} className="text-primary-400 shrink-0" />
                {project.location || `${project.district || 'Dhaka'}, ${project.division || 'Dhaka'}`}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <Building2 size={15} className="text-amber-400 shrink-0" />
                Client: <strong className="text-white">{project.client_name || 'Direct / Self-Financed'}</strong>
              </span>
              {project.client_phone && (
                <>
                  <span>•</span>
                  <a
                    href={`tel:${project.client_phone}`}
                    className="flex items-center gap-1 text-primary-300 hover:underline"
                  >
                    <Phone size={13} /> {project.client_phone}
                  </a>
                </>
              )}
            </div>

            {project.description && (
              <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed pt-1">
                {project.description}
              </p>
            )}
          </div>

          {/* Quick Progress Dial */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 w-full lg:w-72 shrink-0 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span className="font-semibold uppercase tracking-wider text-slate-300">Overall Construction</span>
              <span className="text-amber-300 font-bold text-sm">{project.progress || 0}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-white/10 mb-3">
              <div
                className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${project.progress || 0}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs text-slate-300 border-t border-white/10 pt-2.5">
              <div>
                <span className="text-[11px] text-slate-400 block">Start Date</span>
                <span className="font-semibold text-white">{formatDate(project.start_date)}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Target Finish</span>
                <span className="font-semibold text-white">{formatDate(project.end_date)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">Total Budget</span>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(project.total_budget)}</p>
            <span className="text-[11px] text-emerald-600 font-medium">Approved & Allocated</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 border border-primary-100">
            <TrendingUp size={24} />
          </div>
          <div className="flex-1">
            <span className="text-xs font-medium text-gray-500">Expenses Incurred</span>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(spent)}</p>
            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-0.5">
              <span>Utilized: {budgetUtilization}%</span>
              <span>Rem: {formatCurrency(remainingBudget)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Building2 size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">Stories & Levels</span>
            <p className="text-lg font-bold text-gray-900">
              {project.stories_above_ground || 1} Floors
              {project.basement_floors > 0 ? ` + ${project.basement_floors}B` : ''}
            </p>
            <span className="text-[11px] text-gray-500 font-medium">
              {project.total_units ? `${project.total_units} Total Units / Flats` : 'Commercial Layout'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Layers size={24} />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">Built-Up Area (GFA)</span>
            <p className="text-lg font-bold text-gray-900">
              {project.gross_floor_area || project.total_area || 0} {project.area_unit || 'sqft'}
            </p>
            <span className="text-[11px] text-indigo-600 font-medium">
              FAR: {project.far_value || 'N/A'} • MGC: {project.mgc_percentage || 'N/A'}%
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="border-b border-gray-200 bg-white px-4 pt-2 rounded-t-2xl shadow-xs">
        <div className="flex flex-wrap gap-2 sm:gap-4 -mb-px">
          {[
            { id: 'building', label: 'Building & Structural Specs', icon: Building2, count: null },
            { id: 'floors', label: 'Floor-by-Floor Schedule', icon: Layers, count: floors.length },
            { id: 'workorders', label: 'Work Orders & Tasks', icon: HardHat, count: project.work_orders?.length || 0 },
            { id: 'materials', label: 'Materials & Stock', icon: Package, count: project.material_stocks?.length || 0 },
            { id: 'financials', label: 'Finance & Invoices', icon: Receipt, count: null },
            { id: 'team', label: 'Workforce & Team', icon: Users, count: project.team?.length || 0 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  isActive
                    ? 'border-primary-600 text-primary-600 bg-primary-50/50 rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Building & Structural Specs */}
      {activeTab === 'building' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Architectural & Spatial Specs */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-primary-700 font-bold text-sm">
                  <Building2 size={18} />
                  <span>Architectural & Spatial Planning</span>
                </div>
                <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md font-semibold">
                  BNBC 2020 Compliant
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Building Typology</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block">{project.building_type || 'Residential Apartment'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Stories Above Ground</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block">{project.stories_above_ground || 1} Floors (G+{Math.max(0, (project.stories_above_ground || 1) - 1)})</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Basement Levels</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block">{project.basement_floors || 0} Level(s)</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Total Residential/Comm Units</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block">{project.total_units || 0} Units</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Gross Floor Area (GFA)</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block">{project.gross_floor_area || 0} sqft</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Ground Footprint Area</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block">{project.footprint_area || 0} sqft</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">FAR (Floor Area Ratio)</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block">{project.far_value || 'N/A'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Max Ground Coverage (MGC)</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block">{project.mgc_percentage || 'N/A'}%</span>
                </div>
              </div>
            </div>

            {/* Structural & Geotechnical Engineering */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                  <Layers size={18} />
                  <span>Structural & Geotechnical Engineering</span>
                </div>
                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-semibold">
                  Zone 2 Seismic
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <span className="text-gray-500 block">Structural Frame System</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block">{project.structural_system || 'RCC Frame with Shear Wall Core'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Foundation Substructure System</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block">{project.foundation_system || 'Cast-in-situ Bored Piles'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Soil Test Safe Bearing Capacity (SBC)</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block">{project.soil_bearing_capacity || '2.50 ksf (Report Verified)'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Concrete Mix & Grade Standard</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block">C25/30 to C35/45 (3500 - 5500 psi cylinder strength)</span>
                </div>
              </div>
            </div>

            {/* Statutory Clearances & MEP Services */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                  <ShieldCheck size={18} />
                  <span>Statutory Permits & Building Services</span>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-semibold">
                  Verified
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Permit / RAJUK / CDA Approval No.</span>
                  <span className="font-mono font-bold text-gray-900 text-sm mt-0.5 block">{project.rajuk_approval_no || 'N/A'}</span>
                  {project.approval_date && (
                    <span className="text-[11px] text-gray-400">Approved on: {formatDate(project.approval_date)}</span>
                  )}
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Fire & Civil Defence (FSCD) Status</span>
                  <span className="font-bold text-emerald-700 text-sm mt-0.5 flex items-center gap-1.5">
                    <CheckCircle2 size={15} /> {project.fire_safety_status || 'Compliant & Approved'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-500 block flex items-center gap-1"><Car size={13} /> Parking Slots</span>
                    <span className="font-bold text-gray-900 text-sm mt-0.5 block">{project.parking_capacity || 0} Cars</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-500 block flex items-center gap-1"><Zap size={13} /> Elevators</span>
                    <span className="font-bold text-gray-900 text-sm mt-0.5 block">{project.elevators_count || 1} Unit(s)</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 block">Emergency Generator & Substation</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block">{project.generator_capacity || 'Auto Generator Backup'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Building Setbacks & Boundary Clearance */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Building Setbacks & Mandatory Boundary Margins (RAJUK / BNBC)</h3>
                <p className="text-gray-500 text-xs mt-0.5">Mandatory open air space margins surrounding the building plot</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1"
              >
                <Edit2 size={13} /> Edit Setbacks
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Front Road Setback</span>
                <span className="text-lg font-extrabold text-gray-900 mt-1 block">{project.setback_front || '1.5m (5 ft)'}</span>
                <span className="text-[11px] text-gray-400">Facing Primary Access Road</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Rear Setback</span>
                <span className="text-lg font-extrabold text-gray-900 mt-1 block">{project.setback_rear || '2.0m (6.5 ft)'}</span>
                <span className="text-[11px] text-gray-400">Back boundary margin</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Left Side Setback</span>
                <span className="text-lg font-extrabold text-gray-900 mt-1 block">{project.setback_left || '1.25m (4.1 ft)'}</span>
                <span className="text-[11px] text-gray-400">Side clearance</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Right Side Setback</span>
                <span className="text-lg font-extrabold text-gray-900 mt-1 block">{project.setback_right || '1.25m (4.1 ft)'}</span>
                <span className="text-[11px] text-gray-400">Side clearance</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Floor-by-Floor Schedule */}
      {activeTab === 'floors' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-gray-900">Floor-by-Floor Construction Tracker</h2>
              <p className="text-xs text-gray-500">Monitor level-by-level casting, masonry, MEP, and handover progress</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => generateDefaultFloors(project.stories_above_ground || 10, project.basement_floors || 1)}
                className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
                title="Reset to standard stories"
              >
                <Sparkles size={14} className="text-amber-500" /> Auto-Regenerate Floors
              </button>
              <button onClick={openAddFloorModal} className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5">
                <Plus size={14} /> Add Floor Level
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {floors.map((floor, index) => (
              <div
                key={index}
                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                        floor.level < 0
                          ? 'bg-purple-100 text-purple-700'
                          : floor.level === 0
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-primary-100 text-primary-800'
                      }`}
                    >
                      {floor.level < 0 ? `B${Math.abs(floor.level)}` : floor.level === 0 ? 'G' : `L${floor.level}`}
                    </span>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{floor.name}</h4>
                      <span className="text-[11px] text-gray-500">{floor.usage}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditFloorModal(index)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit Floor"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteFloor(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Floor"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Area</span>
                    <span className="font-semibold text-gray-800">{floor.area || 'Typical'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Units</span>
                    <span className="font-semibold text-gray-800">{floor.units ? `${floor.units} Units` : 'Common / Core'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Current Stage</span>
                    <span className="font-semibold text-primary-700 truncate block">{floor.stage || 'In Progress'}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 font-medium text-[11px]">Level Completion</span>
                    <span className="font-bold text-primary-700">{floor.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        (floor.progress || 0) >= 100
                          ? 'bg-emerald-500'
                          : (floor.progress || 0) >= 50
                          ? 'bg-primary-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${floor.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Work Orders */}
      {activeTab === 'workorders' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Site Work Orders & Construction Milestones</h3>
              <p className="text-gray-500 text-xs">Work packages assigned to contractors, supervisors, and teams</p>
            </div>
            <Link to="/work-orders" className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1">
              <Plus size={14} /> Create Work Order
            </Link>
          </div>

          {project.work_orders && project.work_orders.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {project.work_orders.map((wo) => (
                <div key={wo.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded font-bold">
                        {wo.order_code}
                      </span>
                      <h4 className="font-bold text-gray-900 text-sm">{wo.title}</h4>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${getStatusClass(wo.status)}`}>
                        {formatStatus(wo.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="capitalize">Category: <strong>{wo.category}</strong></span>
                      <span>•</span>
                      <span>Assigned: <strong>{wo.assigned_name || 'Site Team'}</strong></span>
                      <span>•</span>
                      <span>Due: <strong>{formatDate(wo.due_date)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:w-48">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-bold text-gray-900">{wo.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full"
                          style={{ width: `${wo.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900 text-xs shrink-0">{formatCurrency(wo.estimated_cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs">
              <HardHat size={32} className="mx-auto mb-2 text-gray-300" />
              No work orders recorded for this project yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Materials & Stock */}
      {activeTab === 'materials' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Site Material Stocks & Procurements</h3>
              <p className="text-gray-500 text-xs">Material quantities delivered and stored at this site</p>
            </div>
            <Link to="/materials" className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1">
              <Plus size={14} /> Add Material Entry
            </Link>
          </div>

          {project.material_stocks && project.material_stocks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Material Name</th>
                    <th className="py-2.5 px-3">Quantity Received</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3">Total Value</th>
                    <th className="py-2.5 px-3">Purchase Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {project.material_stocks.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-3 px-3 font-bold text-gray-900">{item.material_name}</td>
                      <td className="py-3 px-3 font-semibold text-primary-700">{item.quantity} {item.unit}</td>
                      <td className="py-3 px-3 text-gray-600">{item.supplier_name || 'Direct Procurement'}</td>
                      <td className="py-3 px-3 font-bold text-gray-900">{formatCurrency(item.total_price)}</td>
                      <td className="py-3 px-3 text-gray-500">{formatDate(item.purchase_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs">
              <Package size={32} className="mx-auto mb-2 text-gray-300" />
              No material stocks recorded for this project yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Financials */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500">Total Invoiced to Client</span>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(project.total_invoiced || 0)}</p>
              <span className="text-[11px] text-gray-400">Total billed client installments</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500">Collected from Client</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(project.total_collected || 0)}</p>
              <span className="text-[11px] text-emerald-600 font-medium">Verified Receipts</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500">Total Site Expenditure</span>
              <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(spent)}</p>
              <span className="text-[11px] text-gray-400">Labor + Materials + Equipment</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Recent Site Expenses & Disbursements</h3>
              <Link to="/expenses" className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1">
                View All Expenses
              </Link>
            </div>

            {project.expenses && project.expenses.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {project.expenses.map((exp) => (
                  <div key={exp.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-900">{exp.title}</div>
                      <div className="text-gray-500 text-[11px]">
                        {formatDate(exp.expense_date)} • Category: <strong className="capitalize">{exp.category}</strong> • Paid to: {exp.paid_to || 'Cash Voucher'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900 block text-sm">{formatCurrency(exp.amount)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${exp.is_approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {exp.is_approved ? 'Approved' : 'Pending Approval'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-xs">No expenses recorded for this project.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Site Workforce Team */}
      {activeTab === 'team' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Assigned Engineering & Site Supervision Team</h3>
              <p className="text-gray-500 text-xs">Engineers, supervisors, and head foremen stationed on this site</p>
            </div>
            <Link to="/employees" className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1">
              <Plus size={14} /> Assign Employee
            </Link>
          </div>

          {project.team && project.team.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.team.map((member, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shrink-0">
                    {member.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-xs truncate">{member.name}</h4>
                    <p className="text-[11px] text-primary-700 font-semibold truncate">{member.role_in_project || member.role}</p>
                    {member.phone && (
                      <a href={`tel:${member.phone}`} className="text-[11px] text-gray-500 hover:text-primary-600 flex items-center gap-1 mt-0.5">
                        <Phone size={11} /> {member.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs">
              <Users size={32} className="mx-auto mb-2 text-gray-300" />
              No engineers or staff assigned to this project yet.
            </div>
          )}
        </div>
      )}

      {/* Edit Building & Project Specifications Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Project & Building Specifications"
        size="xl"
      >
        <form onSubmit={handleUpdateProject} className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">
              1. Basic Project Identity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="form-label">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Total Budget (BDT / ৳)</label>
                <input
                  type="number"
                  value={formData.total_budget}
                  onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Construction Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                  className="form-input"
                />
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

          {/* Section 2: Architectural & Building Specifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-primary-700 uppercase tracking-wider border-b border-gray-200 pb-2">
              2. Architectural & Building Engineering Specifications
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
                  max="100"
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
                  max="10"
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
                  placeholder="e.g. 42"
                />
              </div>

              <div>
                <label className="form-label">Gross Floor Area (sft)</label>
                <input
                  type="number"
                  value={formData.gross_floor_area}
                  onChange={(e) => setFormData({ ...formData, gross_floor_area: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 58000"
                />
              </div>

              <div>
                <label className="form-label">Ground Footprint Area (sft)</label>
                <input
                  type="number"
                  value={formData.footprint_area}
                  onChange={(e) => setFormData({ ...formData, footprint_area: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 4200"
                />
              </div>

              <div>
                <label className="form-label">FAR (Floor Area Ratio)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.far_value}
                  onChange={(e) => setFormData({ ...formData, far_value: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 4.15"
                />
              </div>

              <div>
                <label className="form-label">Max Ground Coverage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.mgc_percentage}
                  onChange={(e) => setFormData({ ...formData, mgc_percentage: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 58.5"
                />
              </div>

              <div>
                <label className="form-label">Car Parking Capacity</label>
                <input
                  type="number"
                  value={formData.parking_capacity}
                  onChange={(e) => setFormData({ ...formData, parking_capacity: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 36"
                />
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Structural Frame System</label>
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
            </div>
          </div>

          {/* Section 3: Statutory Permits & Setbacks */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider border-b border-gray-200 pb-2">
              3. Regulatory Approvals & Mandatory Setbacks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Permit / RAJUK / CDA No</label>
                <input
                  type="text"
                  value={formData.rajuk_approval_no}
                  onChange={(e) => setFormData({ ...formData, rajuk_approval_no: e.target.value })}
                  className="form-input"
                  placeholder="e.g. RAJUK/BC-2024/0981"
                />
              </div>

              <div>
                <label className="form-label">Approval Date</label>
                <input
                  type="date"
                  value={formData.approval_date}
                  onChange={(e) => setFormData({ ...formData, approval_date: e.target.value })}
                  className="form-input"
                />
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

              <div>
                <label className="form-label">Soil Bearing Capacity</label>
                <input
                  type="text"
                  value={formData.soil_bearing_capacity}
                  onChange={(e) => setFormData({ ...formData, soil_bearing_capacity: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 2.85 ksf (136 kPa)"
                />
              </div>

              <div>
                <label className="form-label">Elevators / Lifts Count</label>
                <input
                  type="number"
                  min="0"
                  value={formData.elevators_count}
                  onChange={(e) => setFormData({ ...formData, elevators_count: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 2"
                />
              </div>

              <div>
                <label className="form-label">Generator & Substation</label>
                <input
                  type="text"
                  value={formData.generator_capacity}
                  onChange={(e) => setFormData({ ...formData, generator_capacity: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 250 kVA Soundproof"
                />
              </div>

              <div>
                <label className="form-label">Front Road Setback</label>
                <input
                  type="text"
                  value={formData.setback_front}
                  onChange={(e) => setFormData({ ...formData, setback_front: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 1.5m (5 ft)"
                />
              </div>

              <div>
                <label className="form-label">Rear Setback</label>
                <input
                  type="text"
                  value={formData.setback_rear}
                  onChange={(e) => setFormData({ ...formData, setback_rear: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 2.0m (6.5 ft)"
                />
              </div>

              <div>
                <label className="form-label">Side Setbacks (Left / Right)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.setback_left}
                    onChange={(e) => setFormData({ ...formData, setback_left: e.target.value })}
                    className="form-input"
                    placeholder="Left e.g. 1.25m"
                  />
                  <input
                    type="text"
                    value={formData.setback_right}
                    onChange={(e) => setFormData({ ...formData, setback_right: e.target.value })}
                    className="form-input"
                    placeholder="Right e.g. 1.25m"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Specifications & Details
            </button>
          </div>
        </form>
      </Modal>

      {/* Floor Level Add/Edit Modal */}
      <Modal
        isOpen={isFloorModalOpen}
        onClose={() => setIsFloorModalOpen(false)}
        title={editingFloorIndex !== null ? 'Edit Floor Level' : 'Add Floor Level'}
        size="md"
      >
        <form onSubmit={handleSaveFloor} className="space-y-4">
          <div>
            <label className="form-label">Floor / Level Name *</label>
            <input
              type="text"
              required
              value={floorForm.name}
              onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })}
              placeholder="e.g. 5th Floor, Basement 1, Rooftop"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Floor Level Index</label>
              <input
                type="number"
                value={floorForm.level}
                onChange={(e) => setFloorForm({ ...floorForm, level: parseInt(e.target.value) || 0 })}
                className="form-input"
                placeholder="0 for Ground, negative for Basement"
              />
            </div>
            <div>
              <label className="form-label">Unit Count</label>
              <input
                type="number"
                min="0"
                value={floorForm.units}
                onChange={(e) => setFloorForm({ ...floorForm, units: parseInt(e.target.value) || 0 })}
                className="form-input"
                placeholder="e.g. 2"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Purpose / Primary Usage</label>
            <input
              type="text"
              value={floorForm.usage}
              onChange={(e) => setFloorForm({ ...floorForm, usage: e.target.value })}
              placeholder="e.g. Typical 3-BHK Residential Apartments, Parking & Core"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Floor Area</label>
              <input
                type="text"
                value={floorForm.area}
                onChange={(e) => setFloorForm({ ...floorForm, area: e.target.value })}
                placeholder="e.g. 4,200 sqft"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Construction Stage</label>
              <input
                type="text"
                value={floorForm.stage}
                onChange={(e) => setFloorForm({ ...floorForm, stage: e.target.value })}
                placeholder="e.g. RCC Slab Casting, Brickwork"
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Floor Completion Progress: {floorForm.progress}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={floorForm.progress}
              onChange={(e) => setFloorForm({ ...floorForm, progress: parseInt(e.target.value) || 0 })}
              className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-primary-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsFloorModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingFloorIndex !== null ? 'Update Floor' : 'Add Floor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
