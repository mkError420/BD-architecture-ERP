import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { projectsAPI } from '../../api';
import { Info, Calendar, DollarSign, MapPin, Building2, CheckCircle2, ArrowLeft, Layers, ShieldCheck, FileSpreadsheet, Truck, Wrench, Users, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

const DEMO_PROJECT = {
  id: 1,
  project_code: 'PRJ-2025-001',
  name: 'Gulshan Grand Tower',
  description: 'Luxury 18-story residential and commercial complex with 2 basements, rooftop infinity pool, and state-of-the-art earthquake resistant design.',
  building_type: 'commercial_residential',
  status: 'in_progress',
  start_date: '2024-01-15',
  end_date: '2026-12-30',
  total_budget: 125000000,
  location: 'Road 11, Plot 45, Gulshan-2, Dhaka',
  district: 'Dhaka',
  stories_above_ground: 18,
  basement_floors: 2,
  total_units: 64,
  gross_floor_area: 125000,
  structural_system: 'RCC Frame with Shear Walls',
  foundation_system: 'Deep Cast-in-Situ Bored Piles',
  rajuk_approval_no: 'RAJUK/BP/2023/11894',
  client_name: 'Metro Properties Ltd.',
};

export default function ProjectInfo() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const res = await projectsAPI.getOne(projectId);
      if (res.data?.success && res.data?.data) {
        setProject(res.data.data);
      } else {
        setProject({ ...DEMO_PROJECT, id: projectId });
      }
    } catch (err) {
      console.warn('Failed to load project from API, using demo data:', err);
      setProject({ ...DEMO_PROJECT, id: projectId });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const p = project || DEMO_PROJECT;

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div>
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Project Overview
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}>
            <Info size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Information</h1>
            <p className="text-gray-500 text-sm font-mono">{p.project_code || `PRJ-${projectId}`}</p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase mb-1">
            <Building2 size={16} className="text-blue-500" />
            <span>Project Name</span>
          </div>
          <p className="font-bold text-gray-900 text-lg">{p.name}</p>
          {p.client_name && <p className="text-xs text-gray-500 mt-0.5">Client: {p.client_name}</p>}
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase mb-1">
            <DollarSign size={16} className="text-emerald-500" />
            <span>Total Budget</span>
          </div>
          <p className="font-bold text-emerald-600 text-lg">{formatCurrency(p.total_budget || 0)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Allocated project budget</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase mb-1">
            <CheckCircle2 size={16} className="text-indigo-500" />
            <span>Project Status</span>
          </div>
          <span className="inline-block mt-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full capitalize">
            {(p.status || 'in_progress').replace('_', ' ')}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase mb-1">
            <Calendar size={16} className="text-purple-500" />
            <span>Project Timeline</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{formatDate(p.start_date)} → {formatDate(p.end_date)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase mb-1">
            <MapPin size={16} className="text-red-500" />
            <span>Site Location</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{p.location || p.district || 'Dhaka, Bangladesh'}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase mb-1">
            <ShieldCheck size={16} className="text-amber-500" />
            <span>Statutory Approval</span>
          </div>
          <p className="font-mono text-sm font-semibold text-gray-900">{p.rajuk_approval_no || 'Pending Approval'}</p>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-2">Scope & Description</h2>
        <p className="text-gray-600 text-sm leading-relaxed">{p.description || 'No description recorded.'}</p>
      </div>

      {/* Building Specifications */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Layers size={18} className="text-blue-600" />
          Structural & Architectural Specifications
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500">Building Type</p>
            <p className="font-semibold text-gray-900 text-sm mt-0.5 capitalize">{(p.building_type || 'N/A').replace('_', ' ')}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500">Above Ground Stories</p>
            <p className="font-semibold text-gray-900 text-sm mt-0.5">{p.stories_above_ground || 'N/A'} Floors</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500">Basement Floors</p>
            <p className="font-semibold text-gray-900 text-sm mt-0.5">{p.basement_floors || '0'} Floors</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500">Total Units</p>
            <p className="font-semibold text-gray-900 text-sm mt-0.5">{p.total_units || 'N/A'} Units</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500">Gross Floor Area</p>
            <p className="font-semibold text-gray-900 text-sm mt-0.5">{Number(p.gross_floor_area || 0).toLocaleString()} sq.ft.</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500">Structural System</p>
            <p className="font-semibold text-gray-900 text-sm mt-0.5">{p.structural_system || 'RCC Frame'}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500">Foundation System</p>
            <p className="font-semibold text-gray-900 text-sm mt-0.5">{p.foundation_system || 'Cast-in-Situ Piles'}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500">Approval Authority</p>
            <p className="font-semibold text-gray-900 text-sm mt-0.5">{p.rajuk_approval_no ? 'RAJUK Approved' : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Quick Navigation to Project Sections */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4">Project Overview Sections</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <Link to={`/projects/${projectId}/payments`} className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-xs font-medium text-gray-700">
            <DollarSign size={16} className="text-emerald-600" /> Client Payments
          </Link>
          <Link to={`/projects/${projectId}/security-deposits`} className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-xs font-medium text-gray-700">
            <ShieldCheck size={16} className="text-amber-600" /> Security Deposits
          </Link>
          <Link to={`/projects/${projectId}/boq`} className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-xs font-medium text-gray-700">
            <FileSpreadsheet size={16} className="text-blue-600" /> BOQ Items
          </Link>
          <Link to={`/projects/${projectId}/schedule`} className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-xs font-medium text-gray-700">
            <Calendar size={16} className="text-purple-600" /> Project Schedule
          </Link>
          <Link to={`/projects/${projectId}/purchases`} className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-xs font-medium text-gray-700">
            <Layers size={16} className="text-teal-600" /> Material Purchases
          </Link>
          <Link to={`/projects/${projectId}/stock`} className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-xs font-medium text-gray-700">
            <Building2 size={16} className="text-cyan-600" /> Stock Management
          </Link>
          <Link to={`/projects/${projectId}/labour-wages`} className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-xs font-medium text-gray-700">
            <Users size={16} className="text-yellow-600" /> Labour Wages
          </Link>
          <Link to={`/projects/${projectId}/tools/inventory`} className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-xs font-medium text-gray-700">
            <Wrench size={16} className="text-sky-600" /> Tools & Plant
          </Link>
          <Link to={`/projects/${projectId}/salary-slips`} className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-xs font-medium text-gray-700">
            <CreditCard size={16} className="text-indigo-600" /> Staff Salaries
          </Link>
          <Link to={`/projects/${projectId}/vehicles`} className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-xs font-medium text-gray-700">
            <Truck size={16} className="text-amber-600" /> Vehicle Work Slips
          </Link>
        </div>
      </div>
    </div>
  );
}
