import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { stockAPI, projectsAPI, materialsAPI } from '../../api';
import { Package, Plus, Edit2, Trash2, ArrowLeft, AlertCircle, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency } from '../../utils/helpers';

const DEMO_STOCK = [
  { id: 1, stock_code: 'STK-001', material_name: 'BSRM Rebar 16mm', category: 'Steel', transaction_type: 'in', quantity: 25, unit: 'ton', unit_price: 95000, total_value: 2375000, transaction_date: '2025-08-02', location: 'Site Store', notes: 'Main structure rebar' },
  { id: 2, stock_code: 'STK-002', material_name: 'Seven Rings Cement', category: 'Cement', transaction_type: 'in', quantity: 1200, unit: 'bag', unit_price: 590, total_value: 708000, transaction_date: '2025-08-05', location: 'Site Store', notes: 'For RCC work' },
  { id: 3, stock_code: 'STK-003', material_name: 'Sylhet Coarse Sand', category: 'Sand', transaction_type: 'in', quantity: 8500, unit: 'cft', unit_price: 45, total_value: 382500, transaction_date: '2025-08-08', location: 'Site Ground', notes: '' },
  { id: 4, stock_code: 'STK-004', material_name: 'BSRM Rebar 16mm', category: 'Steel', transaction_type: 'out', quantity: 8, unit: 'ton', unit_price: 95000, total_value: 760000, transaction_date: '2025-08-10', location: '8th Floor', notes: 'Used for slab casting' },
  { id: 5, stock_code: 'STK-005', material_name: 'Gas Burnt Brick', category: 'Brick', transaction_type: 'in', quantity: 35000, unit: 'pcs', unit_price: 13, total_value: 455000, transaction_date: '2025-08-12', location: 'Site Store', notes: '3rd-4th floor masonry' },
];

const TYPE_CONFIG = {
  in: { label: 'Stock In', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: TrendingUp },
  out: { label: 'Stock Out', color: 'bg-red-50 text-red-700 border-red-200', icon: TrendingDown },
  transfer: { label: 'Transfer', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: RotateCcw },
  adjustment: { label: 'Adjustment', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: RotateCcw },
};

export default function StockManagement() {
  const { projectId } = useParams();
  const [stockItems, setStockItems] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const initForm = () => ({
    project_id: projectId,
    material_name: '',
    category: '',
    transaction_type: 'in',
    quantity: '',
    unit: 'piece',
    unit_price: '',
    transaction_date: new Date().toISOString().split('T')[0],
    location: '',
    notes: '',
  });
  const [formData, setFormData] = useState(initForm());

  useEffect(() => { loadAll(); }, [projectId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [stkRes, projRes] = await Promise.allSettled([
        stockAPI.getAll({ project_id: projectId }),
        projectsAPI.getOne(projectId),
      ]);
      if (stkRes.status === 'fulfilled' && stkRes.value.data.success) {
        setStockItems(stkRes.value.data.data || []);
        setIsDemo(false);
      } else {
        setStockItems(DEMO_STOCK);
        setIsDemo(true);
      }
      if (projRes.status === 'fulfilled' && projRes.value.data.success) setProject(projRes.value.data.data);
    } catch {
      setStockItems(DEMO_STOCK);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedItem) {
        await stockAPI.update(selectedItem.id, formData);
        toast.success('Stock record updated!');
      } else {
        await stockAPI.create(formData);
        toast.success('Stock transaction recorded!');
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
      await stockAPI.delete(selectedItem.id);
      toast.success('Deleted');
      setIsDeleteOpen(false);
      loadAll();
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      project_id: projectId,
      material_name: item.material_name || '',
      category: item.category || '',
      transaction_type: item.transaction_type || 'in',
      quantity: item.quantity || '',
      unit: item.unit || 'piece',
      unit_price: item.unit_price || '',
      transaction_date: item.transaction_date || '',
      location: item.location || '',
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const totalIn = stockItems.filter((s) => s.transaction_type === 'in').reduce((sum, s) => sum + parseFloat(s.total_value || s.quantity * (s.unit_price || 0) || 0), 0);
  const totalOut = stockItems.filter((s) => s.transaction_type === 'out').reduce((sum, s) => sum + parseFloat(s.total_value || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}`} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 bg-white"><ArrowLeft size={18} /></Link>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Package size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-sm text-gray-500">{project?.name || `Project #${projectId}`}</p>
          </div>
        </div>
        <button onClick={() => { setSelectedItem(null); setFormData(initForm()); setIsModalOpen(true); }} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Record Transaction
        </button>
      </div>

      {isDemo && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-sm flex items-center gap-2"><AlertCircle size={16} /> Showing demo data.</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500">Total Stock In Value</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalIn)}</p>
          <span className="text-xs text-gray-400">{stockItems.filter((s) => s.transaction_type === 'in').length} receipts</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500">Stock Out / Used</span>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalOut)}</p>
          <span className="text-xs text-gray-400">{stockItems.filter((s) => s.transaction_type === 'out').length} issuances</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500">Net Stock Value</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalIn - totalOut)}</p>
          <span className="text-xs text-gray-400">Estimated on-hand</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Stock Transactions</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : stockItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
            <Package size={36} className="opacity-30" />
            <p className="text-sm">No stock transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Material</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Unit</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Value</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stockItems.map((s) => {
                  const cfg = TYPE_CONFIG[s.transaction_type] || TYPE_CONFIG.in;
                  const TIcon = cfg.icon;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5"><span className="font-mono text-xs text-gray-400">{s.stock_code}</span></td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900">{s.material_name || s.material_name_ref || '—'}</div>
                        {s.category && <div className="text-xs text-gray-400">{s.category}</div>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>
                          <TIcon size={11} /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-gray-900">{Number(s.quantity).toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-gray-500">{s.unit}</td>
                      <td className={`px-5 py-3.5 text-right font-bold ${s.transaction_type === 'out' ? 'text-red-600' : 'text-emerald-700'}`}>
                        {formatCurrency(s.total_value || (s.quantity * (s.unit_price || 0)))}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{formatDate(s.transaction_date)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Edit2 size={14} /></button>
                          <button onClick={() => { setSelectedItem(s); setIsDeleteOpen(true); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedItem ? 'Edit Stock Record' : 'Record Stock Transaction'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Material Name *</label>
              <input type="text" required value={formData.material_name} onChange={(e) => setFormData({ ...formData, material_name: e.target.value })} className="form-input" placeholder="e.g., BSRM Rebar 16mm" />
            </div>
            <div>
              <label className="form-label">Category</label>
              <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="form-input" placeholder="e.g., Steel, Cement, Sand" />
            </div>
            <div>
              <label className="form-label">Transaction Type *</label>
              <select value={formData.transaction_type} onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })} className="form-input">
                <option value="in">Stock In (Received)</option>
                <option value="out">Stock Out (Used/Issued)</option>
                <option value="transfer">Transfer</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
            <div>
              <label className="form-label">Quantity *</label>
              <input type="number" step="0.001" required value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Unit</label>
              <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="form-input">
                <option value="piece">Piece</option>
                <option value="ton">Ton</option>
                <option value="kg">Kg</option>
                <option value="bag">Bag</option>
                <option value="cft">Cft</option>
                <option value="sqft">Sqft</option>
                <option value="meter">Meter</option>
                <option value="litre">Litre</option>
                <option value="pcs">Pcs</option>
              </select>
            </div>
            <div>
              <label className="form-label">Unit Price (৳)</label>
              <input type="number" step="0.01" value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Transaction Date *</label>
              <input type="date" required value={formData.transaction_date} onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })} className="form-input" />
            </div>
            {formData.quantity && formData.unit_price && (
              <div className="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                <span className="text-amber-700 font-medium">Calculated Value: </span>
                <span className="font-bold text-amber-800">{formatCurrency(parseFloat(formData.quantity || 0) * parseFloat(formData.unit_price || 0))}</span>
              </div>
            )}
            <div>
              <label className="form-label">Location / Store</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="form-input" placeholder="e.g., Site Store, 5th Floor" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">{submitting ? 'Saving...' : selectedItem ? 'Update' : 'Record Transaction'}</button>
          </div>
        </form>
      </Modal>
      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Record" message="Delete this stock transaction record?" />
    </div>
  );
}
