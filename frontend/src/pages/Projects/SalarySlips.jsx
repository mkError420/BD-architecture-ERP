import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { salaryAPI } from '../../api';
import { CreditCard, Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';

export default function SalarySlips() {
  const { projectId } = useParams();
  const [salarySlips, setSalarySlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);

  const [formData, setFormData] = useState({
    project_id: projectId,
    employee_id: '',
    salary_code: '',
    basic_salary: '',
    allowance: 0,
    bonus: 0,
    deduction: 0,
    tax: 0,
    net_salary: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    notes: '',
  });

  useEffect(() => {
    loadSalarySlips();
  }, [projectId]);

  const loadSalarySlips = async () => {
    setLoading(true);
    try {
      const res = await salaryAPI.getAll({ project_id: projectId });
      if (res.data.success) {
        setSalarySlips(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load salary slips:', err);
      setSalarySlips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedSalary) {
        await salaryAPI.update(selectedSalary.id, formData);
        toast.success('Salary slip updated successfully!');
      } else {
        await salaryAPI.create(formData);
        toast.success('Salary slip created successfully!');
      }
      setIsModalOpen(false);
      loadSalarySlips();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    try {
      await salaryAPI.delete(selectedSalary.id);
      toast.success('Salary slip deleted');
      setIsDeleteOpen(false);
      loadSalarySlips();
    } catch (err) {
      toast.error('Failed to delete salary slip');
    }
  };

  const handleEdit = (salary) => {
    setSelectedSalary(salary);
    setFormData({
      project_id: projectId,
      employee_id: salary.employee_id || '',
      salary_code: salary.salary_code || '',
      basic_salary: salary.basic_salary || '',
      allowance: salary.allowance || 0,
      bonus: salary.bonus || 0,
      deduction: salary.deduction || 0,
      tax: salary.tax || 0,
      net_salary: salary.net_salary || '',
      payment_date: salary.payment_date || new Date().toISOString().split('T')[0],
      payment_method: salary.payment_method || 'bank_transfer',
      notes: salary.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (salary) => {
    setSelectedSalary(salary);
    setIsDeleteOpen(true);
  };

  const handleAddNew = () => {
    setSelectedSalary(null);
    setFormData({
      project_id: projectId,
      employee_id: '',
      salary_code: '',
      basic_salary: '',
      allowance: 0,
      bonus: 0,
      deduction: 0,
      tax: 0,
      net_salary: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Salary Code', render: (row) => <span className="font-mono text-xs">{row.salary_code}</span> },
    { header: 'Employee', render: (row) => <span>{row.employee_name}</span> },
    { header: 'Basic Salary', render: (row) => <span>৳{Number(row.basic_salary).toLocaleString()}</span> },
    { header: 'Allowance', render: (row) => <span>৳{Number(row.allowance).toLocaleString()}</span> },
    { header: 'Net Salary', render: (row) => <span className="font-bold">৳{Number(row.net_salary).toLocaleString()}</span> },
    { header: 'Payment Date', render: (row) => <span>{row.payment_date}</span> },
    { header: 'Method', render: (row) => <span className="capitalize">{row.payment_method?.replace('_', ' ')}</span> },
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
            <CreditCard size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Salary Slips & Payments</h1>
            <p className="text-gray-500 text-sm">Manage employee salary slips and payments</p>
          </div>
        </div>
        <button onClick={handleAddNew} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Create Salary Slip
        </button>
      </div>

      <DataTable columns={columns} data={salarySlips} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedSalary ? 'Edit Salary Slip' : 'Create Salary Slip'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Employee ID *</label>
              <input type="text" required value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Salary Code</label>
              <input type="text" value={formData.salary_code} onChange={(e) => setFormData({ ...formData, salary_code: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Basic Salary (৳) *</label>
              <input type="number" step="0.01" required value={formData.basic_salary} onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Allowance (৳)</label>
              <input type="number" step="0.01" value={formData.allowance} onChange={(e) => setFormData({ ...formData, allowance: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Bonus (৳)</label>
              <input type="number" step="0.01" value={formData.bonus} onChange={(e) => setFormData({ ...formData, bonus: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Deduction (৳)</label>
              <input type="number" step="0.01" value={formData.deduction} onChange={(e) => setFormData({ ...formData, deduction: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Tax (৳)</label>
              <input type="number" step="0.01" value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Net Salary (৳) *</label>
              <input type="number" step="0.01" required value={formData.net_salary} onChange={(e) => setFormData({ ...formData, net_salary: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Payment Date *</label>
              <input type="date" required value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Payment Method</label>
              <select value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} className="form-input">
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
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
            <button type="submit" className="btn-primary">Save Salary Slip</button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Salary Slip" message="Are you sure you want to delete this salary slip?" />
    </div>
  );
}
