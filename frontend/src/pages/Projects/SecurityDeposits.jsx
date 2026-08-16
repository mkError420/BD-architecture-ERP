import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { securityDepositsAPI } from '../../api';
import { ShieldCheck, Plus, Search, Edit, Trash2 } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';

export default function SecurityDeposits() {
  const { projectId } = useParams();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);

  const [formData, setFormData] = useState({
    project_id: projectId,
    client_id: '',
    deposit_type: 'security_money',
    amount: '',
    deposit_date: new Date().toISOString().split('T')[0],
    bank_name: '',
    account_number: '',
    notes: '',
  });

  useEffect(() => {
    loadDeposits();
  }, [projectId]);

  const loadDeposits = async () => {
    setLoading(true);
    try {
      const res = await securityDepositsAPI.getAll({ project_id: projectId });
      if (res.data.success) {
        setDeposits(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load deposits:', err);
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedDeposit) {
        await securityDepositsAPI.update(selectedDeposit.id, formData);
        toast.success('Deposit updated successfully!');
      } else {
        await securityDepositsAPI.create(formData);
        toast.success('Deposit recorded successfully!');
      }
      setIsModalOpen(false);
      loadDeposits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    try {
      await securityDepositsAPI.delete(selectedDeposit.id);
      toast.success('Deposit deleted');
      setIsDeleteOpen(false);
      loadDeposits();
    } catch (err) {
      toast.error('Failed to delete deposit');
    }
  };

  const handleEdit = (deposit) => {
    setSelectedDeposit(deposit);
    setFormData({
      project_id: projectId,
      client_id: deposit.client_id || '',
      deposit_type: deposit.deposit_type || 'security_money',
      amount: deposit.amount || '',
      deposit_date: deposit.deposit_date || new Date().toISOString().split('T')[0],
      bank_name: deposit.bank_name || '',
      account_number: deposit.account_number || '',
      notes: deposit.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (deposit) => {
    setSelectedDeposit(deposit);
    setIsDeleteOpen(true);
  };

  const handleAddNew = () => {
    setSelectedDeposit(null);
    setFormData({
      project_id: projectId,
      client_id: '',
      deposit_type: 'security_money',
      amount: '',
      deposit_date: new Date().toISOString().split('T')[0],
      bank_name: '',
      account_number: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Deposit Code', render: (row) => <span className="font-mono text-xs">{row.deposit_code}</span> },
    { header: 'Type', render: (row) => <span className="capitalize">{row.deposit_type?.replace('_', ' ')}</span> },
    { header: 'Amount', render: (row) => <span className="font-bold">৳{Number(row.amount).toLocaleString()}</span> },
    { header: 'Date', render: (row) => <span>{row.deposit_date}</span> },
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
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Security Deposits</h1>
            <p className="text-gray-500 text-sm">Manage security deposits and guarantees</p>
          </div>
        </div>
        <button onClick={handleAddNew} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Add Deposit
        </button>
      </div>

      <DataTable columns={columns} data={deposits} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedDeposit ? 'Edit Security Deposit' : 'Add Security Deposit'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Client ID *</label>
              <input type="text" required value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Deposit Type</label>
              <select value={formData.deposit_type} onChange={(e) => setFormData({ ...formData, deposit_type: e.target.value })} className="form-input">
                <option value="security_money">Security Money</option>
                <option value="earnest_money">Earnest Money</option>
                <option value="performance_guarantee">Performance Guarantee</option>
                <option value="retention_money">Retention Money</option>
              </select>
            </div>
            <div>
              <label className="form-label">Amount (৳) *</label>
              <input type="number" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Deposit Date *</label>
              <input type="date" required value={formData.deposit_date} onChange={(e) => setFormData({ ...formData, deposit_date: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Bank Name</label>
              <input type="text" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input"></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Deposit</button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Deposit" message="Are you sure you want to delete this deposit?" />
    </div>
  );
}
