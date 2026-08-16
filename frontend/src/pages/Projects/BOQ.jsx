import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { boqAPI } from '../../api';
import { FileText, Plus } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';

export default function BOQ() {
  const { projectId } = useParams();
  const [boqItems, setBoqItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({
    project_id: projectId,
    category: '',
    description: '',
    unit: 'piece',
    quantity: '',
    unit_rate: '',
    work_type: 'civil',
    notes: '',
  });

  useEffect(() => {
    loadBOQ();
  }, [projectId]);

  const loadBOQ = async () => {
    setLoading(true);
    try {
      const res = await boqAPI.getAll({ project_id: projectId, type: 'items' });
      if (res.data.success) {
        setBoqItems(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load BOQ:', err);
      setBoqItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, type: 'items' };
      if (selectedItem) {
        await boqAPI.update(selectedItem.id, data);
        toast.success('BOQ item updated successfully!');
      } else {
        await boqAPI.create(data);
        toast.success('BOQ item added successfully!');
      }
      setIsModalOpen(false);
      loadBOQ();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    try {
      await boqAPI.delete(selectedItem.id, { type: 'items' });
      toast.success('BOQ item deleted');
      setIsDeleteOpen(false);
      loadBOQ();
    } catch (err) {
      toast.error('Failed to delete BOQ item');
    }
  };

  const columns = [
    { header: 'Item Code', render: (row) => <span className="font-mono text-xs">{row.item_code}</span> },
    { header: 'Description', render: (row) => <span className="font-medium">{row.description}</span> },
    { header: 'Category', render: (row) => <span className="capitalize">{row.category}</span> },
    { header: 'Quantity', render: (row) => <span>{row.quantity} {row.unit}</span> },
    { header: 'Unit Rate', render: (row) => <span>৳{Number(row.unit_rate).toLocaleString()}</span> },
    { header: 'Total', render: (row) => <span className="font-bold">৳{Number(row.total_amount).toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <FileText size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bill of Quantities</h1>
            <p className="text-gray-500 text-sm">Manage BOQ items and cost estimates</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Add BOQ Item
        </button>
      </div>

      <DataTable columns={columns} data={boqItems} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add BOQ Item" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Description *</label>
              <input type="text" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Category</label>
              <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Unit</label>
              <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="form-input">
                <option value="piece">Piece</option>
                <option value="sqft">Sqft</option>
                <option value="cft">Cft</option>
                <option value="kg">Kg</option>
                <option value="ton">Ton</option>
                <option value="meter">Meter</option>
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
            <div>
              <label className="form-label">Work Type</label>
              <select value={formData.work_type} onChange={(e) => setFormData({ ...formData, work_type: e.target.value })} className="form-input">
                <option value="civil">Civil</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="finishing">Finishing</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input"></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Item</button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete BOQ Item" message="Are you sure you want to delete this BOQ item?" />
    </div>
  );
}
