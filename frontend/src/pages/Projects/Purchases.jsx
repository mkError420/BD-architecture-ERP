import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { purchasesAPI, suppliersAPI, projectsAPI } from '../../api';
import {
  ShoppingCart, Plus, Edit2, Trash2, ArrowLeft, AlertCircle,
  Clock, CheckCircle2, XCircle, Package, FileText, Send,
  HelpCircle, DollarSign, Calendar
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/helpers';

// Demo fallbacks
const DEMO_ORDERS = [
  { id: 1, purchase_code: 'PO-0001', supplier_name: 'BSRM Steels Ltd.', item_description: 'BSRM Xtreme 500W Rebar (16mm & 20mm) - 50 tons', total_amount: 4750000, order_date: '2025-07-10', expected_delivery_date: '2025-07-25', status: 'delivered', notes: 'Full delivery confirmed' },
  { id: 2, purchase_code: 'PO-0002', supplier_name: 'Seven Rings Cement Ltd.', item_description: 'Portland Composite Cement - 1500 bags', total_amount: 885000, order_date: '2025-07-28', expected_delivery_date: '2025-08-05', status: 'delivered', notes: 'Delivered to site store' },
  { id: 3, purchase_code: 'PO-0003', supplier_name: 'Mir Concrete Products', item_description: 'Ready Mix Concrete M-40 (6000 psi) - 150 cum', total_amount: 2250000, order_date: '2025-08-05', expected_delivery_date: '2025-08-08', status: 'delivered', notes: '8th floor slab casting' },
  { id: 4, purchase_code: 'PO-0004', supplier_name: 'Bengal Auto Bricks', item_description: 'Gas Burnt Auto Brick 1st Class - 40,000 pcs', total_amount: 520000, order_date: '2025-08-10', expected_delivery_date: '2025-08-20', status: 'pending', notes: 'For 4th-6th floor masonry' },
  { id: 5, purchase_code: 'PO-0005', supplier_name: 'Apex Heavy Equipment', item_description: 'Tower Crane Monthly Rental + Fuel (September)', total_amount: 350000, order_date: '2025-08-25', expected_delivery_date: '2025-09-01', status: 'approved', notes: 'Monthly rental agreement' },
];

const DEMO_REQUESTS = [
  { id: 1, request_code: 'PR-0001', item_description: 'Safety Helmets & High-Vis Jackets (50 sets)', estimated_amount: 45000, request_date: '2025-08-01', required_date: '2025-08-10', priority: 'high', status: 'approved', reason: 'Required for newly joined labor team' },
  { id: 2, request_code: 'PR-0002', item_description: 'Waterproofing Chemical Compound (100 gal)', estimated_amount: 120000, request_date: '2025-08-12', required_date: '2025-08-22', priority: 'urgent', status: 'pending', reason: 'Basement wall leakage prevention' },
  { id: 3, request_code: 'PR-0003', item_description: 'Scaffolding Metal Pipes & Clamps (200 units)', estimated_amount: 380000, request_date: '2025-08-18', required_date: '2025-09-01', priority: 'medium', status: 'ordered', reason: 'External plastering work on floor 7-10' },
];

const DEMO_QUOTATIONS = [
  { id: 1, quotation_code: 'QT-0001', supplier_name: 'RAK Ceramics Ltd.', item_description: 'Glazed Homogeneous Floor Tiles (60x60 cm) - 25000 sqft', total_amount: 3200000, quotation_date: '2025-07-20', valid_until: '2025-08-30', status: 'accepted', notes: 'Approved by project architect' },
  { id: 2, quotation_code: 'QT-0002', supplier_name: 'Akij Building Materials', item_description: 'Portland Composite Cement - bulk rate for 3000 bags', total_amount: 1710000, quotation_date: '2025-08-05', valid_until: '2025-08-25', status: 'received', notes: 'Includes transport to site' },
  { id: 3, quotation_code: 'QT-0003', supplier_name: 'National Tubes Ltd.', item_description: 'MS Hollow Pipe & Rectangular Box Section (15 tons)', total_amount: 1650000, quotation_date: '2025-08-15', valid_until: '2025-09-15', status: 'under_review', notes: 'For rooftop canopy structure' },
];

const ORDER_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 },
  ordered: { label: 'Ordered', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: ShoppingCart },
  delivered: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  partial: { label: 'Partial Delivery', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Package },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

const REQUEST_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  approved: { label: 'Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  ordered: { label: 'Ordered', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 },
};

const QUOTE_STATUS_CONFIG = {
  received: { label: 'Received', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock },
};

export default function Purchases() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab determine from path: 'orders', 'requests', 'quotations'
  const activeTab = location.pathname.includes('/requests')
    ? 'requests'
    : location.pathname.includes('/quotations')
    ? 'quotations'
    : 'orders';

  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  // Form states
  const initOrderForm = () => ({
    type: 'orders',
    project_id: projectId,
    supplier_id: '',
    supplier_name: '',
    item_description: '',
    total_amount: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    status: 'pending',
    notes: '',
  });

  const initRequestForm = () => ({
    type: 'requests',
    project_id: projectId,
    item_description: '',
    estimated_amount: '',
    request_date: new Date().toISOString().split('T')[0],
    required_date: '',
    priority: 'medium',
    status: 'pending',
    reason: '',
    notes: '',
  });

  const initQuotationForm = () => ({
    type: 'quotations',
    project_id: projectId,
    supplier_id: '',
    supplier_name: '',
    item_description: '',
    total_amount: '',
    quotation_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    status: 'received',
    notes: '',
  });

  const [formData, setFormData] = useState(initOrderForm());

  useEffect(() => {
    loadAll();
  }, [projectId, activeTab]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [purRes, suppRes, projRes] = await Promise.allSettled([
        purchasesAPI.getAll({ project_id: projectId, type: activeTab }),
        suppliersAPI.getAll({ per_page: 100 }),
        projectsAPI.getOne(projectId),
      ]);

      if (purRes.status === 'fulfilled' && purRes.value?.data) {
        const raw = purRes.value.data;
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

      if (suppRes.status === 'fulfilled' && suppRes.value?.data) {
        const sData = suppRes.value.data;
        setSuppliers(Array.isArray(sData.data) ? sData.data : (Array.isArray(sData) ? sData : []));
      }
      if (projRes.status === 'fulfilled' && projRes.value?.data) {
        setProject(projRes.value.data.data || projRes.value.data);
      }
    } catch {
      setDemoData();
    } finally {
      setLoading(false);
    }
  };

  const setDemoData = () => {
    setIsDemo(true);
    if (activeTab === 'orders') setItems(DEMO_ORDERS);
    else if (activeTab === 'requests') setItems(DEMO_REQUESTS);
    else setItems(DEMO_QUOTATIONS);
  };

  const handleTabSwitch = (tab) => {
    navigate(`/projects/${projectId}/purchases/${tab}`);
  };

  const openCreate = () => {
    setSelectedItem(null);
    if (activeTab === 'orders') setFormData(initOrderForm());
    else if (activeTab === 'requests') setFormData(initRequestForm());
    else setFormData(initQuotationForm());
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    if (activeTab === 'orders') {
      setFormData({
        type: 'orders',
        project_id: projectId,
        supplier_id: item.supplier_id || '',
        supplier_name: item.supplier_name || '',
        item_description: item.item_description || '',
        total_amount: item.total_amount || '',
        order_date: item.order_date || item.purchase_date || '',
        expected_delivery_date: item.expected_delivery_date || '',
        status: item.status || 'pending',
        notes: item.notes || '',
      });
    } else if (activeTab === 'requests') {
      setFormData({
        type: 'requests',
        project_id: projectId,
        item_description: item.item_description || '',
        estimated_amount: item.estimated_amount || item.total_amount || '',
        request_date: item.request_date || '',
        required_date: item.required_date || '',
        priority: item.priority || 'medium',
        status: item.status || 'pending',
        reason: item.reason || '',
        notes: item.notes || '',
      });
    } else {
      setFormData({
        type: 'quotations',
        project_id: projectId,
        supplier_id: item.supplier_id || '',
        supplier_name: item.supplier_name || '',
        item_description: item.item_description || '',
        total_amount: item.total_amount || '',
        quotation_date: item.quotation_date || '',
        valid_until: item.valid_until || '',
        status: item.status || 'received',
        notes: item.notes || '',
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
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : 0,
        estimated_amount: formData.estimated_amount ? parseFloat(formData.estimated_amount) : 0,
      };

      if (selectedItem) {
        await purchasesAPI.update(selectedItem.id, payload);
        toast.success(`${activeTab === 'orders' ? 'Order' : activeTab === 'requests' ? 'Request' : 'Quotation'} updated!`);
      } else {
        await purchasesAPI.create(payload);
        toast.success(`${activeTab === 'orders' ? 'Order' : activeTab === 'requests' ? 'Request' : 'Quotation'} created!`);
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
      await purchasesAPI.delete(`${selectedItem.id}?type=${activeTab}`);
      toast.success('Deleted successfully');
      setIsDeleteOpen(false);
      loadAll();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const safeItems = Array.isArray(items) ? items : [];

  // Summary calculations
  const totalValue = safeItems.reduce((s, p) => s + parseFloat(p.total_amount || p.estimated_amount || 0), 0);
  const deliveredCount = safeItems.filter((p) => p.status === 'delivered' || p.status === 'approved' || p.status === 'accepted').length;
  const pendingCount = safeItems.filter((p) => p.status === 'pending' || p.status === 'under_review' || p.status === 'received').length;

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
            style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}
          >
            <ShoppingCart size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {activeTab === 'orders' ? 'Purchase Orders' : activeTab === 'requests' ? 'Purchase Requests' : 'Quotations'}
            </h1>
            <p className="text-sm text-gray-500">{project?.name || `Project #${projectId}`}</p>
          </div>
        </div>

        <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} />
          {activeTab === 'orders' ? 'New Purchase Order' : activeTab === 'requests' ? 'New Purchase Request' : 'New Quotation'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <button
          onClick={() => handleTabSwitch('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'orders'
              ? 'bg-pink-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ShoppingCart size={16} />
          Purchase Orders
        </button>
        <button
          onClick={() => handleTabSwitch('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'requests'
              ? 'bg-pink-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Send size={16} />
          Purchase Requests
        </button>
        <button
          onClick={() => handleTabSwitch('quotations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'quotations'
              ? 'bg-pink-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <FileText size={16} />
          Quotations
        </button>
      </div>

      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> Showing demo data. Live data will be populated as entries are created.
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-medium">
            {activeTab === 'orders' ? 'Total Orders Value' : activeTab === 'requests' ? 'Total Estimated Value' : 'Total Quotation Value'}
          </span>
          <p className="text-2xl font-bold text-pink-600 mt-1">{formatCurrency(totalValue)}</p>
          <span className="text-xs text-gray-400">{safeItems.length} records</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-medium">
            {activeTab === 'orders' ? 'Delivered / Completed' : activeTab === 'requests' ? 'Approved Requests' : 'Accepted Quotations'}
          </span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{deliveredCount}</p>
          <span className="text-xs text-gray-400">fulfilled successfully</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-medium">Pending Action</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          <span className="text-xs text-gray-400">awaiting review or delivery</span>
        </div>
      </div>

      {/* Table section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {activeTab === 'orders' ? 'Order Records' : activeTab === 'requests' ? 'Request Records' : 'Quotation Records'}
          </h2>
          <span className="text-xs text-gray-400">{safeItems.length} entries</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : safeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-44 gap-3 text-gray-400">
            <ShoppingCart size={36} className="opacity-30" />
            <p className="text-sm">
              {activeTab === 'orders' ? 'No purchase orders found' : activeTab === 'requests' ? 'No purchase requests found' : 'No quotations found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                  {activeTab !== 'requests' && (
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                  )}
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    {activeTab === 'orders' ? 'Order Date' : activeTab === 'requests' ? 'Request Date' : 'Quote Date'}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    {activeTab === 'orders' ? 'Delivery' : activeTab === 'requests' ? 'Priority' : 'Valid Until'}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {safeItems.map((p) => {
                  let cfg = ORDER_STATUS_CONFIG[p.status] || ORDER_STATUS_CONFIG.pending;
                  if (activeTab === 'requests') cfg = REQUEST_STATUS_CONFIG[p.status] || REQUEST_STATUS_CONFIG.pending;
                  if (activeTab === 'quotations') cfg = QUOTE_STATUS_CONFIG[p.status] || QUOTE_STATUS_CONFIG.received;
                  const StatusIcon = cfg.icon || Clock;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-medium text-gray-600">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          {p.order_code || p.purchase_code || p.request_code || p.quotation_code || `P-${p.id}`}
                        </span>
                      </td>

                      {activeTab !== 'requests' && (
                        <td className="px-5 py-3.5 font-medium text-gray-900">{p.supplier_name || '—'}</td>
                      )}

                      <td className="px-5 py-3.5 text-gray-600 max-w-[240px] truncate" title={p.item_description || p.reason}>
                        {p.item_description || p.reason || '—'}
                      </td>

                      <td className="px-5 py-3.5 text-right font-bold text-pink-700">
                        {formatCurrency(p.total_amount || p.estimated_amount)}
                      </td>

                      <td className="px-5 py-3.5 text-gray-500">
                        {formatDate(p.order_date || p.purchase_date || p.request_date || p.quotation_date)}
                      </td>

                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {activeTab === 'orders' && (p.expected_delivery_date ? formatDate(p.expected_delivery_date) : '—')}
                        {activeTab === 'requests' && (
                          <span
                            className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold ${
                              p.priority === 'urgent'
                                ? 'bg-red-100 text-red-700'
                                : p.priority === 'high'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {p.priority || 'medium'}
                          </span>
                        )}
                        {activeTab === 'quotations' && (p.valid_until ? formatDate(p.valid_until) : '—')}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}
                        >
                          <StatusIcon size={11} /> {cfg.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(p);
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
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Orders / Requests / Quotations */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          selectedItem
            ? `Edit ${activeTab === 'orders' ? 'Purchase Order' : activeTab === 'requests' ? 'Purchase Request' : 'Quotation'}`
            : `New ${activeTab === 'orders' ? 'Purchase Order' : activeTab === 'requests' ? 'Purchase Request' : 'Quotation'}`
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Supplier field for Orders & Quotations */}
            {activeTab !== 'requests' && (
              <div className="sm:col-span-2">
                <label className="form-label">Supplier</label>
                {suppliers.length > 0 ? (
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => {
                      const sel = suppliers.find((s) => String(s.id) === e.target.value);
                      setFormData({
                        ...formData,
                        supplier_id: e.target.value,
                        supplier_name: sel ? sel.name : '',
                      });
                    }}
                    className="form-input"
                  >
                    <option value="">Select or Type Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    className="form-input"
                    placeholder="Enter supplier company name"
                  />
                )}
              </div>
            )}

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="form-label">
                {activeTab === 'requests' ? 'Item / Material Description *' : 'Description / Materials *'}
              </label>
              <input
                type="text"
                required
                value={formData.item_description}
                onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                className="form-input"
                placeholder="e.g., 50 tons rebar 16mm or 100 bags cement"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="form-label">
                {activeTab === 'requests' ? 'Estimated Amount (৳)' : 'Total Amount (৳) *'}
              </label>
              <input
                type="number"
                step="0.01"
                required={activeTab !== 'requests'}
                value={activeTab === 'requests' ? formData.estimated_amount : formData.total_amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    [activeTab === 'requests' ? 'estimated_amount' : 'total_amount']: e.target.value,
                  })
                }
                className="form-input"
                placeholder="0.00"
              />
            </div>

            {/* Date */}
            <div>
              <label className="form-label">
                {activeTab === 'orders' ? 'Order Date *' : activeTab === 'requests' ? 'Request Date *' : 'Quotation Date *'}
              </label>
              <input
                type="date"
                required
                value={
                  activeTab === 'orders'
                    ? formData.order_date
                    : activeTab === 'requests'
                    ? formData.request_date
                    : formData.quotation_date
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    [activeTab === 'orders'
                      ? 'order_date'
                      : activeTab === 'requests'
                      ? 'request_date'
                      : 'quotation_date']: e.target.value,
                  })
                }
                className="form-input"
              />
            </div>

            {/* Delivery Date / Required Date / Valid Until */}
            <div>
              <label className="form-label">
                {activeTab === 'orders'
                  ? 'Expected Delivery Date'
                  : activeTab === 'requests'
                  ? 'Required Date'
                  : 'Valid Until'}
              </label>
              <input
                type="date"
                value={
                  activeTab === 'orders'
                    ? formData.expected_delivery_date
                    : activeTab === 'requests'
                    ? formData.required_date
                    : formData.valid_until
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    [activeTab === 'orders'
                      ? 'expected_delivery_date'
                      : activeTab === 'requests'
                      ? 'required_date'
                      : 'valid_until']: e.target.value,
                  })
                }
                className="form-input"
              />
            </div>

            {/* Status or Priority */}
            {activeTab === 'requests' ? (
              <div>
                <label className="form-label">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="form-input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="form-label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="form-input"
                >
                  {activeTab === 'orders' ? (
                    <>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="ordered">Ordered</option>
                      <option value="partial">Partial Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  ) : (
                    <>
                      <option value="received">Received</option>
                      <option value="under_review">Under Review</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="expired">Expired</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Request Reason */}
            {activeTab === 'requests' && (
              <div className="sm:col-span-2">
                <label className="form-label">Reason / Justification</label>
                <input
                  type="text"
                  value={formData.reason || ''}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="form-input"
                  placeholder="Why is this material required?"
                />
              </div>
            )}

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea
                rows="2"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="form-input"
                placeholder="Additional instructions or terms"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
              {submitting
                ? 'Saving...'
                : selectedItem
                ? `Update ${activeTab === 'orders' ? 'Order' : activeTab === 'requests' ? 'Request' : 'Quotation'}`
                : `Create ${activeTab === 'orders' ? 'Order' : activeTab === 'requests' ? 'Request' : 'Quotation'}`}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${activeTab === 'orders' ? 'Purchase Order' : activeTab === 'requests' ? 'Purchase Request' : 'Quotation'}`}
        message="Are you sure you want to delete this record? This cannot be undone."
      />
    </div>
  );
}
