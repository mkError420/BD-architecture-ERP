import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { stockAPI, projectsAPI, materialsAPI } from '../../api';
import {
  Package, Plus, Edit2, Trash2, ArrowLeft, AlertCircle,
  TrendingUp, TrendingDown, RotateCcw, CheckCircle2, Clock,
  XCircle, Truck, AlertTriangle, Layers, ArrowRight
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency } from '../../utils/helpers';

// Demo data fallbacks
const DEMO_INVENTORY = [
  { id: 1, material_name: 'BSRM Rebar 16mm (500W)', category: 'Steel & Rebar', quantity: 25, unit: 'ton', unit_price: 95000, total_value: 2375000, min_stock_level: 5, location: 'Yard Section A', notes: 'Structural framing rebar' },
  { id: 2, material_name: 'Seven Rings Portland Cement', category: 'Cement', quantity: 1200, unit: 'bag', unit_price: 590, total_value: 708000, min_stock_level: 200, location: 'Covered Store #1', notes: 'Shed dry stored' },
  { id: 3, material_name: 'Sylhet Coarse Sand (FM 2.5)', category: 'Sand & Aggregates', quantity: 8500, unit: 'cft', unit_price: 45, total_value: 382500, min_stock_level: 2000, location: 'Stockpile Bay 2', notes: 'RCC concrete mixture' },
  { id: 4, material_name: 'Gas Burnt Auto Bricks 1st Class', category: 'Bricks & Blocks', quantity: 35000, unit: 'pcs', unit_price: 13, total_value: 455000, min_stock_level: 5000, location: 'Site Ground East', notes: 'Wall partitioning' },
  { id: 5, material_name: 'Stone Chips 3/4 Inch (Down)', category: 'Sand & Aggregates', quantity: 4200, unit: 'cft', unit_price: 180, total_value: 756000, min_stock_level: 1000, location: 'Stockpile Bay 1', notes: 'Bholaganj graded' },
];

const DEMO_TRANSFERS = [
  { id: 1, transfer_code: 'ST-202508-001', material_name: 'BSRM Rebar 16mm', quantity: 10, unit: 'ton', from_project_name: 'Central Warehouse (Gazipur)', to_project_name: 'Gulshan Tower Project', transfer_date: '2025-08-02', status: 'completed', notes: 'Dispatched on Truck DHA-11-2244' },
  { id: 2, transfer_code: 'ST-202508-002', material_name: 'Seven Rings Cement', quantity: 500, unit: 'bag', from_project_name: 'Banani Commercial Hub', to_project_name: 'Gulshan Tower Project', transfer_date: '2025-08-10', status: 'in_transit', notes: 'Surplus cement transfer' },
  { id: 3, transfer_code: 'ST-202508-003', material_name: 'Scaffolding Pipe 20ft', quantity: 150, unit: 'pcs', from_project_name: 'Gulshan Tower Project', to_project_name: 'Uttara Residential Villa', transfer_date: '2025-08-18', status: 'pending', notes: 'Awaiting site manager approval' },
];

const DEMO_ADJUSTMENTS = [
  { id: 1, adjustment_code: 'SA-202508-001', material_name: 'Seven Rings Cement', adjustment_type: 'damage', previous_quantity: 1250, adjusted_quantity: 1200, difference: -50, unit: 'bag', adjustment_date: '2025-08-08', reason: 'Rain water seepage damaged 50 bags during storm' },
  { id: 2, adjustment_code: 'SA-202508-002', material_name: 'Gas Burnt Auto Bricks', adjustment_type: 'loss', previous_quantity: 36000, adjusted_quantity: 35000, difference: -1000, unit: 'pcs', adjustment_date: '2025-08-14', reason: 'Handling breakage during unstacking' },
  { id: 3, adjustment_code: 'SA-202508-003', material_name: 'BSRM Rebar 16mm', adjustment_type: 'correction', previous_quantity: 24, adjusted_quantity: 25, difference: 1, unit: 'ton', adjustment_date: '2025-08-20', reason: 'Weighbridge recount correction' },
];

const TRANSFER_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 },
  in_transit: { label: 'In Transit', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Truck },
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

const ADJUSTMENT_TYPE_CONFIG = {
  damage: { label: 'Damage', color: 'bg-red-50 text-red-700 border-red-200' },
  loss: { label: 'Loss', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  theft: { label: 'Theft', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  expired: { label: 'Expired', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  correction: { label: 'Correction', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  quality_issue: { label: 'Quality Issue', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export default function StockManagement() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab determine: 'inventory', 'transfers', 'adjustments'
  const activeTab = location.pathname.includes('/transfers')
    ? 'transfers'
    : location.pathname.includes('/adjustments')
    ? 'adjustments'
    : 'inventory';

  const [items, setItems] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  // Form states
  const initInventoryForm = () => ({
    type: 'inventory',
    project_id: projectId,
    material_name: '',
    category: 'General',
    quantity: '',
    unit: 'piece',
    unit_price: '',
    total_value: '',
    min_stock_level: '',
    location: 'Site Store',
    notes: '',
  });

  const initTransferForm = () => ({
    type: 'transfers',
    from_project_id: '',
    to_project_id: projectId,
    material_name: '',
    quantity: '',
    unit: 'piece',
    transfer_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: '',
  });

  const initAdjustmentForm = () => ({
    type: 'adjustments',
    project_id: projectId,
    material_name: '',
    adjustment_type: 'correction',
    previous_quantity: '',
    adjusted_quantity: '',
    difference: '',
    unit: 'piece',
    adjustment_date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const [formData, setFormData] = useState(initInventoryForm());

  useEffect(() => {
    loadAll();
  }, [projectId, activeTab]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [stkRes, projRes, allProjRes] = await Promise.allSettled([
        stockAPI.getAll({ project_id: projectId, type: activeTab }),
        projectsAPI.getOne(projectId),
        projectsAPI.getAll({ per_page: 50 }),
      ]);

      if (stkRes.status === 'fulfilled' && stkRes.value?.data) {
        const raw = stkRes.value.data;
        const list = Array.isArray(raw.data) ? raw.data : (Array.isArray(raw.data?.data) ? raw.data.data : (Array.isArray(raw) ? raw : null));
        if (list !== null) {
          setItems(list);
          setIsDemo(false);
        } else {
          setDemoData();
        }
      } else {
        setDemoData();
      }

      if (projRes.status === 'fulfilled' && projRes.value?.data) {
        setProject(projRes.value.data.data || projRes.value.data);
      }
      if (allProjRes.status === 'fulfilled' && allProjRes.value?.data) {
        const pList = allProjRes.value.data;
        setAllProjects(Array.isArray(pList.data) ? pList.data : (Array.isArray(pList) ? pList : []));
      }
    } catch {
      setDemoData();
    } finally {
      setLoading(false);
    }
  };

  const setDemoData = () => {
    setIsDemo(true);
    if (activeTab === 'inventory') setItems(DEMO_INVENTORY);
    else if (activeTab === 'transfers') setItems(DEMO_TRANSFERS);
    else setItems(DEMO_ADJUSTMENTS);
  };

  const handleTabSwitch = (tab) => {
    navigate(`/projects/${projectId}/stock/${tab}`);
  };

  const openCreate = () => {
    setSelectedItem(null);
    if (activeTab === 'inventory') setFormData(initInventoryForm());
    else if (activeTab === 'transfers') setFormData(initTransferForm());
    else setFormData(initAdjustmentForm());
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    if (activeTab === 'inventory') {
      setFormData({
        type: 'inventory',
        project_id: projectId,
        material_name: item.material_name || '',
        category: item.category || 'General',
        quantity: item.quantity || '',
        unit: item.unit || 'piece',
        unit_price: item.unit_price || '',
        total_value: item.total_value || '',
        min_stock_level: item.min_stock_level || '',
        location: item.location || 'Site Store',
        notes: item.notes || '',
      });
    } else if (activeTab === 'transfers') {
      setFormData({
        type: 'transfers',
        from_project_id: item.from_project_id || '',
        to_project_id: item.to_project_id || projectId,
        material_name: item.material_name || '',
        quantity: item.quantity || '',
        unit: item.unit || 'piece',
        transfer_date: item.transfer_date || '',
        status: item.status || 'pending',
        notes: item.notes || '',
      });
    } else {
      setFormData({
        type: 'adjustments',
        project_id: projectId,
        material_name: item.material_name || '',
        adjustment_type: item.adjustment_type || 'correction',
        previous_quantity: item.previous_quantity || '',
        adjusted_quantity: item.adjusted_quantity || '',
        difference: item.difference || '',
        unit: item.unit || 'piece',
        adjustment_date: item.adjustment_date || '',
        reason: item.reason || '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        project_id: projectId,
        type: activeTab,
        quantity: parseFloat(formData.quantity) || 0,
        unit_price: parseFloat(formData.unit_price) || 0,
        total_value: formData.total_value ? parseFloat(formData.total_value) : (parseFloat(formData.quantity) || 0) * (parseFloat(formData.unit_price) || 0),
        min_stock_level: parseFloat(formData.min_stock_level) || 0,
        previous_quantity: parseFloat(formData.previous_quantity) || 0,
        adjusted_quantity: parseFloat(formData.adjusted_quantity) || 0,
        difference: (parseFloat(formData.adjusted_quantity) || 0) - (parseFloat(formData.previous_quantity) || 0),
      };

      if (selectedItem) {
        await stockAPI.update(selectedItem.id, payload);
        toast.success('Record updated successfully');
      } else {
        await stockAPI.create(payload);
        toast.success('Record added successfully');
      }
      setIsModalOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await stockAPI.delete(`${selectedItem.id}?type=${activeTab}`);
      toast.success('Record deleted');
      setIsDeleteOpen(false);
      loadAll();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const safeItems = Array.isArray(items) ? items : [];

  // Summary figures
  const totalStockValue = safeItems.reduce((s, item) => s + parseFloat(item.total_value || (item.quantity * item.unit_price) || 0), 0);
  const lowStockCount = safeItems.filter((i) => parseFloat(i.quantity || 0) <= parseFloat(i.min_stock_level || 0) && parseFloat(i.min_stock_level || 0) > 0).length;
  const completedTransfers = safeItems.filter((t) => t.status === 'completed').length;
  const pendingTransfers = safeItems.filter((t) => t.status === 'pending' || t.status === 'in_transit').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/projects/${projectId}`}
            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 bg-white"
          >
            <ArrowLeft size={18} />
          </Link>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <Package size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {activeTab === 'inventory'
                ? 'Site Inventory'
                : activeTab === 'transfers'
                ? 'Stock Transfers'
                : 'Stock Adjustments'}
            </h1>
            <p className="text-sm text-gray-500">{project?.name || `Project #${projectId}`}</p>
          </div>
        </div>

        <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} />
          {activeTab === 'inventory'
            ? 'Add Stock Item'
            : activeTab === 'transfers'
            ? 'New Stock Transfer'
            : 'Record Adjustment'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <button
          onClick={() => handleTabSwitch('inventory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'inventory'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Package size={16} />
          Site Inventory
        </button>
        <button
          onClick={() => handleTabSwitch('transfers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'transfers'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <RotateCcw size={16} />
          Stock Transfers
        </button>
        <button
          onClick={() => handleTabSwitch('adjustments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'adjustments'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <TrendingDown size={16} />
          Stock Adjustments
        </button>
      </div>

      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> Showing demo records. Live inventory entries will update in real-time.
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {activeTab === 'inventory' ? (
          <>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Total Stock Valuation</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalStockValue)}</p>
              <span className="text-xs text-gray-400">{safeItems.length} inventory items</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Low Stock Warning</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">{lowStockCount}</p>
              <span className="text-xs text-gray-400">below threshold quantity</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Storage Health</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {safeItems.length > 0 ? `${Math.round(((safeItems.length - lowStockCount) / safeItems.length) * 100)}%` : '100%'}
              </p>
              <span className="text-xs text-gray-400">stock items adequate</span>
            </div>
          </>
        ) : activeTab === 'transfers' ? (
          <>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Total Transfers</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{safeItems.length}</p>
              <span className="text-xs text-gray-400">site material transfers</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Active / In-Transit</span>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{pendingTransfers}</p>
              <span className="text-xs text-gray-400">awaiting receiving check</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Completed Transfers</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{completedTransfers}</p>
              <span className="text-xs text-gray-400">received at destination</span>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Total Adjustments</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{safeItems.length}</p>
              <span className="text-xs text-gray-400">recorded discrepancies</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Damage & Loss Incidents</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {safeItems.filter((a) => a.adjustment_type === 'damage' || a.adjustment_type === 'loss' || a.adjustment_type === 'theft').length}
              </p>
              <span className="text-xs text-gray-400">site damage or loss</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Audits & Corrections</span>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {safeItems.filter((a) => a.adjustment_type === 'correction' || a.adjustment_type === 'other').length}
              </p>
              <span className="text-xs text-gray-400">stock reconciliation entries</span>
            </div>
          </>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {activeTab === 'inventory'
              ? 'Material Inventory on Site'
              : activeTab === 'transfers'
              ? 'Transfer Records'
              : 'Adjustment Logs'}
          </h2>
          <span className="text-xs text-gray-400">{safeItems.length} records</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : safeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-44 gap-3 text-gray-400">
            <Package size={36} className="opacity-30" />
            <p className="text-sm">
              {activeTab === 'inventory'
                ? 'No material stock records found'
                : activeTab === 'transfers'
                ? 'No stock transfers found'
                : 'No adjustments recorded yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                {activeTab === 'inventory' ? (
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Material</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stock Qty</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total Value</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-5 py-3 text-right" />
                  </tr>
                ) : activeTab === 'transfers' ? (
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Transfer Code</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Material</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">From</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">To</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-5 py-3 text-right" />
                  </tr>
                ) : (
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Material</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Previous</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Adjusted</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Diff</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                    <th className="px-5 py-3 text-right" />
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-50">
                {safeItems.map((item) => {
                  if (activeTab === 'inventory') {
                    const isLow = parseFloat(item.quantity || 0) <= parseFloat(item.min_stock_level || 0) && parseFloat(item.min_stock_level || 0) > 0;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-900">{item.material_name}</td>
                        <td className="px-5 py-3.5 text-gray-600 text-xs">{item.category || 'General'}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-gray-800">
                          {Number(item.quantity).toLocaleString()} <span className="text-xs font-normal text-gray-500">{item.unit}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-amber-700">
                          {formatCurrency(item.total_value || item.quantity * item.unit_price)}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{item.location || 'Site Store'}</td>
                        <td className="px-5 py-3.5">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium bg-rose-50 text-rose-700 border-rose-200">
                              <AlertTriangle size={11} /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                              <CheckCircle2 size={11} /> In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setIsDeleteOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  } else if (activeTab === 'transfers') {
                    const cfg = TRANSFER_STATUS_CONFIG[item.status] || TRANSFER_STATUS_CONFIG.pending;
                    const StatusIcon = cfg.icon || Clock;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-medium text-gray-600">
                          <span className="bg-gray-100 px-2 py-0.5 rounded">{item.transfer_code || `ST-${item.id}`}</span>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-gray-900">{item.material_name || 'Materials'}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-gray-800">
                          {Number(item.quantity).toLocaleString()} <span className="text-xs font-normal text-gray-500">{item.unit}</span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 text-xs">{item.from_project_name || 'Central Store'}</td>
                        <td className="px-5 py-3.5 text-gray-900 text-xs font-medium">{item.to_project_name || project?.name || 'This Project'}</td>
                        <td className="px-5 py-3.5 text-gray-500">{formatDate(item.transfer_date)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>
                            <StatusIcon size={11} /> {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setIsDeleteOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  } else {
                    const cfg = ADJUSTMENT_TYPE_CONFIG[item.adjustment_type] || ADJUSTMENT_TYPE_CONFIG.other;
                    const isDiffNegative = parseFloat(item.difference || 0) < 0;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-medium text-gray-600">
                          <span className="bg-gray-100 px-2 py-0.5 rounded">{item.adjustment_code || `SA-${item.id}`}</span>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-gray-900">{item.material_name}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-500">{Number(item.previous_quantity).toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-right font-medium text-gray-900">{Number(item.adjusted_quantity).toLocaleString()}</td>
                        <td className={`px-5 py-3.5 text-right font-bold ${isDiffNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {item.difference > 0 ? `+${item.difference}` : item.difference} {item.unit}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">{formatDate(item.adjustment_date)}</td>
                        <td className="px-5 py-3.5 text-gray-600 text-xs max-w-[200px] truncate" title={item.reason}>
                          {item.reason || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setIsDeleteOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Inventory / Transfers / Adjustments */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          selectedItem
            ? `Edit ${activeTab === 'inventory' ? 'Stock Item' : activeTab === 'transfers' ? 'Stock Transfer' : 'Adjustment'}`
            : `New ${activeTab === 'inventory' ? 'Stock Item' : activeTab === 'transfers' ? 'Stock Transfer' : 'Adjustment'}`
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeTab === 'inventory' && (
              <>
                <div className="sm:col-span-2">
                  <label className="form-label">Material Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.material_name}
                    onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                    className="form-input"
                    placeholder="e.g., BSRM Rebar 16mm or Portland Cement"
                  />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-input"
                    placeholder="e.g., Steel, Cement, Sand, Bricks"
                  />
                </div>
                <div>
                  <label className="form-label">Storage Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="form-input"
                    placeholder="e.g., Site Store, Yard Bay 1"
                  />
                </div>
                <div>
                  <label className="form-label">Quantity in Stock *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Unit of Measure</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="form-input"
                  >
                    <option value="bag">bag</option>
                    <option value="ton">ton</option>
                    <option value="kg">kg</option>
                    <option value="cft">cft</option>
                    <option value="pcs">pcs</option>
                    <option value="piece">piece</option>
                    <option value="liter">liter</option>
                    <option value="sqft">sqft</option>
                    <option value="rft">rft</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Unit Price (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Min Alert Stock Level</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                    className="form-input"
                    placeholder="Threshold for low-stock warning"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Notes</label>
                  <textarea
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="form-input"
                    placeholder="Specification or supplier information"
                  />
                </div>
              </>
            )}

            {activeTab === 'transfers' && (
              <>
                <div className="sm:col-span-2">
                  <label className="form-label">Material Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.material_name}
                    onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                    className="form-input"
                    placeholder="e.g., Seven Rings Cement"
                  />
                </div>
                <div>
                  <label className="form-label">From Location / Project</label>
                  <select
                    value={formData.from_project_id}
                    onChange={(e) => setFormData({ ...formData, from_project_id: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Central Store / External Warehouse</option>
                    {allProjects
                      .filter((p) => String(p.id) !== String(projectId))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Transfer Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.transfer_date}
                    onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="form-input"
                  >
                    <option value="bag">bag</option>
                    <option value="ton">ton</option>
                    <option value="kg">kg</option>
                    <option value="cft">cft</option>
                    <option value="pcs">pcs</option>
                    <option value="piece">piece</option>
                    <option value="liter">liter</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-input"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="in_transit">In Transit</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Vehicle & Dispatch Details</label>
                  <textarea
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="form-input"
                    placeholder="Truck registration number, driver contact, delivery slip no."
                  />
                </div>
              </>
            )}

            {activeTab === 'adjustments' && (
              <>
                <div className="sm:col-span-2">
                  <label className="form-label">Material Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.material_name}
                    onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                    className="form-input"
                    placeholder="e.g., Seven Rings Cement"
                  />
                </div>
                <div>
                  <label className="form-label">Adjustment Type</label>
                  <select
                    value={formData.adjustment_type}
                    onChange={(e) => setFormData({ ...formData, adjustment_type: e.target.value })}
                    className="form-input"
                  >
                    <option value="damage">Damage</option>
                    <option value="loss">Loss</option>
                    <option value="theft">Theft</option>
                    <option value="expired">Expired</option>
                    <option value="quality_issue">Quality Issue</option>
                    <option value="correction">Inventory Audit Correction</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Adjustment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.adjustment_date}
                    onChange={(e) => setFormData({ ...formData, adjustment_date: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Previous System Quantity *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.previous_quantity}
                    onChange={(e) => setFormData({ ...formData, previous_quantity: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Actual Physical Quantity *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.adjusted_quantity}
                    onChange={(e) => setFormData({ ...formData, adjusted_quantity: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="form-input"
                  >
                    <option value="bag">bag</option>
                    <option value="ton">ton</option>
                    <option value="kg">kg</option>
                    <option value="cft">cft</option>
                    <option value="pcs">pcs</option>
                    <option value="piece">piece</option>
                    <option value="liter">liter</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Reason / Root Cause</label>
                  <textarea
                    rows="2"
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="form-input"
                    placeholder="Detailed explanation of why the adjustment was made"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
              {submitting
                ? 'Saving...'
                : selectedItem
                ? `Update ${activeTab === 'inventory' ? 'Stock Item' : activeTab === 'transfers' ? 'Transfer' : 'Adjustment'}`
                : `Save ${activeTab === 'inventory' ? 'Stock Item' : activeTab === 'transfers' ? 'Transfer' : 'Adjustment'}`}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${activeTab === 'inventory' ? 'Stock Item' : activeTab === 'transfers' ? 'Transfer' : 'Adjustment'}`}
        message="Are you sure you want to delete this record? This action cannot be reversed."
      />
    </div>
  );
}
