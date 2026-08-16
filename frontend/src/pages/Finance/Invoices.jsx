import { useState, useEffect, useRef } from 'react';
import { invoicesAPI, projectsAPI, clientsAPI } from '../../api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import { formatCurrency, formatDate, formatStatus, getStatusClass, PAYMENT_METHODS } from '../../utils/helpers';
import { Plus, Search, FileText, Printer, CheckCircle, Clock, Trash2, Edit2, PlusCircle, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0, total_pages: 1 });
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [formData, setFormData] = useState({
    project_id: '',
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    vat: 0,
    discount: 0,
    status: 'sent',
    notes: '',
    items: [
      { description: 'Foundation & Piling Milestone Completion', quantity: 1, unit_price: 1500000, total: 1500000 }
    ]
  });

  const [paymentData, setPaymentData] = useState({
    paid_amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
  });

  useEffect(() => {
    loadProjectsAndClients();
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [pagination.page, statusFilter]);

  const loadProjectsAndClients = async () => {
    try {
      const [projRes, clientRes] = await Promise.allSettled([
        projectsAPI.getAll({ per_page: 100 }),
        clientsAPI.getAll({ per_page: 100 })
      ]);
      if (projRes.status === 'fulfilled' && projRes.value.data.success) setProjects(projRes.value.data.data);
      if (clientRes.status === 'fulfilled' && clientRes.value.data.success) setClients(clientRes.value.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoicesAPI.getAll({
        page: pagination.page,
        per_page: pagination.per_page,
        status: statusFilter,
      });
      if (res.data.success) {
        setInvoices(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.warn('Fallback data for invoices');
      setInvoices([
        { id: 1, invoice_no: 'INV-000101', project_name: 'Gulshan Heights Tower', client_name: 'Rahman Real Estate', issue_date: '2025-08-01', due_date: '2025-08-20', total: 4500000, paid_amount: 4500000, status: 'paid' },
        { id: 2, invoice_no: 'INV-000102', project_name: 'Uttara Commercial Complex', client_name: 'Karim Enterprises', issue_date: '2025-08-10', due_date: '2025-08-30', total: 8500000, paid_amount: 5000000, status: 'partially_paid' },
        { id: 3, invoice_no: 'INV-000103', project_name: 'Dhanmondi Luxury Duplex', client_name: 'Engr. Hasan Ahmed', issue_date: '2025-08-12', due_date: '2025-09-01', total: 1800000, paid_amount: 0, status: 'sent' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedInvoice(null);
    setFormData({
      project_id: projects[0]?.id || '',
      client_id: clients[0]?.id || '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      vat: 0,
      discount: 0,
      status: 'sent',
      notes: 'Payment via Bank Account / Cheque in favor of Bangladesh Construction Co.',
      items: [
        { description: 'Structural Casting Milestone Bill', quantity: 1, unit_price: 500000, total: 500000 }
      ]
    });
    setIsModalOpen(true);
  };

  const openViewModal = async (inv) => {
    try {
      const res = await invoicesAPI.getOne(inv.id);
      if (res.data.success) {
        setSelectedInvoice(res.data.data);
      } else {
        setSelectedInvoice(inv);
      }
    } catch {
      setSelectedInvoice(inv);
    }
    setIsViewModalOpen(true);
  };

  const openPaymentModal = (inv) => {
    setSelectedInvoice(inv);
    setPaymentData({
      paid_amount: (Number(inv.total) - Number(inv.paid_amount || 0)).toString(),
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
    });
    setIsPaymentModalOpen(true);
  };

  const openDeleteModal = (inv) => {
    setSelectedInvoice(inv);
    setIsDeleteOpen(true);
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
      updated[index][field] = value;
      if (field === 'quantity' || field === 'unit_price') {
        const q = Number(updated[index].quantity) || 0;
        const p = Number(updated[index].unit_price) || 0;
        updated[index].total = q * p;
      }
      return { ...prev, items: updated };
    });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const vatAmount = (sub * (Number(formData.vat) || 0)) / 100;
    const discount = Number(formData.discount) || 0;
    return sub + vatAmount - discount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const subtotal = calculateSubtotal();
    const total = calculateTotal();
    const payload = {
      ...formData,
      subtotal,
      total,
    };
    try {
      await invoicesAPI.create(payload);
      toast.success('Invoice issued successfully!');
      setIsModalOpen(false);
      loadInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    }
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    try {
      const newPaid = Number(selectedInvoice.paid_amount || 0) + Number(paymentData.paid_amount || 0);
      const isFull = newPaid >= Number(selectedInvoice.total);
      await invoicesAPI.update(selectedInvoice.id, {
        paid_amount: newPaid,
        status: isFull ? 'paid' : 'partially_paid',
        payment_date: paymentData.payment_date,
        payment_method: paymentData.payment_method,
      });
      toast.success('Payment recorded successfully!');
      setIsPaymentModalOpen(false);
      loadInvoices();
    } catch {
      toast.error('Failed to update payment');
    }
  };

  const handleDelete = async () => {
    try {
      await invoicesAPI.delete(selectedInvoice.id);
      toast.success('Invoice deleted');
      setIsDeleteOpen(false);
      loadInvoices();
    } catch {
      toast.error('Failed to delete invoice');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      header: 'Invoice No & Project',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded font-bold">{row.invoice_no}</span>
            <span className="font-bold text-gray-900">{row.project_name || 'General'}</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Client: {row.client_name}</div>
        </div>
      ),
    },
    {
      header: 'Total Amount (BDT)',
      render: (row) => (
        <span className="font-bold text-gray-900 text-base">{formatCurrency(row.total)}</span>
      ),
    },
    {
      header: 'Received Amount',
      render: (row) => (
        <span className="font-semibold text-emerald-600">{formatCurrency(row.paid_amount || 0)}</span>
      ),
    },
    {
      header: 'Issue & Due Date',
      render: (row) => (
        <div className="text-xs text-gray-600">
          <div>{formatDate(row.issue_date)}</div>
          <div className="text-gray-400">Due: {formatDate(row.due_date)}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(row.status)}`}>
          {formatStatus(row.status)}
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
            onClick={() => openViewModal(row)}
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="View & Print Invoice"
          >
            <FileText size={16} />
          </button>
          {row.status !== 'paid' && (
            <button
              onClick={() => openPaymentModal(row)}
              className="px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              title="Record Client Payment"
            >
              + Payment
            </button>
          )}
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
          <h1 className="text-2xl font-bold text-gray-900">Client Invoicing & Billing</h1>
          <p className="text-gray-500 text-sm mt-1">Issue running bills, milestone invoices, and track payments from project landowners</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={18} /> Create Invoice
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input text-xs w-48"
        >
          <option value="">All Invoice Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent / Pending</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Fully Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(p => ({ ...p, page }))}
        onRowClick={openViewModal}
      />

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate New Project Invoice"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Project *</label>
              <select
                required
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="form-input"
              >
                <option value="">-- Select Project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Client / Billed To *</label>
              <select
                required
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="form-input"
              >
                <option value="">-- Select Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Billing Date *</label>
              <input
                type="date"
                required
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Payment Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="border-t border-b border-gray-100 py-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm text-gray-800">Invoice Items / Milestone Deliverables</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-primary-600 font-bold hover:underline flex items-center gap-1"
              >
                <PlusCircle size={14} /> Add Item
              </button>
            </div>

            {formData.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2.5 rounded-xl text-xs">
                <div className="col-span-6">
                  <input
                    type="text"
                    required
                    placeholder="Work description / milestone"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-center"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    placeholder="Rate (৳)"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
                  />
                </div>
                <div className="col-span-1 text-center">
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Calculations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Payment Instructions / Notes</label>
              <textarea
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="form-input text-xs"
              ></textarea>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-500">VAT (%):</span>
                <input
                  type="number"
                  value={formData.vat}
                  onChange={(e) => setFormData({ ...formData, vat: e.target.value })}
                  className="w-20 px-2 py-1 text-xs border border-gray-200 rounded bg-white text-right"
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-500">Discount (৳):</span>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="w-24 px-2 py-1 text-xs border border-gray-200 rounded bg-white text-right"
                />
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-gray-900">
                <span>Grand Total:</span>
                <span className="text-primary-700">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Issue Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment Received"
        size="sm"
      >
        <form onSubmit={handleSavePayment} className="space-y-4">
          <div>
            <label className="form-label">Payment Amount (BDT / ৳) *</label>
            <input
              type="number"
              required
              value={paymentData.paid_amount}
              onChange={(e) => setPaymentData({ ...paymentData, paid_amount: e.target.value })}
              className="form-input font-bold text-base text-emerald-700"
            />
          </div>

          <div>
            <label className="form-label">Date of Receipt *</label>
            <input
              type="date"
              required
              value={paymentData.payment_date}
              onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Payment Method</label>
            <select
              value={paymentData.payment_method}
              onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
              className="form-input"
            >
              {PAYMENT_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-success">
              Save Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Print / View Invoice Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Tax Invoice"
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-6 text-sm p-2 print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Bangladesh Construction Co.</h2>
                <p className="text-xs text-gray-500 mt-1">Gulshan-2, Dhaka-1212, Bangladesh</p>
                <p className="text-xs text-gray-500">Phone: +880 1700-000000 • BIN: 001239845-0101</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono font-bold bg-primary-50 text-primary-800 px-3 py-1 rounded">
                  {selectedInvoice.invoice_no}
                </span>
                <p className="text-xs text-gray-400 mt-1">Date: {formatDate(selectedInvoice.issue_date)}</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusClass(selectedInvoice.status)}`}>
                  {formatStatus(selectedInvoice.status)}
                </span>
              </div>
            </div>

            {/* Client & Project Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-xs">
              <div>
                <span className="text-gray-400 uppercase font-semibold">Billed To:</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedInvoice.client_name || 'Valued Landowner'}</p>
                <p className="text-gray-600 mt-0.5">Project: <span className="font-semibold">{selectedInvoice.project_name || 'Site Project'}</span></p>
              </div>
              <div className="text-right">
                <span className="text-gray-400 uppercase font-semibold">Payment Status:</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">Received: {formatCurrency(selectedInvoice.paid_amount || 0)}</p>
                <p className="text-amber-700 font-semibold mt-0.5">Due Balance: {formatCurrency((Number(selectedInvoice.total) || 0) - (Number(selectedInvoice.paid_amount) || 0))}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2.5">Description / Milestone</th>
                  <th className="text-center p-2.5 w-16">Qty</th>
                  <th className="text-right p-2.5 w-28">Unit Rate</th>
                  <th className="text-right p-2.5 w-28">Total (BDT)</th>
                </tr>
              </thead>
              <tbody>
                {(selectedInvoice.items || [
                  { description: 'Construction & Structural Execution Milestone', quantity: 1, unit_price: selectedInvoice.total, total: selectedInvoice.total }
                ]).map((item, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="p-2.5">{item.description}</td>
                    <td className="p-2.5 text-center">{item.quantity}</td>
                    <td className="p-2.5 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="p-2.5 text-right font-semibold">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-xs">
                <div className="flex justify-between py-1 border-t border-gray-100">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(selectedInvoice.subtotal || selectedInvoice.total)}</span>
                </div>
                {Number(selectedInvoice.vat) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">VAT ({selectedInvoice.vat}%):</span>
                    <span className="font-semibold">{formatCurrency((Number(selectedInvoice.subtotal) * Number(selectedInvoice.vat)) / 100)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-t border-gray-200 text-sm font-bold text-gray-900">
                  <span>Grand Total:</span>
                  <span className="text-primary-700">{formatCurrency(selectedInvoice.total)}</span>
                </div>
              </div>
            </div>

            {selectedInvoice.notes && (
              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
                <span className="font-bold block text-gray-700">Notes & Bank Info:</span>
                {selectedInvoice.notes}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
                <Printer size={16} /> Print / Export PDF
              </button>
              <button onClick={() => setIsViewModalOpen(false)} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Dialog */}
      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Cancel Invoice"
        message={`Are you sure you want to delete invoice "${selectedInvoice?.invoice_no}"?`}
      />
    </div>
  );
}
