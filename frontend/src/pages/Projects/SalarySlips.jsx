import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { salaryAPI, employeesAPI } from '../../api';
import { CreditCard, Plus, Edit, Trash2, ArrowLeft, DollarSign, Clock, Users, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/helpers';

const DEMO_SALARIES = [
  {
    id: 1,
    project_id: 1,
    employee_id: 1,
    employee_name: 'Engr. Mahbubur Rahman',
    employee_role: 'Project Manager',
    payment_month: '2025-02',
    basic_salary: 75000,
    overtime_pay: 0,
    bonus: 5000,
    deduction: 2500,
    net_salary: 77500,
    payment_date: '2025-03-01',
    payment_method: 'bank_transfer',
    transaction_ref: 'EBL-TRX-998231',
    status: 'paid',
    notes: 'Monthly project manager salary with performance bonus',
  },
  {
    id: 2,
    project_id: 1,
    employee_id: 2,
    employee_name: 'Tanvir Ahmed',
    employee_role: 'Site Engineer',
    payment_month: '2025-02',
    basic_salary: 45000,
    overtime_pay: 4200,
    bonus: 0,
    deduction: 1500,
    net_salary: 47700,
    payment_date: '2025-03-01',
    payment_method: 'bank_transfer',
    transaction_ref: 'DBBL-TRX-102934',
    status: 'paid',
    notes: 'Site supervision and weekend overtime',
  },
  {
    id: 3,
    project_id: 1,
    employee_id: 3,
    employee_name: 'Shah Alam',
    employee_role: 'Chief Surveyor',
    payment_month: '2025-02',
    basic_salary: 38000,
    overtime_pay: 2500,
    bonus: 0,
    deduction: 1000,
    net_salary: 39500,
    payment_date: '2025-03-02',
    payment_method: 'mobile_banking',
    transaction_ref: 'BKASH-017129988',
    status: 'paid',
    notes: 'Topographic & foundation level surveys',
  },
  {
    id: 4,
    project_id: 1,
    employee_id: 4,
    employee_name: 'Nasir Uddin',
    employee_role: 'Site Safety Officer',
    payment_month: '2025-02',
    basic_salary: 35000,
    overtime_pay: 1800,
    bonus: 0,
    deduction: 1000,
    net_salary: 35800,
    payment_date: '2025-03-05',
    payment_method: 'bank_transfer',
    transaction_ref: 'CITY-TRX-774612',
    status: 'pending',
    notes: 'Awaiting director approval for release',
  },
  {
    id: 5,
    project_id: 1,
    employee_id: 5,
    employee_name: 'Al-Amin Mia',
    employee_role: 'Material & Store Officer',
    payment_month: '2025-02',
    basic_salary: 30000,
    overtime_pay: 1500,
    bonus: 0,
    deduction: 800,
    net_salary: 30700,
    payment_date: '2025-03-05',
    payment_method: 'cash',
    transaction_ref: '',
    status: 'pending',
    notes: 'Inventory management and stock verification',
  },
];

export default function SalarySlips() {
  const { projectId } = useParams();
  const [salarySlips, setSalarySlips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const initialForm = {
    project_id: projectId,
    employee_id: '',
    employee_name: '',
    payment_month: currentMonth,
    basic_salary: 35000,
    overtime_pay: 0,
    bonus: 0,
    deduction: 0,
    net_salary: 35000,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    transaction_ref: '',
    status: 'paid',
    notes: '',
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    loadSalarySlips();
    loadEmployees();
  }, [projectId]);

  const loadEmployees = async () => {
    try {
      const res = await employeesAPI.getAll({ per_page: 100 });
      const list = res.data?.data?.items || res.data?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setEmployees(list);
      }
    } catch {
      // ignore
    }
  };

  const loadSalarySlips = async () => {
    setLoading(true);
    try {
      const res = await salaryAPI.getAll({ project_id: projectId, per_page: 100 });
      const records = res.data?.data?.items || res.data?.data || [];
      if (Array.isArray(records) && records.length > 0) {
        setSalarySlips(records);
        setIsDemo(false);
      } else {
        setSalarySlips(DEMO_SALARIES);
        setIsDemo(true);
      }
    } catch (err) {
      console.warn('Salary API failed, showing demo data:', err);
      setSalarySlips(DEMO_SALARIES);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCalc = (updatedFields) => {
    const next = { ...formData, ...updatedFields };
    const basic = parseFloat(next.basic_salary) || 0;
    const ot = parseFloat(next.overtime_pay) || 0;
    const bonus = parseFloat(next.bonus) || 0;
    const deduction = parseFloat(next.deduction) || 0;
    const net = basic + ot + bonus - deduction;

    setFormData({
      ...next,
      net_salary: Math.max(0, net),
    });
  };

  const handleAddNew = () => {
    setSelectedSalary(null);
    setFormData({
      ...initialForm,
      project_id: projectId,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (salary) => {
    setSelectedSalary(salary);
    setFormData({
      project_id: projectId,
      employee_id: salary.employee_id || '',
      employee_name: salary.employee_name || '',
      payment_month: salary.payment_month || currentMonth,
      basic_salary: salary.basic_salary || 0,
      overtime_pay: salary.overtime_pay || 0,
      bonus: salary.bonus || 0,
      deduction: salary.deduction || 0,
      net_salary: salary.net_salary || 0,
      payment_date: salary.payment_date || new Date().toISOString().split('T')[0],
      payment_method: salary.payment_method || 'bank_transfer',
      transaction_ref: salary.transaction_ref || '',
      status: salary.status || 'paid',
      notes: salary.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (salary) => {
    setSelectedSalary(salary);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      project_id: projectId,
      basic_salary: parseFloat(formData.basic_salary) || 0,
      overtime_pay: parseFloat(formData.overtime_pay) || 0,
      bonus: parseFloat(formData.bonus) || 0,
      deduction: parseFloat(formData.deduction) || 0,
      net_salary: parseFloat(formData.net_salary) || 0,
    };

    try {
      if (selectedSalary) {
        if (isDemo) {
          setSalarySlips(prev => prev.map(s => s.id === selectedSalary.id ? { ...s, ...payload } : s));
          toast.success('Salary slip updated!');
        } else {
          await salaryAPI.update(selectedSalary.id, payload);
          toast.success('Salary slip updated successfully!');
          loadSalarySlips();
        }
      } else {
        if (isDemo) {
          const newSalary = {
            id: Date.now(),
            ...payload,
          };
          setSalarySlips(prev => [newSalary, ...prev]);
          toast.success('Salary slip created successfully!');
        } else {
          await salaryAPI.create(payload);
          toast.success('Salary slip created successfully!');
          loadSalarySlips();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      if (isDemo) {
        setSalarySlips(prev => prev.filter(s => s.id !== selectedSalary.id));
        toast.success('Salary slip deleted');
      } else {
        await salaryAPI.delete(selectedSalary.id);
        toast.success('Salary slip deleted');
        loadSalarySlips();
      }
      setIsDeleteOpen(false);
    } catch {
      toast.error('Failed to delete salary slip');
    }
  };

  // KPIs
  const stats = useMemo(() => {
    const totalPaid = salarySlips
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + (parseFloat(s.net_salary) || 0), 0);
    const totalPending = salarySlips
      .filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + (parseFloat(s.net_salary) || 0), 0);
    const avgSalary = salarySlips.length > 0 ? (totalPaid + totalPending) / salarySlips.length : 0;
    return { totalPaid, totalPending, count: salarySlips.length, avgSalary };
  }, [salarySlips]);

  const columns = [
    {
      header: 'Employee / Staff',
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.employee_name || `Staff #${row.employee_id}`}</div>
          {row.employee_role && <span className="text-xs text-gray-500">{row.employee_role}</span>}
        </div>
      ),
    },
    {
      header: 'Salary Month',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
          {row.payment_month || '-'}
        </span>
      ),
    },
    {
      header: 'Basic + Allowances',
      render: (row) => (
        <div className="text-xs">
          <div className="font-medium text-gray-800">Basic: {formatCurrency(row.basic_salary || 0)}</div>
          {(parseFloat(row.overtime_pay) > 0 || parseFloat(row.bonus) > 0) && (
            <div className="text-green-600">
              +{formatCurrency((parseFloat(row.overtime_pay) || 0) + (parseFloat(row.bonus) || 0))} OT/Bonus
            </div>
          )}
          {parseFloat(row.deduction) > 0 && (
            <div className="text-red-500">-{formatCurrency(row.deduction)} ded.</div>
          )}
        </div>
      ),
    },
    {
      header: 'Net Salary',
      render: (row) => (
        <div>
          <span className="font-bold text-gray-900 text-sm">
            {formatCurrency(row.net_salary || 0)}
          </span>
          <div className="text-[11px] text-gray-400 capitalize">{row.payment_method?.replace('_', ' ') || 'bank'}</div>
        </div>
      ),
    },
    {
      header: 'Payment Date',
      render: (row) => (
        <div className="text-xs text-gray-600">
          <div>{formatDate(row.payment_date)}</div>
          {row.transaction_ref && <div className="font-mono text-[10px] text-gray-400">{row.transaction_ref}</div>}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
          row.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {row.status === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
          {row.status || 'paid'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
            title="Edit"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={() => handleDeleteClick(row)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div>
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Project Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)' }}>
              <CreditCard size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Salary Slips</h1>
              <p className="text-gray-500 text-sm">Monthly salary distribution, allowances and payment records for project staff</p>
            </div>
          </div>
          <button onClick={handleAddNew} className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto">
            <Plus size={18} /> New Salary Slip
          </button>
        </div>
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
          <AlertCircle size={16} className="shrink-0 text-amber-600" />
          <span>Showing demo salary records. Database records or newly created slips will appear here.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Paid</span>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign size={18} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalPaid)}</div>
          <span className="text-xs text-green-600 font-medium">Salaries disbursed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Pending Salaries</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock size={18} /></div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{formatCurrency(stats.totalPending)}</div>
          <span className="text-xs text-gray-500 font-medium">To be cleared</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Staff Slips</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Users size={18} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.count}</div>
          <span className="text-xs text-gray-500">Payments tracked</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Average Salary</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar size={18} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.avgSalary)}</div>
          <span className="text-xs text-gray-500">Per staff monthly</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <DataTable columns={columns} data={salarySlips} loading={loading} />
      </div>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedSalary ? 'Edit Salary Slip' : 'Create Salary Slip'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Employee / Staff *</label>
              {employees.length > 0 ? (
                <select
                  required
                  value={formData.employee_id}
                  onChange={(e) => {
                    const emp = employees.find(x => String(x.id) === String(e.target.value));
                    setFormData({
                      ...formData,
                      employee_id: e.target.value,
                      employee_name: emp ? emp.name : formData.employee_name,
                    });
                  }}
                  className="form-input"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role || emp.designation || 'Staff'})</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="e.g. Engr. Mahbubur Rahman"
                  value={formData.employee_name}
                  onChange={(e) => setFormData({ ...formData, employee_name: e.target.value, employee_id: formData.employee_id || 1 })}
                  className="form-input"
                />
              )}
            </div>

            <div>
              <label className="form-label">Payment Month (YYYY-MM) *</label>
              <input
                type="month"
                required
                value={formData.payment_month}
                onChange={(e) => setFormData({ ...formData, payment_month: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Basic Salary (৳) *</label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={formData.basic_salary}
                onChange={(e) => handleCalc({ basic_salary: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Overtime Pay (৳)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.overtime_pay}
                onChange={(e) => handleCalc({ overtime_pay: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Bonus / Allowance (৳)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.bonus}
                onChange={(e) => handleCalc({ bonus: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Deductions (৳)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.deduction}
                onChange={(e) => handleCalc({ deduction: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Calculated Net Salary (৳) *</label>
              <input
                type="number"
                step="1"
                required
                value={formData.net_salary}
                onChange={(e) => setFormData({ ...formData, net_salary: parseFloat(e.target.value) || 0 })}
                className="form-input font-bold bg-gray-50"
              />
            </div>

            <div>
              <label className="form-label">Payment Date *</label>
              <input
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="form-input"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="mobile_banking">Mobile Banking (bKash/Nagad)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-input"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Transaction Reference / Cheque #</label>
              <input
                type="text"
                placeholder="e.g. TRX-998231 or Cheque #448921"
                value={formData.transaction_ref}
                onChange={(e) => setFormData({ ...formData, transaction_ref: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea
                rows="2"
                placeholder="Additional details, approval references..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="form-input"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {selectedSalary ? 'Update Salary Slip' : 'Save Salary Slip'}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Salary Slip"
        message="Are you sure you want to delete this salary slip record? This action cannot be undone."
      />
    </div>
  );
}
