import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { purchasesAPI, suppliersAPI, projectsAPI } from '../../api';
import { ShoppingCart, Plus, Edit2, Trash2, ArrowLeft, AlertCircle, Clock, CheckCircle2, XCircle, Package } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/helpers';

const DEMO_PURCHASES = [
  { id: 1, purchase_code: 'PO-0001', supplier_name: 'BSRM Steels Ltd.', item_description: 'BSRM Xtreme 500W Rebar (16mm & 20mm) - 50 tons', purchase_type: 'order', total_amount: 4750000, purchase_date: '2025-07-10', expected_delivery_date: '2025-07-25', status: 'delivered', notes: 'Full delivery confirmed' },
  { id: 2, purchase_code: 'PO-0002', supplier_name: 'Seven Rings Cement Ltd.', item_description: 'Portland Composite Cement - 1500 bags', purchase_type: 'order', total_amount: 885000, purchase_date: '2025-07-28', expected_delivery_date: '2025-08-05', status: 'delivered', notes: 'Delivered to site store' },
  { id: 3, purchase_code: 'PO-0003', supplier_name: 'Mir Concrete Products', item_description: 'Ready Mix Concrete M-40 (6000 psi) - 150 cum', purchase_type: 'order', total_amount: 2250000, purchase_date: '2025-08-05', expected_delivery_date: '2025-08-08', status: 'delivered', notes: '8th floor slab casting' },
  { id: 4, purchase_code: 'PO-0004', supplier_name: 'Bengal Auto Bricks', item_description: 'Gas Burnt Auto Brick 1st Class - 40,000 pcs', purchase_type: 'order', total_amount: 520000, purchase_date: '2025-08-10', expected_delivery_date: '2025-08-20', status: 'pending', notes: 'For 4th-6th floor masonry' },
  { id: 5, purchase_code: 'PO-0005', supplier_name: 'Apex Heavy Equipment', item_description: 'Tower Crane Monthly Rental + Fuel (September)', purchase_type: 'order', total_amount: 350000, purchase_date: '2025-08-25', expected_delivery_date: '2025-09-01', status: 'approved', notes: 'Monthly rental agreement' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 },
  delivered: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  partial: { label: 'Partial', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Package },
};

export default function Purchases() {
  const { projectId } = useParams();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const initForm = () => ({
    project_id: projectId,
    purchase_type: 'order',
    supplier_id: '',
    item_description: '',
    total_amount: '',
    purchase_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    status: 'pending',
    notes: '',
  });
  const [formData, setFormData] = useState(initForm());

  useEffect(() => { loadAll(); }, [projectId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [purRes, suppRes, projRes] = await Promise.allSettled([
        purchasesAPI.getAll({ project_id: projectId, type: 'orders' }),
        suppliersAPI.getAll({ per_page: 100 }),
        projectsAPI.getOne(projectId),
      ]);
      if (purRes.status === 'fulfilled' && purRes.value.data.success) {
        setPurchases(purRes.value.data.data || []);
        setIsDemo(false);
      } else {
        setPurchases(DEMO_PURCHASES);
        setIsDemo(true);
      }
      if (suppRes.status === 'fulfilled' && suppRes.value.data.success) setSuppliers(suppRes.value.data.data || []);
      if (projRes.status === 'fulfilled' && projRes.value.data.success) setProject(projRes.value.data.data);
    } catch {
      setPurchases(DEMO_PURCHASES);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { ...formData, type: 'orders' };
      if (selectedPurchase) {
        await purchasesAPI.update(selectedPurchase.id, data);
        toast.success('Purchase order updated!');
      } else {
        await purchasesAPI.create(data);
        toast.success('Purchase order created!');
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
      await purchasesAPI.delete(selectedPurchase.id);
      toast.success('Purchase order deleted');
      setIsDeleteOpen(false);
      loadAll();
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (p) => {
    setSelectedPurchase(p);
    setFormData({
      project_id: projectId,
      purchase_type: p.purchase_type || 'order',
      supplier_id: p.supplier_id || '',
      item_description: p.item_description || '',
      total_amount: p.total_amount || '',
      purchase_date: p.purchase_date || '',
      expected_delivery_date: p.expected_delivery_date || '',
      status: p.status || 'pending',
      notes: p.notes || '',
    });
    setIsModalOpen(true);
  };

  const totalValue = purchases.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);
  const deliveredValue = purchases.filter((p) => p.status === 'delivered').reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}`} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 bg-white"><ArrowLeft size={18} /></Link>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
            <ShoppingCart size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-sm text-gray-500">{project?.name || `Project #${projectId}`}</p>
          </div>
        </div>
        <button onClick={() => { setSelectedPurchase(null); setFormData(initForm()); setIsModalOpen(true); }} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> New Purchase Order
        </button>
      </div>

      {isDemo && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-sm flex items-center gap-2"><AlertCircle size={16} /> Showing demo data.</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500">Total Orders Value</span>
          <p className="text-2xl font-bold text-pink-600 mt-1">{formatCurrency(totalValue)}</p>
          <span className="text-xs text-gray-400">{purchases.length} orders</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500">Delivered Value</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(deliveredValue)}</p>
          <span className="text-xs text-gray-400">{purchases.filter((p) => p.status === 'delivered').length} delivered</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500">Pending Orders</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{purchases.filter((p) => p.status === 'pending' || p.status === 'approved').length}</p>
          <span className="text-xs text-gray-400">awaiting delivery</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Purchase Orders</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
            <ShoppingCart size={36} className="opacity-30" />
            <p className="text-sm">No purchase orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">PO Code</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Order Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {purchases.map((p) => {
                  const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5"><span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{p.purchase_code}</span></td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">{p.supplier_name || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-600 max-w-[220px] truncate">{p.item_description || '—'}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-pink-700">{formatCurrency(p.total_amount)}</td>
                      <td className="px-5 py-3.5 text-gray-500">{formatDate(p.purchase_date)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>
                          <StatusIcon size={11} /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Edit2 size={14} /></button>
                          <button onClick={() => { setSelectedPurchase(p); setIsDeleteOpen(true); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedPurchase ? 'Edit Purchase Order' : 'New Purchase Order'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suppliers.length > 0 ? (
              <div className="sm:col-span-2">
                <label className="form-label">Supplier</label>
                <select value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })} className="form-input">
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            ) : (
              <div className="sm:col-span-2">
                <label className="form-label">Supplier Name</label>
                <input type="text" value={formData.supplier_name || ''} onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })} className="form-input" placeholder="Supplier name" />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="form-label">Item Description *</label>
              <input type="text" required value={formData.item_description} onChange={(e) => setFormData({ ...formData, item_description: e.target.value })} className="form-input" placeholder="Materials, equipment, or services ordered" />
            </div>
            <div>
              <label className="form-label">Total Amount (৳) *</label>
              <input type="number" step="0.01" required value={formData.total_amount} onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="form-input">
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="delivered">Delivered</option>
                <option value="partial">Partial Delivery</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="form-label">Order Date *</label>
              <input type="date" required value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Expected Delivery Date</label>
              <input type="date" value={formData.expected_delivery_date} onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">{submitting ? 'Saving...' : selectedPurchase ? 'Update Order' : 'Create Order'}</button>
          </div>
        </form>
      </Modal>
      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Purchase Order" message="Delete this purchase order? This cannot be undone." />
    </div>
  );
}
