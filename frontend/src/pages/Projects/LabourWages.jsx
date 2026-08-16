import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { labourWagesAPI } from '../../api';
import { Users, Plus } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';

export default function LabourWages() {
  const { projectId } = useParams();
  const [wageSlips, setWageSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);

  const [formData, setFormData] = useState({
    project_id: projectId,
    employee_id: '',
    wage_type: 'daily',
    work_days: '',
    daily_rate: '',
    overtime_hours: 0,
    overtime_rate: 0,
    bonus: 0,
    deduction: 0,
    total_amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadWageSlips();
  }, [projectId]);

  const loadWageSlips = async () => {
    setLoading(true);
    try {
      const res = await labourWagesAPI.getAll({ project_id: projectId });
      if (res.data.success) {
        setWageSlips(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load wage slips:', err);
      setWageSlips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedSlip) {
        await labourWagesAPI.update(selectedSlip.id, formData);
        toast.success('Wage slip updated successfully!');
      } else {
        await labourWagesAPI.create(formData);
        toast.success('Wage slip created successfully!');
      }
      setIsModalOpen(false);
      loadWageSlips();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    try {
      await labourWagesAPI.delete(selectedSlip.id);
      toast.success('Wage slip deleted');
      setIsDeleteOpen(false);
      loadWageSlips();
    } catch (err) {
      toast.error('Failed to delete wage slip');
    }
  };

  const columns = [
    { header: 'Slip Code', render: (row) => <span className="font-mono text-xs">{row.slip_code}</span> },
    { header: 'Employee', render: (row) => <span>{row.employee_name}</span> },
    { header: 'Type', render: (row) => <span className="capitalize">{row.wage_type}</span> },
    { header: 'Days', render: (row) => <span>{row.work_days}</span> },
    { header: 'Total Amount', render: (row) => <span className="font-bold">৳{Number(row.total_amount).toLocaleString()}</span> },
    { header: 'Payment Date', render: (row) => <span>{row.payment_date}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Labour Wage Slips</h1>
            <p className="text-gray-500 text-sm">Manage labour wages and payments</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Create Wage Slip
        </button>
      </div>

      <DataTable columns={columns} data={wageSlips} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Wage Slip" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Employee ID *</label>
              <input type="text" required value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Wage Type</label>
              <select value={formData.wage_type} onChange={(e) => setFormData({ ...formData, wage_type: e.target.value })} className="form-input">
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="form-label">Work Days *</label>
              <input type="number" required value={formData.work_days} onChange={(e) => setFormData({ ...formData, work_days: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Daily Rate (৳) *</label>
              <input type="number" step="0.01" required value={formData.daily_rate} onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Overtime Hours</label>
              <input type="number" step="0.5" value={formData.overtime_hours} onChange={(e) => setFormData({ ...formData, overtime_hours: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Overtime Rate (৳)</label>
              <input type="number" step="0.01" value={formData.overtime_rate} onChange={(e) => setFormData({ ...formData, overtime_rate: e.target.value })} className="form-input" />
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
              <label className="form-label">Total Amount (৳) *</label>
              <input type="number" step="0.01" required value={formData.total_amount} onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Payment Date *</label>
              <input type="date" required value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input"></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Wage Slip</button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Wage Slip" message="Are you sure you want to delete this wage slip?" />
    </div>
  );
}
