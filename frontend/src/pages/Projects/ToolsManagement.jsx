import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { toolsAPI } from '../../api';
import { Wrench, Plus, Edit, Trash2, ArrowLeft, CheckCircle2, Clock, AlertTriangle, ShieldAlert, Package, Search, Filter } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/helpers';

const DEMO_TOOLS = [
  {
    id: 1,
    tool_code: 'TL-2025-0101',
    tool_name: 'Concrete Mixer Machine (1 Bag)',
    category: 'heavy_machinery',
    brand: 'Honda GX390',
    model: 'CM-350L',
    serial_number: 'SN-HN88291',
    purchase_date: '2024-06-15',
    purchase_price: 145000,
    current_value: 125000,
    tool_condition: 'good',
    location: 'Site Yard A',
    status: 'assigned',
    notes: 'Assigned to Block B foundation team',
  },
  {
    id: 2,
    tool_code: 'TL-2025-0102',
    tool_name: 'Digital Total Station Survey Instrument',
    category: 'measuring',
    brand: 'Leica Geosystems',
    model: 'FlexLine TS07',
    serial_number: 'SN-LC2091',
    purchase_date: '2024-03-10',
    purchase_price: 520000,
    current_value: 480000,
    tool_condition: 'excellent',
    location: 'Survey Office',
    status: 'available',
    notes: 'Calibrated in January 2025',
  },
  {
    id: 3,
    tool_code: 'TL-2025-0103',
    tool_name: 'Heavy Duty Rebar Cutting & Bending Machine',
    category: 'power_tools',
    brand: 'Makita',
    model: 'SC190DRG',
    serial_number: 'SN-MK7723',
    purchase_date: '2024-08-20',
    purchase_price: 85000,
    current_value: 75000,
    tool_condition: 'good',
    location: 'Rebar Yard',
    status: 'assigned',
    notes: 'Handles up to 32mm deformed bar',
  },
  {
    id: 4,
    tool_code: 'TL-2025-0104',
    tool_name: 'Rotary Hammer Drill SDS-Max',
    category: 'power_tools',
    brand: 'Bosch Professional',
    model: 'GBH 8-45 D',
    serial_number: 'SN-BS9012',
    purchase_date: '2024-09-01',
    purchase_price: 48000,
    current_value: 42000,
    tool_condition: 'good',
    location: 'Store Room 1',
    status: 'available',
    notes: 'Includes 5 chisel bits and grease tube',
  },
  {
    id: 5,
    tool_code: 'TL-2025-0105',
    tool_name: 'Submersible Dewatering Water Pump',
    category: 'heavy_machinery',
    brand: 'Tsurumi Pump',
    model: 'KRS2-80',
    serial_number: 'SN-TS4410',
    purchase_date: '2024-05-18',
    purchase_price: 62000,
    current_value: 45000,
    tool_condition: 'fair',
    location: 'Basement Sump',
    status: 'in_maintenance',
    notes: 'Impeller seal replacement in progress',
  },
  {
    id: 6,
    tool_code: 'TL-2025-0106',
    tool_name: 'Full Body Fall Arrest Safety Harness Set (10 Pcs)',
    category: 'safety_equipment',
    brand: 'Honeywell',
    model: 'Miller Titan',
    serial_number: 'SN-HW-LOT2',
    purchase_date: '2024-11-10',
    purchase_price: 35000,
    current_value: 32000,
    tool_condition: 'excellent',
    location: 'Safety Locker',
    status: 'available',
    notes: 'Inspected for high-rise scaffolding workers',
  },
];

export default function ToolsManagement() {
  const { projectId } = useParams();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const initialForm = {
    project_id: projectId,
    tool_name: '',
    tool_code: '',
    category: 'power_tools',
    brand: '',
    model: '',
    serial_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: '',
    current_value: '',
    tool_condition: 'good',
    location: 'Main Site Store',
    status: 'available',
    notes: '',
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    loadTools();
  }, [projectId]);

  const loadTools = async () => {
    setLoading(true);
    try {
      const res = await toolsAPI.getAll({ type: 'inventory', per_page: 100 });
      const records = res.data?.data?.data || res.data?.data || [];
      if (Array.isArray(records) && records.length > 0) {
        setTools(records);
        setIsDemo(false);
      } else {
        setTools(DEMO_TOOLS);
        setIsDemo(true);
      }
    } catch (err) {
      console.warn('Tools API failed, showing demo data:', err);
      setTools(DEMO_TOOLS);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedTool(null);
    setFormData({
      ...initialForm,
      tool_code: `TL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      project_id: projectId,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (tool) => {
    setSelectedTool(tool);
    setFormData({
      project_id: projectId,
      tool_name: tool.tool_name || '',
      tool_code: tool.tool_code || '',
      category: tool.category || 'power_tools',
      brand: tool.brand || '',
      model: tool.model || '',
      serial_number: tool.serial_number || '',
      purchase_date: tool.purchase_date || new Date().toISOString().split('T')[0],
      purchase_price: tool.purchase_price || '',
      current_value: tool.current_value || tool.purchase_price || '',
      tool_condition: tool.tool_condition || tool.condition || 'good',
      location: tool.location || '',
      status: tool.status || 'available',
      notes: tool.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (tool) => {
    setSelectedTool(tool);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      type: 'inventory',
      purchase_price: parseFloat(formData.purchase_price) || 0,
      current_value: parseFloat(formData.current_value) || parseFloat(formData.purchase_price) || 0,
      tool_condition: formData.tool_condition,
      condition: formData.tool_condition,
    };

    try {
      if (selectedTool) {
        if (isDemo) {
          setTools(prev => prev.map(t => t.id === selectedTool.id ? { ...t, ...payload } : t));
          toast.success('Tool updated successfully!');
        } else {
          await toolsAPI.update(selectedTool.id, payload);
          toast.success('Tool updated successfully!');
          loadTools();
        }
      } else {
        if (isDemo) {
          const newTool = {
            id: Date.now(),
            ...payload,
          };
          setTools(prev => [newTool, ...prev]);
          toast.success('Tool added to inventory!');
        } else {
          await toolsAPI.create(payload);
          toast.success('Tool added to inventory!');
          loadTools();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      if (isDemo) {
        setTools(prev => prev.filter(t => t.id !== selectedTool.id));
        toast.success('Tool removed from inventory');
      } else {
        await toolsAPI.delete(selectedTool.id, { type: 'inventory' });
        toast.success('Tool removed from inventory');
        loadTools();
      }
      setIsDeleteOpen(false);
    } catch {
      toast.error('Failed to delete tool');
    }
  };

  // KPIs
  const stats = useMemo(() => {
    const totalCount = tools.length;
    const available = tools.filter(t => t.status === 'available').length;
    const assigned = tools.filter(t => t.status === 'assigned').length;
    const maintenance = tools.filter(t => t.status === 'in_maintenance' || t.status === 'damaged' || t.status === 'retired').length;
    const totalValue = tools.reduce((sum, t) => sum + (parseFloat(t.current_value || t.purchase_price) || 0), 0);
    return { totalCount, available, assigned, maintenance, totalValue };
  }, [tools]);

  // Filtered tools
  const filteredTools = useMemo(() => {
    return tools.filter(t => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesSearch = !searchTerm ||
        (t.tool_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.tool_code?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.brand?.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [tools, statusFilter, searchTerm]);

  const columns = [
    {
      header: 'Tool Code',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
          {row.tool_code}
        </span>
      ),
    },
    {
      header: 'Tool / Equipment',
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.tool_name}</div>
          <div className="text-xs text-gray-500">
            {[row.brand, row.model].filter(Boolean).join(' • ') || 'Standard Model'}
            {row.location && <span className="ml-2 text-gray-400">📍 {row.location}</span>}
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      render: (row) => (
        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 capitalize">
          {(row.category || 'other').replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => {
        const s = row.status || 'available';
        const styles = {
          available: 'bg-green-100 text-green-800',
          assigned: 'bg-blue-100 text-blue-800',
          in_maintenance: 'bg-amber-100 text-amber-800',
          retired: 'bg-red-100 text-red-800',
          damaged: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[s] || 'bg-gray-100 text-gray-800'}`}>
            {s === 'available' && <CheckCircle2 size={12} />}
            {s === 'assigned' && <Package size={12} />}
            {s === 'in_maintenance' && <Clock size={12} />}
            {(s === 'damaged' || s === 'retired') && <ShieldAlert size={12} />}
            {s.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      header: 'Condition',
      render: (row) => {
        const cond = row.tool_condition || row.condition || 'good';
        const colors = {
          excellent: 'text-emerald-600 font-semibold',
          good: 'text-blue-600',
          fair: 'text-amber-600',
          poor: 'text-orange-600',
          broken: 'text-red-600 font-bold',
        };
        return <span className={`text-xs capitalize ${colors[cond] || 'text-gray-600'}`}>{cond}</span>;
      },
    },
    {
      header: 'Value (৳)',
      render: (row) => (
        <div className="text-xs">
          <div className="font-bold text-gray-900">{formatCurrency(row.current_value || row.purchase_price || 0)}</div>
          {row.purchase_date && <div className="text-gray-400">{formatDate(row.purchase_date)}</div>}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
            title="Edit"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={() => handleDeleteClick(row)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)' }}>
              <Wrench size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tools & Machinery Management</h1>
              <p className="text-gray-500 text-sm">Track heavy equipment, power tools, safety gear and on-site assignments</p>
            </div>
          </div>
          <button onClick={handleAddNew} className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto">
            <Plus size={18} /> Add Tool / Machinery
          </button>
        </div>
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
          <AlertTriangle size={16} className="shrink-0 text-amber-600" />
          <span>Showing sample tools inventory. Add your equipment or machinery to track site deployment and maintenance.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Tools</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Wrench size={18} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.totalCount}</div>
          <span className="text-xs text-gray-500">Asset Value: {formatCurrency(stats.totalValue)}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Available</span>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={18} /></div>
          </div>
          <div className="text-2xl font-bold text-green-600 mt-2">{stats.available}</div>
          <span className="text-xs text-green-600 font-medium">Ready in store yard</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Deployed / Assigned</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Package size={18} /></div>
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">{stats.assigned}</div>
          <span className="text-xs text-gray-500 font-medium">In active site use</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">In Maintenance</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock size={18} /></div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{stats.maintenance}</div>
          <span className="text-xs text-gray-500">Servicing or repaired</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tool name, brand, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['all', 'available', 'assigned', 'in_maintenance'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize shrink-0 ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <DataTable columns={columns} data={filteredTools} loading={loading} />
      </div>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedTool ? 'Edit Tool / Equipment' : 'Add New Tool'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Tool / Machine Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Concrete Mixer Machine, Rotary Hammer Drill"
                value={formData.tool_name}
                onChange={(e) => setFormData({ ...formData, tool_name: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Tool Code</label>
              <input
                type="text"
                value={formData.tool_code}
                onChange={(e) => setFormData({ ...formData, tool_code: e.target.value })}
                className="form-input font-mono"
              />
            </div>

            <div>
              <label className="form-label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-input"
              >
                <option value="power_tools">Power Tools</option>
                <option value="hand_tools">Hand Tools</option>
                <option value="heavy_machinery">Heavy Machinery / Plant</option>
                <option value="measuring">Measuring & Surveying</option>
                <option value="safety_equipment">Safety Equipment</option>
                <option value="vehicles">Vehicles / Moving Plant</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="form-label">Brand / Manufacturer</label>
              <input
                type="text"
                placeholder="e.g. Bosch, Makita, Leica"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Model / Spec</label>
              <input
                type="text"
                placeholder="e.g. GBH 8-45 D, CM-350L"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Serial Number</label>
              <input
                type="text"
                placeholder="SN-123456"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="form-input font-mono"
              />
            </div>

            <div>
              <label className="form-label">Condition</label>
              <select
                value={formData.tool_condition}
                onChange={(e) => setFormData({ ...formData, tool_condition: e.target.value })}
                className="form-input"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="broken">Broken / Out of Order</option>
              </select>
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-input"
              >
                <option value="available">Available (In Store)</option>
                <option value="assigned">Assigned / On Site</option>
                <option value="in_maintenance">In Maintenance</option>
                <option value="retired">Retired / Scrapped</option>
              </select>
            </div>

            <div>
              <label className="form-label">Storage Location / Yard</label>
              <input
                type="text"
                placeholder="e.g. Site Yard A, Store Room 2"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Purchase Date</label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Purchase Price (৳)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Current Value (৳)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Notes / Deployment Details</label>
              <textarea
                rows="2"
                placeholder="Assigned team, operator instructions, warranty info..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="form-input"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {selectedTool ? 'Update Tool' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Tool"
        message="Are you sure you want to remove this tool from the inventory? This action cannot be undone."
      />
    </div>
  );
}
