import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { purchasesAPI } from '../../api';
import { ShoppingCart, Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';

export default function Purchases() {
  const { projectId } = useParams();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [formData, setFormData] = useState({
    project_id: projectId,
    purchase_type: 'order',
    supplier_id: '',
    total_amount: '',
    purchase_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    status: 'pending',
    notes: '',
  });

  useEffect(() => {
    loadPurchases();
  }, [projectId]);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const res = await purchasesAPI.getAll({ project_id: projectId, type: 'orders' });
      if (res.data.success) {
        setPurchases(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load purchases:', err);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, type: 'orders' };
      if (selectedPurchase) {
        await purchasesAPI.update(selectedPurchase.id, data);
        toast.success('Purchase updated successfully!');
      } else {
        await purchasesAPI.create(data);
        toast.success('Purchase created successfully!');
      }
      setIsModalOpen(false);
      loadPurchases();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    try {
      await purchasesAPI.delete(selectedPurchase.id, { type: 'orders' });
      toast.success('Purchase deleted');
      setIsDeleteOpen(false);
      loadPurchases();
    } catch (err) {
      toast.error('Failed to delete purchase');
    }
  };

  const handleEdit = (purchase) => {
    setSelectedPurchase(purchase);
    setFormData({
      project_id: projectId,
      purchase_type: purchase.purchase_type || 'order',
      supplier_id: purchase.supplier_id || '',
      total_amount: purchase.total_amount || '',
      purchase_date: purchase.purchase_date || new Date().toISOString().split('T')[0],
      expected_delivery_date: purchase.expected_delivery_date || '',
      status: purchase.status || 'pending',
      notes: purchase.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (purchase) => {
    setSelectedPurchase(purchase);
    setIsDeleteOpen(true);
  };

  const handleAddNew = () => {
    setSelectedPurchase(null);
    setFormData({
      project_id: projectId,
      purchase_type: 'order',
      supplier_id: '',
      total_amount: '',
      purchase_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      status: 'pending',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Purchase Code', render: (row) => <span className="font-mono text-xs">{row.purchase_code}</span> },
    { header: 'Supplier', render: (row) => <span>{row.supplier_name}</span> },
    { header: 'Type', render: (row) => <span className="capitalize">{row.purchase_type}</span> },
    { header: 'Amount', render: (row) => <span className="font-bold">৳{Number(row.total_amount).toLocaleString()}</span> },
    { header: 'Date', render: (row) => <span>{row.purchase_date}</span> },
    { header: 'Status', render: (row) => <span className="capitalize">{row.status}</span> },
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
            <ShoppingCart size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
            <p className="text-gray-500 text-sm">Manage purchase orders, requests, and quotations</p>
          </div>
        </div>
        <button onClick={handleAddNew} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> New Purchase
        </button>
      </div>

      <DataTable columns={columns} data={purchases} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedPurchase ? 'Edit Purchase' : 'Add Purchase'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Purchase Type</label>
              <select value={formData.purchase_type} onChange={(e) => setFormData({ ...formData, purchase_type: e.target.value })} className="form-input">
                <option value="order">Purchase Order</option>
                <option value="request">Purchase Request</option>
                <option value="quotation">Quotation</option>
              </select>
            </div>
            <div>
              <label className="form-label">Supplier ID *</label>
              <input type="text" required value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Total Amount (৳) *</label>
              <input type="number" step="0.01" required value={formData.total_amount} onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Purchase Date *</label>
              <input type="date" required value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Expected Delivery</label>
              <input type="date" value={formData.expected_delivery_date} onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="form-input">
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="ordered">Ordered</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input"></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Purchase</button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Purchase" message="Are you sure you want to delete this purchase?" />
    </div>
  );
}
