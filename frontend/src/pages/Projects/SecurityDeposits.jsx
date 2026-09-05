import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { securityDepositsAPI, clientsAPI, projectsAPI } from '../../api';
import { ShieldCheck, Plus, Edit2, Trash2, ArrowLeft, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/helpers';

const DEMO_DEPOSITS = [
  { id: 1, deposit_code: 'SD-0001', client_name: 'Rahman Real Estate', deposit_type: 'security_money', amount: 5000000, deposit_date: '2025-01-15', status: 'active', bank_name: 'Islami Bank', cheque_number: 'IB-12345', notes: 'Security deposit for Gulshan project' },
  { id: 2, deposit_code: 'SD-0002', client_name: 'Rahman Real Estate', deposit_type: 'earnest_money', amount: 2000000, deposit_date: '2024-12-01', status: 'active', bank_name: 'Dutch Bangla Bank', cheque_number: 'DBB-98765', notes: 'Earnest money at contract signing' },
  { id: 3, deposit_code: 'SD-0003', client_name: 'Karim Enterprises', deposit_type: 'retention_money', amount: 3500000, deposit_date: '2025-03-20', status: 'partial_refund', refund_amount: 1000000, bank_name: 'City Bank', notes: 'Retention from first payment' },
];

const TYPE_LABELS = { security_money: 'Security Money', earnest_money: 'Earnest Money', performance_guarantee: 'Performance Guarantee', retention_money: 'Retention Money', other: 'Other' };
const STATUS_COLORS = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  refunded: 'bg-gray-50 text-gray-700 border-gray-200',
  forfeited: 'bg-red-50 text-red-700 border-red-200',
  partial_refund: 'bg-amber-50 text-amber-700 border-amber-200',
};
const STATUS_ICONS = { active: CheckCircle2, refunded: CheckCircle2, forfeited: XCircle, partial_refund: Clock };

export default function SecurityDeposits() {
  const { projectId } = useParams();
  const [deposits, setDeposits] = useState([]);
  const [project, setProject] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const initForm = () => ({
    project_id: projectId,
    client_id: '',
    deposit_type: 'security_money',
    amount: '',
    deposit_date: new Date().toISOString().split('T')[0],
    refund_date: '',
    status: 'active',
    refund_amount: '',
    bank_name: '',
    account_number: '',
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
      const [depRes, projRes, clientRes] = await Promise.allSettled([
        securityDepositsAPI.getAll({ project_id: projectId }),
        projectsAPI.getOne(projectId),
        clientsAPI.getAll({ per_page: 100 }),
      ]);
      if (depRes.status === 'fulfilled' && depRes.value?.data) {
        const d = depRes.value.data;
        const list = Array.isArray(d.data) ? d.data : (Array.isArray(d) ? d : null);
        if (list !== null) {
          setDeposits(list);
          setIsDemo(false);
        } else {
          setDeposits(DEMO_DEPOSITS);
          setIsDemo(true);
        }
      } else {
        setDeposits(DEMO_DEPOSITS);
        setIsDemo(true);
      }
      if (projRes.status === 'fulfilled' && projRes.value?.data) {
        setProject(projRes.value.data.data || projRes.value.data);
      }
      if (clientRes.status === 'fulfilled' && clientRes.value?.data) {
        const cData = clientRes.value.data;
        setClients(Array.isArray(cData.data) ? cData.data : (Array.isArray(cData) ? cData : []));
      }
    } catch {
      setDeposits(DEMO_DEPOSITS);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        project_id: projectId,
        client_id: formData.client_id ? Number(formData.client_id) : null,
        amount: parseFloat(formData.amount) || 0,
        refund_amount: formData.refund_amount ? parseFloat(formData.refund_amount) : 0,
      };
      if (selectedDeposit) {
        await securityDepositsAPI.update(selectedDeposit.id, payload);
        toast.success('Deposit updated!');
      } else {
        await securityDepositsAPI.create(payload);
        toast.success('Security deposit recorded!');
      }
      setIsModalOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save deposit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await securityDepositsAPI.delete(selectedDeposit.id);
      toast.success('Deposit record deleted');
      setIsDeleteOpen(false);
      loadAll();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (d) => {
    setSelectedDeposit(d);
    setFormData({
      project_id: projectId,
      client_id: d.client_id || '',
      deposit_type: d.deposit_type || 'security_money',
      amount: d.amount || '',
      deposit_date: d.deposit_date || new Date().toISOString().split('T')[0],
      refund_date: d.refund_date || '',
      status: d.status || 'active',
      refund_amount: d.refund_amount || '',
      bank_name: d.bank_name || '',
      account_number: d.account_number || '',
      cheque_number: d.cheque_number || '',
      transaction_ref: d.transaction_ref || '',
      notes: d.notes || '',
    });
    setIsModalOpen(true);
  };

  const totalDeposited = deposits.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const totalRefunded = deposits.reduce((s, d) => s + parseFloat(d.refund_amount || 0), 0);
  const netHeld = totalDeposited - totalRefunded;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}`} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 bg-white">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Security Deposits</h1>
            <p className="text-sm text-gray-500">{project?.name || `Project #${projectId}`}</p>
          </div>
        </div>
        <button onClick={() => { setSelectedDeposit(null); setFormData(initForm()); setIsModalOpen(true); }} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Add Deposit
        </button>
      </div>

      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> Showing demo data. Connect backend to manage real deposits.
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-medium text-gray-500">Total Deposited</span>
          <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(totalDeposited)}</p>
          <span className="text-xs text-gray-400">{deposits.length} deposit{deposits.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-medium text-gray-500">Total Refunded</span>
          <p className="text-2xl font-bold text-gray-600 mt-1">{formatCurrency(totalRefunded)}</p>
          <span className="text-xs text-gray-400">Released to client</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-medium text-gray-500">Currently Held</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(netHeld)}</p>
          <span className="text-xs text-gray-400">Net security held</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Deposit Records</h2>
          <span className="text-sm text-gray-500">{deposits.length} records</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : deposits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
            <ShieldCheck size={36} className="opacity-30" />
            <p className="text-sm">No deposits recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Refunded</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deposits.map((d) => {
                  const StatusIcon = STATUS_ICONS[d.status] || Clock;
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5"><span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{d.deposit_code}</span></td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">{d.client_name || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-600 text-xs">{TYPE_LABELS[d.deposit_type] || d.deposit_type}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-purple-700">{formatCurrency(d.amount)}</td>
                      <td className="px-5 py-3.5 text-right text-gray-500">{d.refund_amount > 0 ? formatCurrency(d.refund_amount) : '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500">{formatDate(d.deposit_date)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[d.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                          <StatusIcon size={11} />
                          {d.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Edit2 size={14} /></button>
                          <button onClick={() => { setSelectedDeposit(d); setIsDeleteOpen(true); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedDeposit ? 'Edit Deposit' : 'Record Security Deposit'} size="lg">
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
              <label className="form-label">Deposit Type *</label>
              <select value={formData.deposit_type} onChange={(e) => setFormData({ ...formData, deposit_type: e.target.value })} className="form-input">
                <option value="earnest_money">Earnest Money</option>
                <option value="security_money">Security Money</option>
                <option value="performance_guarantee">Performance Guarantee</option>
                <option value="retention_money">Retention Money</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="form-input">
                <option value="active">Active</option>
                <option value="refunded">Refunded</option>
                <option value="partial_refund">Partial Refund</option>
                <option value="forfeited">Forfeited</option>
              </select>
            </div>
            <div>
              <label className="form-label">Amount (৳) *</label>
              <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Deposit Date *</label>
              <input type="date" required value={formData.deposit_date} onChange={(e) => setFormData({ ...formData, deposit_date: e.target.value })} className="form-input" />
            </div>
            {(formData.status === 'refunded' || formData.status === 'partial_refund') && (
              <>
                <div>
                  <label className="form-label">Refund Amount (৳)</label>
                  <input type="number" step="0.01" value={formData.refund_amount} onChange={(e) => setFormData({ ...formData, refund_amount: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Refund Date</label>
                  <input type="date" value={formData.refund_date} onChange={(e) => setFormData({ ...formData, refund_date: e.target.value })} className="form-input" />
                </div>
              </>
            )}
            <div>
              <label className="form-label">Bank Name</label>
              <input type="text" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Cheque / Reference Number</label>
              <input type="text" value={formData.cheque_number} onChange={(e) => setFormData({ ...formData, cheque_number: e.target.value })} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
              {submitting ? 'Saving...' : selectedDeposit ? 'Update' : 'Record Deposit'}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Deposit" message="Are you sure you want to delete this deposit record?" />
    </div>
  );
}
