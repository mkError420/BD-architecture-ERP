import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { labourWagesAPI, employeesAPI } from '../../api';
import { Users, Plus, Edit, Trash2, ArrowLeft, Calendar, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/helpers';

const DEMO_WAGES = [
  {
    id: 1,
    slip_code: 'WS-202502-0012',
    project_id: 1,
    employee_id: 1,
    employee_name: 'Rafiqul Islam',
    employee_role: 'Head Mason',
    wage_type: 'daily',
    work_period_start: '2025-02-01',
    work_period_end: '2025-02-15',
    total_days: 14,
    present_days: 13,
    daily_wage: 950,
    overtime_hours: 12,
    overtime_rate: 180,
    bonus: 500,
    deduction: 0,
    net_wage: 15010,
    payment_date: '2025-02-16',
    payment_method: 'cash',
    status: 'paid',
    notes: 'Ground floor slab casting work',
  },
  {
    id: 2,
    slip_code: 'WS-202502-0013',
    project_id: 1,
    employee_id: 2,
    employee_name: 'Abdul Barek',
    employee_role: 'Shuttering Carpenter',
    wage_type: 'daily',
    work_period_start: '2025-02-01',
    work_period_end: '2025-02-15',
    total_days: 14,
    present_days: 14,
    daily_wage: 900,
    overtime_hours: 8,
    overtime_rate: 170,
    bonus: 0,
    deduction: 200,
    net_wage: 13760,
    payment_date: '2025-02-16',
    payment_method: 'cash',
    status: 'paid',
    notes: 'Beam shuttering complete',
  },
  {
    id: 3,
    slip_code: 'WS-202502-0014',
    project_id: 1,
    employee_id: 3,
    employee_name: 'Md. Sumon Ali',
    employee_role: 'Rod Binder',
    wage_type: 'daily',
    work_period_start: '2025-02-01',
    work_period_end: '2025-02-15',
    total_days: 14,
    present_days: 12,
    daily_wage: 850,
    overtime_hours: 6,
    overtime_rate: 160,
    bonus: 0,
    deduction: 0,
    net_wage: 11160,
    payment_date: '2025-02-16',
    payment_method: 'mobile_banking',
    status: 'paid',
    notes: 'Pillar steel tying',
  },
  {
    id: 4,
    slip_code: 'WS-202502-0021',
    project_id: 1,
    employee_id: 4,
    employee_name: 'Kamal Hossain',
    employee_role: 'General Helper',
    wage_type: 'daily',
    work_period_start: '2025-02-16',
    work_period_end: '2025-02-28',
    total_days: 13,
    present_days: 12,
    daily_wage: 650,
    overtime_hours: 4,
    overtime_rate: 120,
    bonus: 0,
    deduction: 0,
    net_wage: 8280,
    payment_date: '2025-03-01',
    payment_method: 'cash',
    status: 'pending',
    notes: 'Material unloading and mixing assistance',
  },
  {
    id: 5,
    slip_code: 'WS-202502-0022',
    project_id: 1,
    employee_id: 5,
    employee_name: 'Zahid Hasan',
    employee_role: 'Site Electrician',
    wage_type: 'daily',
    work_period_start: '2025-02-16',
    work_period_end: '2025-02-28',
    total_days: 13,
    present_days: 11,
    daily_wage: 1000,
    overtime_hours: 5,
    overtime_rate: 190,
    bonus: 300,
    deduction: 0,
    net_wage: 12250,
    payment_date: '2025-03-01',
    payment_method: 'cash',
    status: 'pending',
    notes: 'Temporary power line setup & conduit routing',
  },
];

export default function LabourWages() {
  const { projectId } = useParams();
  const [wageSlips, setWageSlips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  const initialForm = {
    project_id: projectId,
    employee_id: '',
    employee_name: '',
    wage_type: 'daily',
    work_period_start: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString().split('T')[0],
    work_period_end: new Date().toISOString().split('T')[0],
    present_days: 12,
    daily_wage: 800,
    overtime_hours: 0,
    overtime_rate: 150,
    bonus: 0,
    deduction: 0,
    net_wage: 9600,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    status: 'paid',
    notes: '',
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    loadWageSlips();
    loadEmployees();
  }, [projectId]);

  const loadEmployees = async () => {
    try {
      const res = await employeesAPI.getAll({ per_page: 100 });
      const empList = res.data?.data?.items || res.data?.data || [];
      if (Array.isArray(empList) && empList.length > 0) {
        setEmployees(empList);
      }
    } catch {
      // Keep empty if failed, fallback to manual inputs
    }
  };

  const loadWageSlips = async () => {
    setLoading(true);
    try {
      const res = await labourWagesAPI.getAll({ project_id: projectId });
      const records = res.data?.data?.data || res.data?.data || [];
      if (Array.isArray(records) && records.length > 0) {
        setWageSlips(records);
        setIsDemo(false);
      } else {
        setWageSlips(DEMO_WAGES);
        setIsDemo(true);
      }
    } catch (err) {
      console.warn('Backend wages API failed, using demo data:', err);
      setWageSlips(DEMO_WAGES);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  // Auto calculate net wage when values change
  const handleCalc = (updatedFields) => {
    const next = { ...formData, ...updatedFields };
    const days = parseFloat(next.present_days) || 0;
    const rate = parseFloat(next.daily_wage) || 0;
    const otHours = parseFloat(next.overtime_hours) || 0;
    const otRate = parseFloat(next.overtime_rate) || 0;
    const bonus = parseFloat(next.bonus) || 0;
    const deduction = parseFloat(next.deduction) || 0;

    const net = (days * rate) + (otHours * otRate) + bonus - deduction;
    setFormData({
      ...next,
      net_wage: Math.max(0, net),
    });
  };

  const handleAddNew = () => {
    setSelectedSlip(null);
    setFormData({
      ...initialForm,
      project_id: projectId,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (slip) => {
    setSelectedSlip(slip);
    setFormData({
      project_id: projectId,
      employee_id: slip.employee_id || '',
      employee_name: slip.employee_name || '',
      wage_type: slip.wage_type || 'daily',
      work_period_start: slip.work_period_start || new Date().toISOString().split('T')[0],
      work_period_end: slip.work_period_end || new Date().toISOString().split('T')[0],
      present_days: slip.present_days || slip.work_days || 1,
      daily_wage: slip.daily_wage || slip.daily_rate || 0,
      overtime_hours: slip.overtime_hours || 0,
      overtime_rate: slip.overtime_rate || 0,
      bonus: slip.bonus || 0,
      deduction: slip.deduction || 0,
      net_wage: slip.net_wage || slip.total_amount || 0,
      payment_date: slip.payment_date || new Date().toISOString().split('T')[0],
      payment_method: slip.payment_method || 'cash',
      status: slip.status || 'paid',
      notes: slip.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (slip) => {
    setSelectedSlip(slip);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      project_id: projectId,
      daily_wage: parseFloat(formData.daily_wage) || 0,
      present_days: parseFloat(formData.present_days) || 1,
      overtime_hours: parseFloat(formData.overtime_hours) || 0,
      overtime_rate: parseFloat(formData.overtime_rate) || 0,
      bonus: parseFloat(formData.bonus) || 0,
      deduction: parseFloat(formData.deduction) || 0,
      net_wage: parseFloat(formData.net_wage) || 0,
      total_amount: parseFloat(formData.net_wage) || 0,
    };

    try {
      if (selectedSlip) {
        if (isDemo) {
          setWageSlips(prev => prev.map(s => s.id === selectedSlip.id ? { ...s, ...payload } : s));
          toast.success('Wage slip updated!');
        } else {
          await labourWagesAPI.update(selectedSlip.id, payload);
          toast.success('Wage slip updated successfully!');
          loadWageSlips();
        }
      } else {
        if (isDemo) {
          const newSlip = {
            id: Date.now(),
            slip_code: `WS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
            ...payload,
          };
          setWageSlips(prev => [newSlip, ...prev]);
          toast.success('Wage slip created successfully!');
        } else {
          await labourWagesAPI.create(payload);
          toast.success('Wage slip created successfully!');
          loadWageSlips();
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
        setWageSlips(prev => prev.filter(s => s.id !== selectedSlip.id));
        toast.success('Wage slip deleted');
      } else {
        await labourWagesAPI.delete(selectedSlip.id);
        toast.success('Wage slip deleted');
        loadWageSlips();
      }
      setIsDeleteOpen(false);
    } catch {
      toast.error('Failed to delete wage slip');
    }
  };

  // KPIs
  const stats = useMemo(() => {
    const totalPaid = wageSlips
      .filter(w => w.status === 'paid')
      .reduce((sum, w) => sum + (parseFloat(w.net_wage || w.total_amount) || 0), 0);
    const totalPending = wageSlips
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + (parseFloat(w.net_wage || w.total_amount) || 0), 0);
    const totalDays = wageSlips.reduce((sum, w) => sum + (parseFloat(w.present_days || w.work_days) || 0), 0);
    return { totalPaid, totalPending, count: wageSlips.length, totalDays };
  }, [wageSlips]);

  const columns = [
    {
      header: 'Slip Code',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
            {row.slip_code}
          </span>
          <div className="text-[11px] text-gray-400 mt-0.5">
            {row.work_period_start && row.work_period_end ? `${formatDate(row.work_period_start)} - ${formatDate(row.work_period_end)}` : ''}
          </div>
        </div>
      ),
    },
    {
      header: 'Worker / Employee',
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.employee_name || `Worker #${row.employee_id}`}</div>
          {row.employee_role && <span className="text-xs text-gray-500">{row.employee_role}</span>}
        </div>
      ),
    },
    {
      header: 'Attendance / Rate',
      render: (row) => (
        <div className="text-xs">
          <div className="font-medium text-gray-800">{row.present_days || row.work_days || 0} days × {formatCurrency(row.daily_wage || row.daily_rate || 0)}</div>
          {(row.overtime_hours > 0) && (
            <div className="text-amber-600">+{row.overtime_hours}h OT ({formatCurrency(row.overtime_rate || 0)}/h)</div>
          )}
        </div>
      ),
    },
    {
      header: 'Net Wage',
      render: (row) => (
        <div>
          <span className="font-bold text-gray-900 text-sm">
            {formatCurrency(row.net_wage || row.total_amount || 0)}
          </span>
          <div className="text-[11px] text-gray-400 capitalize">{row.payment_method || 'cash'}</div>
        </div>
      ),
    },
    {
      header: 'Payment Date',
      render: (row) => <span className="text-sm text-gray-600">{formatDate(row.payment_date)}</span>,
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
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #A0975A 0%, #7d7543 100%)' }}>
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Labour Wage Slips</h1>
              <p className="text-gray-500 text-sm">Track daily labourers, attendance, overtime, and wage disbursements</p>
            </div>
          </div>
          <button onClick={handleAddNew} className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto">
            <Plus size={18} /> New Wage Slip
          </button>
        </div>
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
          <AlertCircle size={16} className="shrink-0 text-amber-600" />
          <span>Showing demo wage slips. Connect database records or click <strong>New Wage Slip</strong> to add active records.</span>
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
          <span className="text-xs text-green-600 font-medium">Disbursed to workers</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Pending Wages</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock size={18} /></div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{formatCurrency(stats.totalPending)}</div>
          <span className="text-xs text-gray-500 font-medium">Awaiting disbursement</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Slips</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={18} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.count}</div>
          <span className="text-xs text-gray-500">Wage records</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Man-Days</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar size={18} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.totalDays}</div>
          <span className="text-xs text-gray-500">Days worked on site</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <DataTable columns={columns} data={wageSlips} loading={loading} />
      </div>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedSlip ? 'Edit Wage Slip' : 'Create Wage Slip'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee select or name */}
            <div>
              <label className="form-label">Worker / Employee *</label>
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
                  <option value="">Select Worker</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role || emp.designation || 'Labour'})</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="e.g. Rafiqul Islam"
                  value={formData.employee_name}
                  onChange={(e) => setFormData({ ...formData, employee_name: e.target.value, employee_id: formData.employee_id || 1 })}
                  className="form-input"
                />
              )}
            </div>

            <div>
              <label className="form-label">Wage Type</label>
              <select
                value={formData.wage_type}
                onChange={(e) => setFormData({ ...formData, wage_type: e.target.value })}
                className="form-input"
              >
                <option value="daily">Daily Wage</option>
                <option value="weekly">Weekly Wage</option>
                <option value="monthly">Monthly Wage</option>
              </select>
            </div>

            <div>
              <label className="form-label">Work Period Start</label>
              <input
                type="date"
                value={formData.work_period_start}
                onChange={(e) => setFormData({ ...formData, work_period_start: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Work Period End</label>
              <input
                type="date"
                value={formData.work_period_end}
                onChange={(e) => setFormData({ ...formData, work_period_end: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Work / Present Days *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={formData.present_days}
                onChange={(e) => handleCalc({ present_days: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Daily Wage (৳) *</label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={formData.daily_wage}
                onChange={(e) => handleCalc({ daily_wage: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Overtime Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.overtime_hours}
                onChange={(e) => handleCalc({ overtime_hours: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Overtime Rate (৳/hr)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.overtime_rate}
                onChange={(e) => handleCalc({ overtime_rate: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Bonus (৳)</label>
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
              <label className="form-label">Deduction (৳)</label>
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
              <label className="form-label">Calculated Net Wage (৳) *</label>
              <input
                type="number"
                step="1"
                required
                value={formData.net_wage}
                onChange={(e) => setFormData({ ...formData, net_wage: parseFloat(e.target.value) || 0 })}
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
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_banking">Mobile Banking (bKash / Nagad)</option>
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
              <label className="form-label">Notes / Work Details</label>
              <textarea
                rows="2"
                placeholder="Description of work performed, site location..."
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
              {selectedSlip ? 'Update Wage Slip' : 'Save Wage Slip'}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Wage Slip"
        message="Are you sure you want to delete this wage slip? This action cannot be undone."
      />
    </div>
  );
}
