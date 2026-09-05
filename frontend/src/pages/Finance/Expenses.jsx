import { useState, useEffect } from 'react';
import { expensesAPI, projectsAPI } from '../../api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../utils/helpers';
import { Plus, Search, Wallet, DollarSign, CheckCircle2, Clock, FileText, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_EXPENSES = [
  {
    id: 1,
    expense_code: 'EXP-2026-001',
    title: 'Ready Mix Concrete 3500 PSI (12 Truckloads)',
    project_id: 1,
    project_name: 'Rupayan Lake Castle (Gulshan-2)',
    category: 'material',
    amount: 1420000,
    expense_date: '2026-02-18',
    paid_to: 'Bashundhara Ready Mix Ltd',
    payment_method: 'bank_transfer',
    transaction_ref: 'EBL-TR-998821',
    is_approved: 1,
    notes: 'For basement floor casting, delivery chalan #90412'
  },
  {
    id: 2,
    expense_code: 'EXP-2026-002',
    title: 'Weekly Site Labour Wages (Mason & Helpers)',
    project_id: 1,
    project_name: 'Rupayan Lake Castle (Gulshan-2)',
    category: 'labor',
    amount: 385000,
    expense_date: '2026-02-22',
    paid_to: 'Tariqul Islam (Foreman)',
    payment_method: 'cash',
    transaction_ref: 'CSH-SITE-044',
    is_approved: 1,
    notes: '42 workers daily wages for 7 days'
  },
  {
    id: 3,
    expense_code: 'EXP-2026-003',
    title: 'Mobile Hydraulic Crane Rental & Operator Fuel',
    project_id: 2,
    project_name: 'Navana Pristine Heights (Dhanmondi)',
    category: 'equipment',
    amount: 180000,
    expense_date: '2026-02-28',
    paid_to: 'Bengal Heavy Rigging Services',
    payment_method: 'cheque',
    transaction_ref: 'CHQ-DBBL-44120',
    is_approved: 1,
    notes: 'Tower crane assembly support on site'
  },
  {
    id: 4,
    expense_code: 'EXP-2026-004',
    title: 'RAJUK Site Inspection & Vetting Fees',
    project_id: 3,
    project_name: 'Shanta Pinnacle (Tejgaon Commercial)',
    category: 'legal',
    amount: 95000,
    expense_date: '2026-03-02',
    paid_to: 'RAJUK Authorized Officer',
    payment_method: 'bank_transfer',
    transaction_ref: 'SONALI-CHL-0031',
    is_approved: 1,
    notes: 'Building permit setback compliance certificate'
  },
  {
    id: 5,
    expense_code: 'EXP-2026-005',
    title: 'Site Office High-Speed Internet & Electricity Bill',
    project_id: 1,
    project_name: 'Rupayan Lake Castle (Gulshan-2)',
    category: 'utility',
    amount: 28500,
    expense_date: '2026-03-05',
    paid_to: 'DESCO / Link3 Technologies',
    payment_method: 'mobile_banking',
    transaction_ref: 'BKASH-TX-778811',
    is_approved: 1,
    notes: 'February office utility settlement'
  }
];

export default function Expenses() {
  const [expenses, setExpenses] = useState(DEMO_EXPENSES);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: DEMO_EXPENSES.length, total_pages: 1 });
  const [totalAmount, setTotalAmount] = useState(DEMO_EXPENSES.reduce((sum, e) => sum + Number(e.amount), 0));

  const [projectFilter, setProjectFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    project_id: '',
    category: 'material',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    paid_to: '',
    payment_method: 'cash',
    transaction_ref: '',
    vat_amount: 0,
    tax_amount: 0,
    is_approved: 1,
    notes: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [pagination.page, projectFilter, categoryFilter, fromDate, toDate]);

  const loadProjects = async () => {
    try {
      const res = await projectsAPI.getAll({ per_page: 100 });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setProjects(res.data.data);
      } else {
        setProjects([
          { id: 1, name: 'Rupayan Lake Castle (Gulshan-2)' },
          { id: 2, name: 'Navana Pristine Heights (Dhanmondi)' },
          { id: 3, name: 'Shanta Pinnacle (Tejgaon Commercial)' }
        ]);
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
      setProjects([
        { id: 1, name: 'Rupayan Lake Castle (Gulshan-2)' },
        { id: 2, name: 'Navana Pristine Heights (Dhanmondi)' },
        { id: 3, name: 'Shanta Pinnacle (Tejgaon Commercial)' }
      ]);
    }
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await expensesAPI.getAll({
        page: pagination.page,
        per_page: pagination.per_page,
        project_id: projectFilter,
        category: categoryFilter,
        from_date: fromDate,
        to_date: toDate,
      });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setExpenses(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
        if (res.data.total_amount) setTotalAmount(res.data.total_amount);
      } else {
        let filtered = DEMO_EXPENSES;
        if (projectFilter) filtered = filtered.filter(e => e.project_id == projectFilter);
        if (categoryFilter) filtered = filtered.filter(e => e.category === categoryFilter);
        setExpenses(filtered);
        setTotalAmount(filtered.reduce((sum, e) => sum + Number(e.amount), 0));
        setPagination({ page: 1, per_page: 10, total: filtered.length, total_pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
      let filtered = DEMO_EXPENSES;
      if (projectFilter) filtered = filtered.filter(e => e.project_id == projectFilter);
      if (categoryFilter) filtered = filtered.filter(e => e.category === categoryFilter);
      setExpenses(filtered);
      setTotalAmount(filtered.reduce((sum, e) => sum + Number(e.amount), 0));
      setPagination({ page: 1, per_page: 10, total: filtered.length, total_pages: 1 });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedExpense(null);
    setFormData({
      title: '',
      project_id: projects[0]?.id || 1,
      category: 'material',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      paid_to: '',
      payment_method: 'cash',
      transaction_ref: '',
      vat_amount: 0,
      tax_amount: 0,
      is_approved: 1,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (exp) => {
    setSelectedExpense(exp);
    setFormData({
      title: exp.title || '',
      project_id: exp.project_id || '',
      category: exp.category || 'material',
      amount: exp.amount || '',
      expense_date: exp.expense_date || '',
      paid_to: exp.paid_to || '',
      payment_method: exp.payment_method || 'cash',
      transaction_ref: exp.transaction_ref || '',
      vat_amount: exp.vat_amount || 0,
      tax_amount: exp.tax_amount || 0,
      is_approved: exp.is_approved ? 1 : 0,
      notes: exp.notes || '',
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (exp) => {
    setSelectedExpense(exp);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedExpense) {
        await expensesAPI.update(selectedExpense.id, formData);
        toast.success('Expense record updated!');
      } else {
        await expensesAPI.create(formData);
        toast.success('Expense recorded successfully!');
      }
      setIsModalOpen(false);
      loadExpenses();
    } catch (err) {
      console.warn('API error or demo fallback:', err);
      const proj = projects.find(p => p.id == formData.project_id);
      if (selectedExpense) {
        setExpenses(prev => prev.map(e => e.id === selectedExpense.id ? {
          ...e,
          ...formData,
          amount: Number(formData.amount),
          project_name: proj ? proj.name : e.project_name
        } : e));
        toast.success('Expense record updated (Demo)!');
      } else {
        const newExp = {
          id: Date.now(),
          expense_code: `EXP-2026-00${expenses.length + 1}`,
          ...formData,
          amount: Number(formData.amount),
          project_name: proj ? proj.name : 'General Project'
        };
        setExpenses(prev => [newExp, ...prev]);
        setTotalAmount(prev => prev + Number(formData.amount));
        toast.success('Expense recorded (Demo)!');
      }
      setIsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    try {
      await expensesAPI.delete(selectedExpense.id);
      toast.success('Expense deleted');
      setIsDeleteOpen(false);
      loadExpenses();
    } catch (err) {
      console.warn('API delete or demo fallback:', err);
      setExpenses(prev => prev.filter(e => e.id !== selectedExpense.id));
      setTotalAmount(prev => prev - Number(selectedExpense.amount || 0));
      toast.success('Expense record removed (Demo)');
      setIsDeleteOpen(false);
    }
  };

  const getCategoryLabel = (cat) => {
    const c = EXPENSE_CATEGORIES.find(item => item.value === cat);
    return c ? c.label : cat;
  };

  const columns = [
    {
      header: 'Voucher & Description',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded font-semibold">{row.expense_code}</span>
            <span className="font-bold text-gray-900">{row.title}</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Project: <span className="font-medium text-gray-700">{row.project_name || 'General Overheads'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      render: (row) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {getCategoryLabel(row.category)}
        </span>
      ),
    },
    {
      header: 'Amount (BDT)',
      render: (row) => (
        <span className="font-bold text-base text-gray-900">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      header: 'Paid To & Method',
      render: (row) => (
        <div className="text-xs">
          <div className="font-medium text-gray-800">{row.paid_to || 'Cash Voucher'}</div>
          <div className="text-gray-400 capitalize">{row.payment_method?.replace('_', ' ')}</div>
        </div>
      ),
    },
    {
      header: 'Expense Date',
      render: (row) => (
        <span className="text-xs text-gray-600 font-medium">{formatDate(row.expense_date)}</span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${row.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {row.is_approved ? <CheckCircle2 size={12} /> : <Clock size={12} />}
          {row.is_approved ? 'Approved' : 'Pending'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Expenses & Cost Tracking</h1>
          <p className="text-gray-500 text-sm mt-1">Track material purchases, labor wage disbursements, equipment rentals, and utility costs</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={18} /> Record Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
            <Wallet size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Total Expenses</span>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <DollarSign size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Materials & Supplies</span>
            <p className="text-xl font-bold text-blue-700">
              {formatCurrency(expenses.filter(e => e.category === 'material').reduce((s, e) => s + Number(e.amount || 0), 0))}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Labor Wages</span>
            <p className="text-xl font-bold text-emerald-700">
              {formatCurrency(expenses.filter(e => e.category === 'labor').reduce((s, e) => s + Number(e.amount || 0), 0))}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Equipment & Ops</span>
            <p className="text-xl font-bold text-amber-700">
              {formatCurrency(expenses.filter(e => ['equipment', 'utility', 'transport', 'legal'].includes(e.category)).reduce((s, e) => s + Number(e.amount || 0), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-3">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="form-input text-xs w-full sm:w-48"
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="form-input text-xs w-full sm:w-44"
        >
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="form-input text-xs w-36"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="form-input text-xs w-36"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(p => ({ ...p, page }))}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedExpense ? 'Edit Expense Voucher' : 'Record New Expense Voucher'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Expense Title / Description *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. 500 Bags Shah Cement Supply"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Project *</label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="form-input"
              >
                <option value="">-- General / Head Office --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Cost Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-input"
              >
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Amount (BDT / ৳) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 250000"
                className="form-input font-bold"
              />
            </div>

            <div>
              <label className="form-label">Expense Date *</label>
              <input
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Paid To / Recipient</label>
              <input
                type="text"
                value={formData.paid_to}
                onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
                placeholder="Vendor or Contractor name"
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
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Transaction Reference / Cheque No.</label>
              <input
                type="text"
                value={formData.transaction_ref}
                onChange={(e) => setFormData({ ...formData, transaction_ref: e.target.value })}
                placeholder="Bank Txn ID, Cheque #, or bKash TrxID"
                className="form-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Internal Voucher Notes</label>
              <textarea
                rows="2"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Invoice number, delivery challan reference..."
                className="form-input"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {selectedExpense ? 'Update Expense' : 'Save Expense Voucher'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Expense Record"
        message={`Are you sure you want to delete expense voucher "${selectedExpense?.expense_code}"?`}
      />
    </div>
  );
}
