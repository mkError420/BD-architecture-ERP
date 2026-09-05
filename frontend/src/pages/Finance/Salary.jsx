import { useState, useEffect } from 'react';
import { salaryAPI, employeesAPI } from '../../api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { formatCurrency, formatDate, PAYMENT_METHODS } from '../../utils/helpers';
import { Plus, Search, Wallet, CheckCircle2, Clock, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_SALARIES = [
  {
    id: 1,
    employee_id: 1,
    employee_code: 'EMP-001',
    employee_name: 'Engr. Mahbubur Rahman',
    employee_role: 'project_manager',
    payment_month: new Date().toISOString().slice(0, 7),
    basic_salary: 75000,
    overtime_pay: 0,
    bonus: 10000,
    deduction: 0,
    net_salary: 85000,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    transaction_ref: 'EBL-SAL-1029',
    status: 'paid',
    notes: 'February salary + Project milestone performance bonus'
  },
  {
    id: 2,
    employee_id: 2,
    employee_code: 'EMP-002',
    employee_name: 'Tanvir Ahmed',
    employee_role: 'site_engineer',
    payment_month: new Date().toISOString().slice(0, 7),
    basic_salary: 45000,
    overtime_pay: 4500,
    bonus: 0,
    deduction: 1500,
    net_salary: 48000,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    transaction_ref: 'EBL-SAL-1030',
    status: 'paid',
    notes: 'Overtime 20 hrs approved for slab casting night'
  },
  {
    id: 3,
    employee_id: 3,
    employee_code: 'EMP-003',
    employee_name: 'Tariqul Islam',
    employee_role: 'foreman',
    payment_month: new Date().toISOString().slice(0, 7),
    basic_salary: 32000,
    overtime_pay: 3800,
    bonus: 0,
    deduction: 0,
    net_salary: 35800,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'mobile_banking',
    transaction_ref: 'BKASH-SAL-0091',
    status: 'paid',
    notes: 'Disbursed via bKash Payroll'
  }
];

const DEFAULT_EMPLOYEES = [
  { id: 1, employee_code: 'EMP-001', name: 'Engr. Mahbubur Rahman', role: 'project_manager', salary: 75000, salary_type: 'monthly' },
  { id: 2, employee_code: 'EMP-002', name: 'Tanvir Ahmed', role: 'site_engineer', salary: 45000, salary_type: 'monthly' },
  { id: 3, employee_code: 'EMP-003', name: 'Tariqul Islam', role: 'foreman', salary: 32000, salary_type: 'monthly' },
  { id: 4, employee_code: 'EMP-004', name: 'Selim Hossain', role: 'mason', salary: 23400, salary_type: 'daily' },
];

export default function Salary() {
  const [salaries, setSalaries] = useState(DEMO_SALARIES);
  const [employees, setEmployees] = useState(DEFAULT_EMPLOYEES);
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
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setEmployees(res.data.data);
      } else {
        setEmployees(DEFAULT_EMPLOYEES);
      }
    } catch (e) {
      console.error('Failed to load employees:', e);
      setEmployees(DEFAULT_EMPLOYEES);
    }
  };

  const loadSalaries = async () => {
    setLoading(true);
    try {
      const res = await salaryAPI.getAll({ month });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setSalaries(res.data.data);
      } else {
        setSalaries(DEMO_SALARIES);
      }
    } catch (err) {
      console.error('Failed to load salaries:', err);
      setSalaries(DEMO_SALARIES);
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
    } catch (err) {
      console.warn('API error or demo fallback:', err);
      const emp = employees.find(e => e.id == formData.employee_id);
      const newSal = {
        id: Date.now(),
        ...formData,
        employee_name: emp ? emp.name : 'Site Employee',
        employee_code: emp ? emp.employee_code : 'EMP-NEW',
        employee_role: emp ? emp.role : 'Staff',
      };
      setSalaries(prev => [newSal, ...prev]);
      toast.success('Salary disbursement recorded (Demo)!');
      setIsModalOpen(false);
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

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
            <Wallet size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Payroll Disbursed</span>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(salaries.reduce((s, row) => s + Number(row.net_salary || 0), 0))}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Workers Paid</span>
            <p className="text-xl font-bold text-emerald-700">{salaries.length} Staff</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Overtime & Bonuses</span>
            <p className="text-xl font-bold text-blue-700">
              {formatCurrency(salaries.reduce((s, row) => s + Number(row.overtime_pay || 0) + Number(row.bonus || 0), 0))}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            ৳
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Average Pay</span>
            <p className="text-xl font-bold text-purple-700">
              {formatCurrency(salaries.length ? Math.round(salaries.reduce((s, r) => s + Number(r.net_salary || 0), 0) / salaries.length) : 0)}
            </p>
          </div>
        </div>
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
