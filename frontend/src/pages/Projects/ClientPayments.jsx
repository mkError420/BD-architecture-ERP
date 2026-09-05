import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { projectPaymentsAPI, clientsAPI, projectsAPI } from '../../api';
import {
  DollarSign, Plus, Edit2, Trash2, ArrowLeft, CheckCircle2,
  Clock, AlertCircle, TrendingUp, CreditCard, Building2
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/helpers';

const DEMO_PAYMENTS = [
  { id: 1, payment_code: 'CP-0001', client_name: 'Rahman Real Estate', amount: 15000000, payment_date: '2025-07-15', payment_method: 'bank_transfer', payment_for: 'advance', milestone: 'Foundation Completion', notes: 'First instalment received', created_at: '2025-07-15' },
  { id: 2, payment_code: 'CP-0002', client_name: 'Rahman Real Estate', amount: 18000000, payment_date: '2025-08-01', payment_method: 'cheque', payment_for: 'milestone', milestone: '5th Floor Slab Completion', notes: 'Cheque No: SB-2345678', created_at: '2025-08-01' },
  { id: 3, payment_code: 'CP-0003', client_name: 'Rahman Real Estate', amount: 12000000, payment_date: '2025-08-20', payment_method: 'bank_transfer', payment_for: 'milestone', milestone: '8th Floor RCC Done', notes: 'NEFT Transfer confirmed', created_at: '2025-08-20' },
];

const METHOD_LABELS = { cash: 'Cash', bank_transfer: 'Bank Transfer', cheque: 'Cheque', mobile_banking: 'Mobile Banking' };
const FOR_LABELS = { advance: 'Advance', milestone: 'Milestone', final: 'Final', retention: 'Retention', other: 'Other' };

export default function ClientPayments() {
  const { projectId } = useParams();
  const [payments, setPayments] = useState([]);
  const [project, setProject] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const initForm = () => ({
    project_id: projectId,
    client_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    payment_for: 'milestone',
    milestone: '',
    bank_name: '',
    cheque_number: '',
    transaction_ref: '',
    notes: '',
  });

  const [formData, setFormData] = useState(initForm());

  useEffect(() => {
    loadAll();
  }, [projectId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [payRes, projRes, clientRes] = await Promise.allSettled([
        projectPaymentsAPI.getAll({ project_id: projectId }),
        projectsAPI.getOne(projectId),
        clientsAPI.getAll({ per_page: 100 }),
      ]);
      if (payRes.status === 'fulfilled' && payRes.value.data.success) {
        setPayments(payRes.value.data.data || []);
        setIsDemo(false);
      } else {
        setPayments(DEMO_PAYMENTS);
        setIsDemo(true);
      }
      if (projRes.status === 'fulfilled' && projRes.value.data.success) setProject(projRes.value.data.data);
      if (clientRes.status === 'fulfilled' && clientRes.value.data.success) setClients(clientRes.value.data.data || []);
    } catch {
      setPayments(DEMO_PAYMENTS);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedPayment) {
        await projectPaymentsAPI.update(selectedPayment.id, formData);
        toast.success('Payment updated!');
      } else {
        await projectPaymentsAPI.create(formData);
        toast.success('Payment recorded!');
      }
      setIsModalOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await projectPaymentsAPI.delete(selectedPayment.id);
      toast.success('Payment deleted');
      setIsDeleteOpen(false);
      loadAll();
    } catch {
      toast.error('Failed to delete payment');
    }
  };

  const openEdit = (p) => {
    setSelectedPayment(p);
    setFormData({
      project_id: projectId,
      client_id: p.client_id || '',
      amount: p.amount || '',
      payment_date: p.payment_date || new Date().toISOString().split('T')[0],
      payment_method: p.payment_method || 'bank_transfer',
      payment_for: p.payment_for || 'milestone',
      milestone: p.milestone || '',
      bank_name: p.bank_name || '',
      cheque_number: p.cheque_number || '',
      transaction_ref: p.transaction_ref || '',
      notes: p.notes || '',
    });
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setSelectedPayment(null);
    setFormData(initForm());
    setIsModalOpen(true);
  };

  const totalCollected = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const totalBudget = parseFloat(project?.total_budget || 0);

  const getMethodBadge = (m) => {
    const colors = { cash: 'bg-emerald-50 text-emerald-700 border-emerald-200', bank_transfer: 'bg-blue-50 text-blue-700 border-blue-200', cheque: 'bg-purple-50 text-purple-700 border-purple-200', mobile_banking: 'bg-orange-50 text-orange-700 border-orange-200' };
    return colors[m] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getForBadge = (f) => {
    const colors = { advance: 'bg-blue-50 text-blue-700', milestone: 'bg-amber-50 text-amber-700', final: 'bg-emerald-50 text-emerald-700', retention: 'bg-purple-50 text-purple-700', other: 'bg-gray-50 text-gray-700' };
    return colors[f] || 'bg-gray-50 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}`} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 bg-white">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <DollarSign size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Client Payments</h1>
            <p className="text-sm text-gray-500">{project?.name || `Project #${projectId}`}</p>
          </div>
        </div>
        <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2 shadow-sm">
          <Plus size={18} /> Record Payment
        </button>
      </div>

      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> Showing demo data. Backend API may be offline or database not configured.
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-medium text-gray-500">Total Collected</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</p>
          <span className="text-xs text-gray-400">{payments.length} payment{payments.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-medium text-gray-500">Project Budget</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalBudget)}</p>
          <span className="text-xs text-gray-400">Total approved budget</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-medium text-gray-500">Collection Rate</span>
          <p className="text-2xl font-bold text-primary-600 mt-1">
            {totalBudget > 0 ? `${Math.min(100, Math.round((totalCollected / totalBudget) * 100))}%` : '—'}
          </p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div className="bg-primary-500 h-full rounded-full" style={{ width: `${totalBudget > 0 ? Math.min(100, (totalCollected / totalBudget) * 100) : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Payment History</h2>
          <span className="text-sm text-gray-500">{payments.length} records</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
            <DollarSign size={36} className="opacity-30" />
            <p className="text-sm">No payments recorded yet</p>
            <button onClick={openAdd} className="btn-primary text-sm">Record First Payment</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Milestone</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5"><span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{p.payment_code}</span></td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{p.client_name || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-[180px] truncate">{p.milestone || '—'}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-700">{formatCurrency(p.amount)}</td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(p.payment_date)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getMethodBadge(p.payment_method)}`}>
                        {METHOD_LABELS[p.payment_method] || p.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getForBadge(p.payment_for)}`}>
                        {FOR_LABELS[p.payment_for] || p.payment_for}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => { setSelectedPayment(p); setIsDeleteOpen(true); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedPayment ? 'Edit Payment' : 'Record Payment'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {clients.length > 0 && (
              <div className="sm:col-span-2">
                <label className="form-label">Client</label>
                <select value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} className="form-input">
                  <option value="">Select Client</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="form-label">Payment Type *</label>
              <select value={formData.payment_for} onChange={(e) => setFormData({ ...formData, payment_for: e.target.value })} className="form-input">
                <option value="advance">Advance</option>
                <option value="milestone">Milestone Payment</option>
                <option value="final">Final Payment</option>
                <option value="retention">Retention</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Payment Method *</label>
              <select value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} className="form-input">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="mobile_banking">Mobile Banking (bKash/Nagad)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Amount (৳) *</label>
              <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="form-input" placeholder="0.00" />
            </div>
            <div>
              <label className="form-label">Payment Date *</label>
              <input type="date" required value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Milestone / Purpose</label>
              <input type="text" value={formData.milestone} onChange={(e) => setFormData({ ...formData, milestone: e.target.value })} className="form-input" placeholder="e.g., Foundation Complete, 5th Floor Slab" />
            </div>
            {formData.payment_method === 'bank_transfer' && (
              <div>
                <label className="form-label">Transaction Reference</label>
                <input type="text" value={formData.transaction_ref} onChange={(e) => setFormData({ ...formData, transaction_ref: e.target.value })} className="form-input" placeholder="NEFT/RTGS ref no" />
              </div>
            )}
            {formData.payment_method === 'cheque' && (
              <>
                <div>
                  <label className="form-label">Bank Name</label>
                  <input type="text" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Cheque Number</label>
                  <input type="text" value={formData.cheque_number} onChange={(e) => setFormData({ ...formData, cheque_number: e.target.value })} className="form-input" />
                </div>
              </>
            )}
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
              {submitting ? 'Saving...' : selectedPayment ? 'Update Payment' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Payment" message="Are you sure you want to delete this payment record? This cannot be undone." />
    </div>
  );
}
