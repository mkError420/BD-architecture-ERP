import { useState, useEffect } from 'react';
import { salaryAPI, employeesAPI } from '../../api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { formatCurrency, formatDate, PAYMENT_METHODS } from '../../utils/helpers';
import { Plus, Search, Wallet, CheckCircle2, Clock, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Salary() {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    payment_month: new Date().toISOString().slice(0, 7),
    basic_salary: '',
    overtime_pay: 0,
    bonus: 0,
    deduction: 0,
    net_salary: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'mobile_banking',
    transaction_ref: '',
    status: 'paid',
    notes: '',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadSalaries();
  }, [month]);

  const loadEmployees = async () => {
    try {
      const res = await employeesAPI.getAll({ per_page: 100 });
      if (res.data.success) setEmployees(res.data.data);
    } catch (e) {
      console.warn('Employees fallback');
    }
  };

  const loadSalaries = async () => {
    setLoading(true);
    try {
      const res = await salaryAPI.getAll({ month });
      if (res.data.success) setSalaries(res.data.data);
    } catch {
      setSalaries([
        { id: 1, employee_name: 'Md. Rafiqul Islam', employee_code: 'EMP-00101', employee_role: 'supervisor', payment_month: '2025-08', basic_salary: 35000, overtime_pay: 3000, bonus: 2000, deduction: 0, net_salary: 40000, payment_date: '2025-08-01', payment_method: 'bank_transfer', status: 'paid' },
        { id: 2, employee_name: 'Engr. Shafiul Alam', employee_code: 'EMP-00104', employee_role: 'engineer', payment_month: '2025-08', basic_salary: 55000, overtime_pay: 0, bonus: 0, deduction: 1000, net_salary: 54000, payment_date: '2025-08-01', payment_method: 'bank_transfer', status: 'paid' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openDisburseModal = (emp = null) => {
    const selectedEmp = emp || employees[0];
    const basic = selectedEmp ? Number(selectedEmp.salary || 0) : 0;
    setFormData({
      employee_id: selectedEmp?.id || '',
      payment_month: month,
      basic_salary: basic,
      overtime_pay: 0,
      bonus: 0,
      deduction: 0,
      net_salary: basic,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'mobile_banking',
      transaction_ref: '',
      status: 'paid',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleEmpChange = (empId) => {
    const emp = employees.find(e => e.id == empId);
    const basic = emp ? Number(emp.salary || 0) : 0;
    setFormData(prev => ({
      ...prev,
      employee_id: empId,
      basic_salary: basic,
      net_salary: basic + Number(prev.overtime_pay || 0) + Number(prev.bonus || 0) - Number(prev.deduction || 0)
    }));
  };

  const handleCalc = (field, val) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: val };
      const basic = Number(updated.basic_salary) || 0;
      const ot = Number(updated.overtime_pay) || 0;
      const bon = Number(updated.bonus) || 0;
      const ded = Number(updated.deduction) || 0;
      updated.net_salary = basic + ot + bon - ded;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await salaryAPI.create(formData);
      toast.success('Salary disbursement recorded!');
      setIsModalOpen(false);
      loadSalaries();
    } catch {
      toast.error('Failed to disburse salary');
    }
  };

  const columns = [
    {
      header: 'Worker / Employee',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded font-bold">{row.employee_code}</span>
            <span className="font-bold text-gray-900">{row.employee_name}</span>
          </div>
          <div className="text-xs text-gray-400 capitalize">{row.employee_role?.replace('_', ' ')}</div>
        </div>
      ),
    },
    {
      header: 'Month',
      render: (row) => <span className="font-mono text-xs font-semibold text-gray-700">{row.payment_month}</span>,
    },
    {
      header: 'Basic Salary',
      render: (row) => <span className="font-medium text-gray-800">{formatCurrency(row.basic_salary)}</span>,
    },
    {
      header: 'Overtime + Bonus',
      render: (row) => (
        <span className="text-xs text-emerald-600 font-semibold">
          +{formatCurrency((Number(row.overtime_pay) || 0) + (Number(row.bonus) || 0))}
        </span>
      ),
    },
    {
      header: 'Net Paid (BDT)',
      render: (row) => (
        <span className="font-bold text-base text-gray-900">{formatCurrency(row.net_salary)}</span>
      ),
    },
    {
      header: 'Disbursement Info',
      render: (row) => (
        <div className="text-xs">
          <div className="text-gray-800">{formatDate(row.payment_date)}</div>
          <div className="text-gray-400 capitalize">{row.payment_method?.replace('_', ' ')}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${row.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {row.status === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
          {row.status?.toUpperCase()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary & Wage Payroll</h1>
          <p className="text-gray-500 text-sm mt-1">Monthly salary disbursements, overtime calculations, bKash / bank transfer tracking</p>
        </div>
        <button onClick={() => openDisburseModal()} className="btn-primary">
          <Plus size={18} /> Disburse Salary
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <span className="text-xs text-gray-500 font-semibold">Select Month:</span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="form-input text-xs w-44"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={salaries}
        loading={loading}
      />

      {/* Disburse Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Disburse Monthly Wage / Salary"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Employee / Worker *</label>
              <select
                required
                value={formData.employee_id}
                onChange={(e) => handleEmpChange(e.target.value)}
                className="form-input"
              >
                <option value="">-- Select Worker --</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.role?.replace('_', ' ')}) - {formatCurrency(e.salary)}/{e.salary_type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Payment Month</label>
              <input
                type="month"
                required
                value={formData.payment_month}
                onChange={(e) => setFormData({ ...formData, payment_month: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Disbursement Date</label>
              <input
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Basic Wage / Salary (৳) *</label>
              <input
                type="number"
                required
                value={formData.basic_salary}
                onChange={(e) => handleCalc('basic_salary', e.target.value)}
                className="form-input font-semibold"
              />
            </div>

            <div>
              <label className="form-label">Overtime Pay (৳)</label>
              <input
                type="number"
                value={formData.overtime_pay}
                onChange={(e) => handleCalc('overtime_pay', e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Bonus / Allowance (৳)</label>
              <input
                type="number"
                value={formData.bonus}
                onChange={(e) => handleCalc('bonus', e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Advance Deduction (৳)</label>
              <input
                type="number"
                value={formData.deduction}
                onChange={(e) => handleCalc('deduction', e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Payment Channel</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="form-input"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Transaction ID / Ref</label>
              <input
                type="text"
                value={formData.transaction_ref}
                onChange={(e) => setFormData({ ...formData, transaction_ref: e.target.value })}
                placeholder="bKash TrxID or Cheque #"
                className="form-input"
              />
            </div>

            <div className="sm:col-span-2 p-3 bg-emerald-50 rounded-xl flex justify-between items-center">
              <span className="text-sm font-bold text-emerald-900">Net Payable Amount:</span>
              <span className="text-xl font-extrabold text-emerald-700">{formatCurrency(formData.net_salary)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-success">
              Disburse Now
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
