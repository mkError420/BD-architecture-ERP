import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { stockAPI } from '../../api';
import { Package, Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';

export default function StockManagement() {
  const { projectId } = useParams();
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({
    project_id: projectId,
    material_id: '',
    transaction_type: 'transfer_in',
    quantity: '',
    unit: 'piece',
    transaction_date: new Date().toISOString().split('T')[0],
    source_location: '',
    destination_location: '',
    notes: '',
  });

  useEffect(() => {
    loadStock();
  }, [projectId]);

  const loadStock = async () => {
    setLoading(true);
    try {
      const res = await stockAPI.getAll({ project_id: projectId, type: 'transfers' });
      if (res.data.success) {
        setStockItems(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load stock:', err);
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, type: 'transfers' };
      if (selectedItem) {
        await stockAPI.update(selectedItem.id, data);
        toast.success('Stock updated successfully!');
      } else {
        await stockAPI.create(data);
        toast.success('Stock recorded successfully!');
      }
      setIsModalOpen(false);
      loadStock();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    try {
      await stockAPI.delete(selectedItem.id, { type: 'transfers' });
      toast.success('Stock deleted');
      setIsDeleteOpen(false);
      loadStock();
    } catch (err) {
      toast.error('Failed to delete stock');
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      project_id: projectId,
      material_id: item.material_id || '',
      transaction_type: item.transaction_type || 'transfer_in',
      quantity: item.quantity || '',
      unit: item.unit || 'piece',
      transaction_date: item.transaction_date || new Date().toISOString().split('T')[0],
      source_location: item.source_location || '',
      destination_location: item.destination_location || '',
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setFormData({
      project_id: projectId,
      material_id: '',
      transaction_type: 'transfer_in',
      quantity: '',
      unit: 'piece',
      transaction_date: new Date().toISOString().split('T')[0],
      source_location: '',
      destination_location: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Transaction Code', render: (row) => <span className="font-mono text-xs">{row.transaction_code}</span> },
    { header: 'Material', render: (row) => <span>{row.material_name}</span> },
    { header: 'Type', render: (row) => <span className="capitalize">{row.transaction_type?.replace('_', ' ')}</span> },
    { header: 'Quantity', render: (row) => <span>{row.quantity} {row.unit}</span> },
    { header: 'Date', render: (row) => <span>{row.transaction_date}</span> },
    { header: 'From/To', render: (row) => <span>{row.source_location || row.destination_location}</span> },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => handleDeleteClick(row)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #A0975A, #8a824a)' }}>
            <Package size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-gray-500 text-sm">Manage inventory, transfers, and adjustments</p>
          </div>
        </div>
        <button onClick={handleAddNew} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Add Stock
        </button>
      </div>

      <DataTable columns={columns} data={stockItems} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedItem ? 'Edit Stock Transaction' : 'Add Stock Transaction'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Material ID *</label>
              <input type="text" required value={formData.material_id} onChange={(e) => setFormData({ ...formData, material_id: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Transaction Type</label>
              <select value={formData.transaction_type} onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })} className="form-input">
                <option value="transfer_in">Transfer In</option>
                <option value="transfer_out">Transfer Out</option>
                <option value="adjustment">Adjustment</option>
                <option value="consumption">Consumption</option>
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
                <option value="kg">Kg</option>
                <option value="ton">Ton</option>
                <option value="cft">Cft</option>
                <option value="sqft">Sqft</option>
              </select>
            </div>
            <div>
              <label className="form-label">Transaction Date *</label>
              <input type="date" required value={formData.transaction_date} onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Source Location</label>
              <input type="text" value={formData.source_location} onChange={(e) => setFormData({ ...formData, source_location: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Destination Location</label>
              <input type="text" value={formData.destination_location} onChange={(e) => setFormData({ ...formData, destination_location: e.target.value })} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input"></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Transaction</button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Stock" message="Are you sure you want to delete this stock transaction?" />
    </div>
  );
}
