import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { boqAPI, projectsAPI } from '../../api';
import { FileText, Plus, Edit2, Trash2, ArrowLeft, AlertCircle, TrendingUp, Package, Zap } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/helpers';

const DEMO_ITEMS = [
  { id: 1, item_code: 'BOQ-A001', category: 'Substructure', description: 'Earthwork Excavation & Disposal (Basement 1&2)', unit: 'cft', quantity: 85000, unit_rate: 12, total_amount: 1020000, work_type: 'civil', priority: 'high' },
  { id: 2, item_code: 'BOQ-A002', category: 'Substructure', description: 'Cast-in-situ Bored Piles (Dia 800mm, L=85ft)', unit: 'no', quantity: 48, unit_rate: 285000, total_amount: 13680000, work_type: 'civil', priority: 'high' },
  { id: 3, item_code: 'BOQ-B001', category: 'Superstructure', description: 'RCC Column (M-40 grade) - 3rd to 10th Floor', unit: 'cft', quantity: 12500, unit_rate: 420, total_amount: 5250000, work_type: 'civil', priority: 'high' },
  { id: 4, item_code: 'BOQ-B002', category: 'Superstructure', description: 'RCC Beam & Slab (M-35 grade) - All Floors', unit: 'cft', quantity: 38000, unit_rate: 380, total_amount: 14440000, work_type: 'civil', priority: 'high' },
  { id: 5, item_code: 'BOQ-C001', category: 'Finishing', description: 'External Brick Masonry (10" wall) - All Floors', unit: 'sqft', quantity: 28500, unit_rate: 95, total_amount: 2707500, work_type: 'civil', priority: 'medium' },
  { id: 6, item_code: 'BOQ-D001', category: 'Electrical', description: 'Full Electrical Wiring & Distribution Board (14-floors)', unit: 'lot', quantity: 1, unit_rate: 8500000, total_amount: 8500000, work_type: 'electrical', priority: 'medium' },
  { id: 7, item_code: 'BOQ-E001', category: 'Plumbing', description: 'Plumbing, Sanitary & Water Supply (Complete)', unit: 'lot', quantity: 1, unit_rate: 6200000, total_amount: 6200000, work_type: 'plumbing', priority: 'medium' },
];

const WORK_TYPE_COLORS = {
  civil: 'bg-blue-50 text-blue-700',
  electrical: 'bg-amber-50 text-amber-700',
  plumbing: 'bg-cyan-50 text-cyan-700',
  finishing: 'bg-pink-50 text-pink-700',
  other: 'bg-gray-50 text-gray-700',
};
const PRIORITY_COLORS = { high: 'bg-red-50 text-red-600', medium: 'bg-amber-50 text-amber-600', low: 'bg-gray-50 text-gray-500' };

export default function BOQ() {
  const { projectId } = useParams();
  const [items, setItems] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const initForm = () => ({
    project_id: projectId,
    category: '',
    description: '',
    unit: 'sqft',
    quantity: '',
    unit_rate: '',
    work_type: 'civil',
    priority: 'medium',
    notes: '',
  });
  const [formData, setFormData] = useState(initForm());

  useEffect(() => { loadAll(); }, [projectId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [boqRes, projRes] = await Promise.allSettled([
        boqAPI.getAll({ project_id: projectId, type: 'items' }),
        projectsAPI.getOne(projectId),
      ]);
      if (boqRes.status === 'fulfilled' && boqRes.value.data.success) {
        const d = boqRes.value.data.data;
        setItems(Array.isArray(d) ? d : (d?.data || []));
        setIsDemo(false);
      } else {
        setItems(DEMO_ITEMS);
        setIsDemo(true);
      }
      if (projRes.status === 'fulfilled' && projRes.value.data.success) setProject(projRes.value.data.data);
    } catch {
      setItems(DEMO_ITEMS);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { ...formData, type: 'items' };
      if (selectedItem) {
        await boqAPI.update(selectedItem.id, data);
        toast.success('BOQ item updated!');
      } else {
        await boqAPI.create(data);
        toast.success('BOQ item added!');
      }
      setIsModalOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save BOQ item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await boqAPI.delete(selectedItem.id, { type: 'items' });
      toast.success('BOQ item deleted');
      setIsDeleteOpen(false);
      loadAll();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      project_id: projectId,
      category: item.category || '',
      description: item.description || '',
      unit: item.unit || 'sqft',
      quantity: item.quantity || '',
      unit_rate: item.unit_rate || '',
      work_type: item.work_type || 'civil',
      priority: item.priority || 'medium',
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const filteredItems = items.filter((i) => {
    const matchType = filterType === 'all' || i.work_type === filterType;
    const matchSearch = !searchTerm || i.description?.toLowerCase().includes(searchTerm.toLowerCase()) || i.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const grandTotal = filteredItems.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);

  const categoryGroups = filteredItems.reduce((acc, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}`} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 bg-white">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            <FileText size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bill of Quantities</h1>
            <p className="text-sm text-gray-500">{project?.name || `Project #${projectId}`}</p>
          </div>
        </div>
        <button onClick={() => { setSelectedItem(null); setFormData(initForm()); setIsModalOpen(true); }} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Add BOQ Item
        </button>
      </div>

      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> Showing demo data.
        </div>
      )}

      {/* Summary + Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs sm:col-span-2">
          <span className="text-xs font-medium text-gray-500">Grand Total (BOQ)</span>
          <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(grandTotal)}</p>
          <span className="text-xs text-gray-400">{filteredItems.length} of {items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-medium text-gray-500">vs Project Budget</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {project?.total_budget ? `${Math.round((grandTotal / project.total_budget) * 100)}%` : '—'}
          </p>
          <span className="text-xs text-gray-400">Budget utilization</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-medium text-gray-500">Categories</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{Object.keys(categoryGroups).length}</p>
          <span className="text-xs text-gray-400">Work categories</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input max-w-xs"
        />
        <div className="flex gap-2">
          {['all', 'civil', 'electrical', 'plumbing', 'finishing', 'other'].map((t) => (
            <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors capitalize ${filterType === t ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Items by Category */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
          <FileText size={36} className="opacity-30" />
          <p className="text-sm">No BOQ items found</p>
          <button onClick={() => { setSelectedItem(null); setFormData(initForm()); setIsModalOpen(true); }} className="btn-primary text-sm">Add First Item</button>
        </div>
      ) : (
        Object.entries(categoryGroups).map(([category, catItems]) => {
          const catTotal = catItems.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
          return (
            <div key={category} className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{category}</h3>
                <span className="font-bold text-orange-600">{formatCurrency(catTotal)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-50">
                    <tr>
                      <th className="text-left px-5 py-2.5 text-xs text-gray-400 font-medium">Code</th>
                      <th className="text-left px-5 py-2.5 text-xs text-gray-400 font-medium">Description</th>
                      <th className="text-right px-5 py-2.5 text-xs text-gray-400 font-medium">Qty</th>
                      <th className="text-left px-5 py-2.5 text-xs text-gray-400 font-medium">Unit</th>
                      <th className="text-right px-5 py-2.5 text-xs text-gray-400 font-medium">Rate</th>
                      <th className="text-right px-5 py-2.5 text-xs text-gray-400 font-medium">Total</th>
                      <th className="text-left px-5 py-2.5 text-xs text-gray-400 font-medium">Type</th>
                      <th className="px-5 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {catItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3"><span className="font-mono text-xs text-gray-400">{item.item_code}</span></td>
                        <td className="px-5 py-3 font-medium text-gray-900 max-w-[240px]">{item.description}</td>
                        <td className="px-5 py-3 text-right text-gray-700">{Number(item.quantity).toLocaleString()}</td>
                        <td className="px-5 py-3 text-gray-500">{item.unit}</td>
                        <td className="px-5 py-3 text-right text-gray-700">৳{Number(item.unit_rate).toLocaleString()}</td>
                        <td className="px-5 py-3 text-right font-bold text-orange-700">{formatCurrency(item.total_amount)}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${WORK_TYPE_COLORS[item.work_type] || 'bg-gray-50 text-gray-600'}`}>
                            {item.work_type}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Edit2 size={14} /></button>
                            <button onClick={() => { setSelectedItem(item); setIsDeleteOpen(true); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-gray-100">
                    <tr>
                      <td colSpan={5} className="px-5 py-3 text-right text-sm font-semibold text-gray-600">Category Total:</td>
                      <td className="px-5 py-3 text-right font-bold text-orange-700">{formatCurrency(catTotal)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })
      )}

      {/* Grand total footer */}
      {filteredItems.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-5 flex items-center justify-between">
          <span className="font-semibold text-lg">Grand Total (BOQ)</span>
          <span className="text-2xl font-extrabold">{formatCurrency(grandTotal)}</span>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedItem ? 'Edit BOQ Item' : 'Add BOQ Item'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Description *</label>
              <input type="text" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="form-input" placeholder="e.g., RCC Column M-40 grade, 3rd to 10th Floor" />
            </div>
            <div>
              <label className="form-label">Category</label>
              <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="form-input" placeholder="e.g., Substructure, Superstructure, Finishing" />
            </div>
            <div>
              <label className="form-label">Work Type</label>
              <select value={formData.work_type} onChange={(e) => setFormData({ ...formData, work_type: e.target.value })} className="form-input">
                <option value="civil">Civil</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="finishing">Finishing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Unit</label>
              <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="form-input">
                <option value="sqft">sqft</option>
                <option value="cft">cft</option>
                <option value="cum">cum</option>
                <option value="kg">kg</option>
                <option value="ton">ton</option>
                <option value="meter">meter</option>
                <option value="run_meter">run meter</option>
                <option value="piece">piece</option>
                <option value="no">no.</option>
                <option value="lot">lot</option>
                <option value="each">each</option>
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="form-input">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="form-label">Quantity *</label>
              <input type="number" step="0.001" required value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Unit Rate (৳) *</label>
              <input type="number" step="0.01" required value={formData.unit_rate} onChange={(e) => setFormData({ ...formData, unit_rate: e.target.value })} className="form-input" />
            </div>
            {formData.quantity && formData.unit_rate && (
              <div className="sm:col-span-2 bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm">
                <span className="text-orange-700 font-medium">Calculated Total: </span>
                <span className="font-bold text-orange-800">{formatCurrency(parseFloat(formData.quantity || 0) * parseFloat(formData.unit_rate || 0))}</span>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">{submitting ? 'Saving...' : selectedItem ? 'Update Item' : 'Add Item'}</button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete BOQ Item" message="Delete this BOQ item? This action cannot be undone." />
    </div>
  );
}
