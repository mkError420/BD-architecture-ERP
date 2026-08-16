import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { projectPaymentsAPI } from '../../api';
import { DollarSign, Plus, Search, Edit, Trash2 } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';

export default function ClientPayments() {
  const { projectId } = useParams();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [formData, setFormData] = useState({
    project_id: projectId,
    client_id: '',
    payment_code: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    milestone: '',
    notes: '',
  });

  useEffect(() => {
    loadPayments();
  }, [projectId]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await projectPaymentsAPI.getAll({ project_id: projectId });
      if (res.data.success) {
        setPayments(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedPayment) {
        await projectPaymentsAPI.update(selectedPayment.id, formData);
        toast.success('Payment updated successfully!');
      } else {
        await projectPaymentsAPI.create(formData);
        toast.success('Payment recorded successfully!');
      }
      setIsModalOpen(false);
      loadPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    try {
      await projectPaymentsAPI.delete(selectedPayment.id);
      toast.success('Payment deleted');
      setIsDeleteOpen(false);
      loadPayments();
    } catch (err) {
      toast.error('Failed to delete payment');
    }
  };

  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setFormData({
      project_id: projectId,
      client_id: payment.client_id || '',
      payment_code: payment.payment_code || '',
      amount: payment.amount || '',
      payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
      payment_method: payment.payment_method || 'cash',
      milestone: payment.milestone || '',
      notes: payment.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (payment) => {
    setSelectedPayment(payment);
    setIsDeleteOpen(true);
  };

  const handleAddNew = () => {
    setSelectedPayment(null);
    setFormData({
      project_id: projectId,
      client_id: '',
      payment_code: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      milestone: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Payment Code', render: (row) => <span className="font-mono text-xs">{row.payment_code}</span> },
    { header: 'Client', render: (row) => <span>{row.client_name}</span> },
    { header: 'Milestone', render: (row) => <span>{row.milestone || 'N/A'}</span> },
    { header: 'Amount', render: (row) => <span className="font-bold">৳{Number(row.amount).toLocaleString()}</span> },
    { header: 'Date', render: (row) => <span>{row.payment_date}</span> },
    { header: 'Method', render: (row) => <span className="capitalize">{row.payment_method}</span> },
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
            <DollarSign size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Payments</h1>
            <p className="text-gray-500 text-sm">Manage client payments and milestones</p>
          </div>
        </div>
        <button onClick={handleAddNew} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Add Payment
        </button>
      </div>

      <DataTable columns={columns} data={payments} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedPayment ? 'Edit Payment' : 'Add Payment'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Client ID *</label>
              <input type="text" required value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Payment Code</label>
              <input type="text" value={formData.payment_code} onChange={(e) => setFormData({ ...formData, payment_code: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Milestone</label>
              <input type="text" value={formData.milestone} onChange={(e) => setFormData({ ...formData, milestone: e.target.value })} className="form-input" placeholder="e.g., Foundation, Structure, Finishing" />
            </div>
            <div>
              <label className="form-label">Amount (৳) *</label>
              <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Payment Date *</label>
              <input type="date" required value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Payment Method</label>
              <select value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} className="form-input">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="mobile_banking">Mobile Banking</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input"></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Payment</button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Payment" message="Are you sure you want to delete this payment?" />
    </div>
  );
}
