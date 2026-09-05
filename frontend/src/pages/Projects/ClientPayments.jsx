import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { projectPaymentsAPI, paymentPlansAPI, invoicesAPI, clientsAPI, projectsAPI } from '../../api';
import {
  DollarSign, Plus, Edit2, Trash2, ArrowLeft, CheckCircle2,
  Clock, AlertCircle, TrendingUp, CreditCard, Building2,
  FileText, Calendar, CheckSquare, Layers, Download, Printer,
  Eye, Search, Filter, ShieldCheck, ArrowUpRight, HelpCircle
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, formatStatus, getStatusClass } from '../../utils/helpers';

// Demo data fallbacks
const DEMO_PAYMENTS = [
  { id: 1, payment_code: 'CP-0001', client_name: 'Rahman Real Estate', amount: 15000000, payment_date: '2025-07-15', payment_method: 'bank_transfer', payment_for: 'advance', milestone: 'Mobilization & Foundation', notes: 'First instalment received via City Bank RTGS', created_at: '2025-07-15' },
  { id: 2, payment_code: 'CP-0002', client_name: 'Rahman Real Estate', amount: 18000000, payment_date: '2025-08-01', payment_method: 'cheque', payment_for: 'milestone', milestone: '5th Floor Slab Completion', notes: 'Cheque No: SB-2345678 (Sonali Bank)', cheque_number: 'SB-2345678', created_at: '2025-08-01' },
  { id: 3, payment_code: 'CP-0003', client_name: 'Rahman Real Estate', amount: 12000000, payment_date: '2025-08-20', payment_method: 'bank_transfer', payment_for: 'milestone', milestone: '8th Floor RCC Done', notes: 'NEFT Transfer confirmed by finance', transaction_ref: 'EFT-887412', created_at: '2025-08-20' },
];

const DEMO_PLANS = [
  { id: 1, milestone_name: 'Initial Mobilization & Foundation', description: 'Site setup, excavation and cast-in-situ piling completion', target_amount: 15000000, collected_amount: 15000000, due_date: '2025-07-30', completion_percentage: 100, status: 'completed' },
  { id: 2, milestone_name: 'Superstructure 1st to 5th Floor Slab', description: 'Columns, beams and casting up to 5th floor level', target_amount: 20000000, collected_amount: 18000000, due_date: '2025-08-15', completion_percentage: 90, status: 'partial' },
  { id: 3, milestone_name: 'Superstructure 6th to 10th Floor Slab', description: 'RCC structural frame for upper residential floors', target_amount: 25000000, collected_amount: 12000000, due_date: '2025-09-30', completion_percentage: 50, status: 'partial' },
  { id: 4, milestone_name: 'Brickwork & Exterior Plastering', description: 'Internal partitioning, exterior masonry, plaster and water proofing', target_amount: 18000000, collected_amount: 0, due_date: '2025-11-15', completion_percentage: 15, status: 'pending' },
  { id: 5, milestone_name: 'Final MEP, Painting & Handover', description: 'Sanitary fittings, electrical substation commissioning & key handover', target_amount: 12000000, collected_amount: 0, due_date: '2025-12-31', completion_percentage: 0, status: 'pending' },
];

const DEMO_INVOICES = [
  {
    id: 1,
    invoice_no: 'INV-2025-001',
    project_id: 1,
    client_name: 'Rahman Real Estate',
    issue_date: '2025-07-10',
    due_date: '2025-07-25',
    subtotal: 14500000,
    vat: 3.5,
    discount: 0,
    total: 15007500,
    paid_amount: 15000000,
    status: 'paid',
    notes: 'Mobilization advance bill as per contract clause 4.2',
    items: [
      { id: 1, description: 'Initial Mobilization Advance', quantity: 1, unit_price: 10000000, total: 10000000 },
      { id: 2, description: 'Bored Piling Rig Mobilization & Test Pile Execution', quantity: 1, unit_price: 4500000, total: 4500000 }
    ]
  },
  {
    id: 2,
    invoice_no: 'INV-2025-002',
    project_id: 1,
    client_name: 'Rahman Real Estate',
    issue_date: '2025-07-28',
    due_date: '2025-08-10',
    subtotal: 18000000,
    vat: 0,
    discount: 0,
    total: 18000000,
    paid_amount: 18000000,
    status: 'paid',
    notes: '5th Floor Slab casting verification approved by consultant',
    items: [
      { id: 3, description: 'RCC Slab & Column Casting (Ground to 5th Floor)', quantity: 5, unit_price: 3600000, total: 18000000 }
    ]
  },
  {
    id: 3,
    invoice_no: 'INV-2025-003',
    project_id: 1,
    client_name: 'Rahman Real Estate',
    issue_date: '2025-08-15',
    due_date: '2025-09-05',
    subtotal: 15000000,
    vat: 0,
    discount: 200000,
    total: 14800000,
    paid_amount: 12000000,
    status: 'partially_paid',
    notes: '8th Floor RCC Progress billing. Remaining balance due by next week.',
    items: [
      { id: 4, description: 'Upper Floor Structural Concrete & Rebar Placement', quantity: 1, unit_price: 15000000, total: 15000000 }
    ]
  }
];

const METHOD_LABELS = { cash: 'Cash', bank_transfer: 'Bank Transfer', cheque: 'Cheque', mobile_banking: 'Mobile Banking' };
const FOR_LABELS = { advance: 'Advance', milestone: 'Milestone', final: 'Final', retention: 'Retention', other: 'Other' };

export default function ClientPayments() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab synchronization with URL
  const currentTab = location.pathname.endsWith('/plans')
    ? 'plans'
    : location.pathname.endsWith('/invoices')
    ? 'invoices'
    : 'history';

  const [activeTab, setActiveTab] = useState(currentTab);

  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    navigate(`/projects/${projectId}/payments/${tab}`);
  };

  // Main Data States
  const [payments, setPayments] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [project, setProject] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceViewOpen, setIsInvoiceViewOpen] = useState(false);
  const [isInvoicePaymentOpen, setIsInvoicePaymentOpen] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'payment'|'plan'|'invoice', item }
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const initPaymentForm = () => ({
    project_id: projectId,
    client_id: project?.client_id || '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    payment_for: 'milestone',
    milestone_id: '',
    milestone: '',
    bank_name: '',
    account_number: '',
    cheque_number: '',
    transaction_ref: '',
    notes: '',
  });
  const [paymentForm, setPaymentForm] = useState(initPaymentForm());

  const initPlanForm = () => ({
    project_id: projectId,
    milestone_name: '',
    description: '',
    target_amount: '',
    due_date: '',
    completion_percentage: 0,
    status: 'pending',
  });
  const [planForm, setPlanForm] = useState(initPlanForm());

  const initInvoiceForm = () => ({
    project_id: projectId,
    client_id: project?.client_id || '',
    invoice_no: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    vat: 0,
    discount: 0,
    status: 'sent',
    notes: 'Payment via Cheque / Bank Transfer in favor of Company Account.',
    items: [
      { description: 'Construction Work Milestone Billing', quantity: 1, unit_price: 1000000, total: 1000000 }
    ]
  });
  const [invoiceForm, setInvoiceForm] = useState(initInvoiceForm());

  const [invoicePaymentForm, setInvoicePaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    notes: ''
  });

  // Load all project data
  useEffect(() => {
    loadAll();
  }, [projectId]);

  const loadAll = async () => {
    setLoading(true);
    let usedDemo = false;

    try {
      const [projRes, payRes, planRes, invRes, clientRes] = await Promise.allSettled([
        projectsAPI.getOne(projectId),
        projectPaymentsAPI.getAll({ project_id: projectId }),
        paymentPlansAPI.getAll({ project_id: projectId }),
        invoicesAPI.getAll({ project_id: projectId, per_page: 100 }),
        clientsAPI.getAll({ per_page: 100 }),
      ]);

      // Project info
      if (projRes.status === 'fulfilled' && projRes.value?.data?.success) {
        setProject(projRes.value.data.data);
      }

      // Clients
      if (clientRes.status === 'fulfilled' && clientRes.value?.data?.success) {
        setClients(clientRes.value.data.data || []);
      }

      // Payments
      if (payRes.status === 'fulfilled' && payRes.value?.data?.success) {
        const rawData = payRes.value.data.data;
        const list = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
        setPayments(list.length > 0 ? list : DEMO_PAYMENTS);
        if (list.length === 0) usedDemo = true;
      } else {
        setPayments(DEMO_PAYMENTS);
        usedDemo = true;
      }

      // Payment Plans / Milestones
      if (planRes.status === 'fulfilled' && planRes.value?.data?.success) {
        const rawPlans = planRes.value.data.data;
        const list = Array.isArray(rawPlans) ? rawPlans : (Array.isArray(rawPlans?.data) ? rawPlans.data : []);
        setMilestones(list.length > 0 ? list : DEMO_PLANS);
        if (list.length === 0) usedDemo = true;
      } else {
        setMilestones(DEMO_PLANS);
        usedDemo = true;
      }

      // Invoices
      if (invRes.status === 'fulfilled' && invRes.value?.data?.success) {
        const rawInvs = invRes.value.data.data;
        const list = Array.isArray(rawInvs) ? rawInvs : (Array.isArray(rawInvs?.data) ? rawInvs.data : []);
        setInvoices(list.length > 0 ? list : DEMO_INVOICES);
        if (list.length === 0) usedDemo = true;
      } else {
        setInvoices(DEMO_INVOICES);
        usedDemo = true;
      }

      setIsDemo(usedDemo);
    } catch (err) {
      console.error(err);
      setPayments(DEMO_PAYMENTS);
      setMilestones(DEMO_PLANS);
      setInvoices(DEMO_INVOICES);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const safePayments = Array.isArray(payments) ? payments : [];
  const safeMilestones = Array.isArray(milestones) ? milestones : [];
  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  const totalCollected = safePayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const totalBudget = parseFloat(project?.total_budget || 0);

  const totalPlannedMilestones = safeMilestones.reduce((s, m) => s + parseFloat(m.target_amount || 0), 0);
  const totalCollectedMilestones = safeMilestones.reduce((s, m) => s + parseFloat(m.collected_amount || 0), 0);
  const totalPendingMilestones = Math.max(0, totalPlannedMilestones - totalCollectedMilestones);

  const totalInvoiced = safeInvoices.reduce((s, i) => s + parseFloat(i.total || 0), 0);
  const totalInvoicePaid = safeInvoices.reduce((s, i) => s + parseFloat(i.paid_amount || 0), 0);
  const totalInvoiceDue = Math.max(0, totalInvoiced - totalInvoicePaid);
  const overdueInvoicesCount = safeInvoices.filter(i => i.status === 'overdue' || (i.due_date && new Date(i.due_date) < new Date() && i.status !== 'paid')).length;

  // Badge Helpers
  const getMethodBadge = (m) => {
    const colors = {
      cash: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      bank_transfer: 'bg-blue-50 text-blue-700 border-blue-200',
      cheque: 'bg-purple-50 text-purple-700 border-purple-200',
      mobile_banking: 'bg-orange-50 text-orange-700 border-orange-200'
    };
    return colors[m] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getForBadge = (f) => {
    const colors = {
      advance: 'bg-blue-50 text-blue-700 border-blue-200',
      milestone: 'bg-amber-50 text-amber-700 border-amber-200',
      final: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      retention: 'bg-purple-50 text-purple-700 border-purple-200',
      other: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[f] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getPlanStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 size={12} /> Completed</span>;
      case 'partial':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200"><Clock size={12} /> In Progress</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200"><Clock size={12} /> Pending</span>;
    }
  };

  const getInvoiceStatusBadge = (status, dueDate) => {
    const isOverdue = status !== 'paid' && dueDate && new Date(dueDate) < new Date();
    if (isOverdue || status === 'overdue') {
      return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200"><AlertCircle size={12} /> Overdue</span>;
    }
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 size={12} /> Paid</span>;
      case 'partially_paid':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200"><Clock size={12} /> Partial</span>;
      case 'sent':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200"><ArrowUpRight size={12} /> Sent</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
    }
  };

  // --- Handlers: Payment History ---
  const openAddPayment = (prefillMilestone = null) => {
    setSelectedPayment(null);
    setPaymentForm({
      ...initPaymentForm(),
      client_id: project?.client_id || '',
      milestone_id: prefillMilestone?.id || '',
      milestone: prefillMilestone?.milestone_name || '',
      amount: prefillMilestone ? Math.max(0, prefillMilestone.target_amount - (prefillMilestone.collected_amount || 0)) : ''
    });
    setIsPaymentModalOpen(true);
  };

  const openEditPayment = (p) => {
    setSelectedPayment(p);
    setPaymentForm({
      project_id: projectId,
      client_id: p.client_id || project?.client_id || '',
      amount: p.amount || '',
      payment_date: p.payment_date || new Date().toISOString().split('T')[0],
      payment_method: p.payment_method || 'bank_transfer',
      payment_for: p.payment_for || 'milestone',
      milestone_id: p.milestone_id || '',
      milestone: p.milestone || '',
      bank_name: p.bank_name || '',
      account_number: p.account_number || '',
      cheque_number: p.cheque_number || '',
      transaction_ref: p.transaction_ref || '',
      notes: p.notes || '',
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedPayment) {
        await projectPaymentsAPI.update(selectedPayment.id, paymentForm);
        toast.success('Payment updated successfully!');
      } else {
        await projectPaymentsAPI.create(paymentForm);
        toast.success('Payment recorded successfully!');
      }
      setIsPaymentModalOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save payment');
    } finally {
      setSubmitting(false);
    }
  };

  const openReceiptView = (p) => {
    setSelectedReceipt(p);
    setIsReceiptModalOpen(true);
  };

  // --- Handlers: Payment Plans (Milestones) ---
  const openAddPlan = () => {
    setSelectedPlan(null);
    setPlanForm(initPlanForm());
    setIsPlanModalOpen(true);
  };

  const openEditPlan = (plan) => {
    setSelectedPlan(plan);
    setPlanForm({
      project_id: projectId,
      milestone_name: plan.milestone_name || '',
      description: plan.description || '',
      target_amount: plan.target_amount || '',
      due_date: plan.due_date || '',
      completion_percentage: plan.completion_percentage || 0,
      status: plan.status || 'pending',
    });
    setIsPlanModalOpen(true);
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedPlan) {
        await paymentPlansAPI.update(selectedPlan.id, planForm);
        toast.success('Payment milestone plan updated!');
      } else {
        await paymentPlansAPI.create(planForm);
        toast.success('Payment milestone plan added!');
      }
      setIsPlanModalOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save payment plan');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers: Invoices ---
  const openAddInvoice = () => {
    setSelectedInvoice(null);
    setInvoiceForm({
      ...initInvoiceForm(),
      client_id: project?.client_id || '',
    });
    setIsInvoiceModalOpen(true);
  };

  const openEditInvoice = (inv) => {
    setSelectedInvoice(inv);
    setInvoiceForm({
      project_id: projectId,
      client_id: inv.client_id || project?.client_id || '',
      invoice_no: inv.invoice_no || '',
      issue_date: inv.issue_date || new Date().toISOString().split('T')[0],
      due_date: inv.due_date || '',
      vat: inv.vat || 0,
      discount: inv.discount || 0,
      status: inv.status || 'sent',
      notes: inv.notes || '',
      items: inv.items && inv.items.length > 0 ? inv.items : [
        { description: 'Milestone Completion Bill', quantity: 1, unit_price: inv.subtotal || inv.total || 0, total: inv.subtotal || inv.total || 0 }
      ]
    });
    setIsInvoiceModalOpen(true);
  };

  const handleInvoiceItemChange = (index, field, val) => {
    setInvoiceForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: val };
      if (field === 'quantity' || field === 'unit_price') {
        const q = parseFloat(items[index].quantity) || 0;
        const u = parseFloat(items[index].unit_price) || 0;
        items[index].total = q * u;
      }
      return { ...prev, items };
    });
  };

  const addInvoiceItem = () => {
    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
    }));
  };

  const removeInvoiceItem = (index) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const invoiceSubtotal = (invoiceForm.items || []).reduce((s, it) => s + (parseFloat(it.total) || 0), 0);
  const vatAmount = invoiceSubtotal * ((parseFloat(invoiceForm.vat) || 0) / 100);
  const discountAmount = parseFloat(invoiceForm.discount) || 0;
  const invoiceGrandTotal = Math.max(0, invoiceSubtotal + vatAmount - discountAmount);

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...invoiceForm,
        subtotal: invoiceSubtotal,
        total: invoiceGrandTotal,
      };
      if (selectedInvoice) {
        await invoicesAPI.update(selectedInvoice.id, payload);
        toast.success('Invoice updated successfully!');
      } else {
        await invoicesAPI.create(payload);
        toast.success('Invoice created successfully!');
      }
      setIsInvoiceModalOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const openInvoicePayment = (inv) => {
    setSelectedInvoice(inv);
    const balance = Math.max(0, parseFloat(inv.total || 0) - parseFloat(inv.paid_amount || 0));
    setInvoicePaymentForm({
      amount: balance,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
      notes: `Payment for Invoice #${inv.invoice_no}`
    });
    setIsInvoicePaymentOpen(true);
  };

  const handleRecordInvoicePayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmitting(true);
    try {
      const payAmount = parseFloat(invoicePaymentForm.amount) || 0;
      const currentPaid = parseFloat(selectedInvoice.paid_amount) || 0;
      const newPaid = currentPaid + payAmount;
      const newStatus = newPaid >= parseFloat(selectedInvoice.total) ? 'paid' : (newPaid > 0 ? 'partially_paid' : selectedInvoice.status);

      // 1. Update Invoice
      await invoicesAPI.update(selectedInvoice.id, {
        paid_amount: newPaid,
        status: newStatus,
        payment_date: invoicePaymentForm.payment_date,
        payment_method: invoicePaymentForm.payment_method,
      });

      // 2. Also record in Client Payments
      await projectPaymentsAPI.create({
        project_id: projectId,
        client_id: selectedInvoice.client_id || project?.client_id,
        amount: payAmount,
        payment_date: invoicePaymentForm.payment_date,
        payment_method: invoicePaymentForm.payment_method,
        payment_for: 'milestone',
        milestone: `Invoice ${selectedInvoice.invoice_no}`,
        notes: invoicePaymentForm.notes || `Received for ${selectedInvoice.invoice_no}`,
      });

      toast.success('Payment recorded and invoice balance updated!');
      setIsInvoicePaymentOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record invoice payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickInvoiceStatusChange = async (inv, newStatus) => {
    try {
      setInvoices((prev) =>
        prev.map((i) => (i.id === inv.id ? { ...i, status: newStatus } : i))
      );
      await invoicesAPI.update(inv.id, { status: newStatus });
      toast.success(
        `Invoice ${inv.invoice_no} status changed to "${newStatus.replace('_', ' ')}" (synced with Project Expenses & Cost Tracking)!`
      );
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update invoice status');
      loadAll();
    }
  };

  // --- Deletion Handlers ---
  const confirmDelete = (type, item) => {
    setDeleteTarget({ type, item });
    setIsDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'payment') {
        await projectPaymentsAPI.delete(deleteTarget.item.id);
        toast.success('Payment record deleted');
      } else if (deleteTarget.type === 'plan') {
        await paymentPlansAPI.delete(deleteTarget.item.id);
        toast.success('Payment milestone deleted');
      } else if (deleteTarget.type === 'invoice') {
        await invoicesAPI.delete(deleteTarget.item.id);
        toast.success('Invoice deleted');
      }
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      loadAll();
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  // Filtered lists
  const filteredPayments = safePayments.filter(p => {
    const matchesSearch = !searchTerm ||
      (p.payment_code && p.payment_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.client_name && p.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.milestone && p.milestone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.cheque_number && p.cheque_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || p.payment_for === filterType;
    return matchesSearch && matchesType;
  });

  const filteredInvoices = safeInvoices.filter(i => {
    const matchesSearch = !searchTerm ||
      (i.invoice_no && i.invoice_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (i.client_name && i.client_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || i.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredPlans = safeMilestones.filter(m => {
    return !searchTerm ||
      (m.milestone_name && m.milestone_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/projects/${projectId}/info`}
            className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 bg-white shadow-xs"
            title="Back to Project Info"
          >
            <ArrowLeft size={18} />
          </Link>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md text-white"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
          >
            <DollarSign size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Client Payments & Billing</h1>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Finance Module
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {project?.name ? `${project.name} (Code: ${project.code || `PRJ-${projectId}`})` : `Project #${projectId}`}
            </p>
          </div>
        </div>

        {/* Dynamic Action Button */}
        <div className="flex items-center gap-2">
          {activeTab === 'history' && (
            <button
              onClick={() => openAddPayment()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all hover:shadow"
            >
              <Plus size={18} /> Record Payment
            </button>
          )}
          {activeTab === 'plans' && (
            <button
              onClick={openAddPlan}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm transition-all hover:shadow"
            >
              <Plus size={18} /> Add Payment Plan
            </button>
          )}
          {activeTab === 'invoices' && (
            <button
              onClick={openAddInvoice}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all hover:shadow"
            >
              <Plus size={18} /> Create Invoice
            </button>
          )}
        </div>
      </div>

      {isDemo && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3.5 text-amber-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
            <span>Showing verified demonstration records. You can create, edit, print receipts, and manage all payments, milestones, and invoices live.</span>
          </div>
        </div>
      )}

      {/* Segmented Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => switchTab('history')}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <CreditCard size={18} />
          <span>Payment History</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            activeTab === 'history' ? 'bg-emerald-500/60 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {safePayments.length}
          </span>
        </button>

        <button
          onClick={() => switchTab('plans')}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'plans'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Calendar size={18} />
          <span>Payment Plans (Milestones)</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            activeTab === 'plans' ? 'bg-primary-500/60 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {safeMilestones.length}
          </span>
        </button>

        <button
          onClick={() => switchTab('invoices')}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'invoices'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <FileText size={18} />
          <span>Invoices</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            activeTab === 'invoices' ? 'bg-blue-500/60 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {safeInvoices.length}
          </span>
        </button>
      </div>

      {/* TAB CONTENT: 1. PAYMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Collected</span>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</p>
                  <span className="text-xs text-gray-400 mt-0.5 block">{safePayments.length} transactions recorded</span>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Project Budget</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalBudget)}</p>
                  <span className="text-xs text-gray-400 mt-0.5 block">Approved contract sum</span>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Building2 size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Collection Rate</span>
                  <p className="text-2xl font-bold text-primary-600 mt-1">
                    {totalBudget > 0 ? `${Math.min(100, Math.round((totalCollected / totalBudget) * 100))}%` : '—'}
                  </p>
                  <span className="text-xs text-gray-400 mt-0.5 block">
                    {formatCurrency(Math.max(0, totalBudget - totalCollected))} remaining
                  </span>
                </div>
                <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-primary-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalBudget > 0 ? Math.min(100, (totalCollected / totalBudget) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by code, client, milestone, cheque..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-9 text-xs sm:text-sm py-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter size={15} className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field py-1.5 text-xs font-medium w-auto"
              >
                <option value="all">All Payment Types</option>
                <option value="advance">Advance</option>
                <option value="milestone">Milestone</option>
                <option value="final">Final</option>
                <option value="retention">Retention</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="font-bold text-gray-900 text-sm sm:text-base">Payment Records</h2>
                <p className="text-xs text-gray-500">History of all client deposits, milestone receipts, and advance payments</p>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                {filteredPayments.length} records
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400 p-6 text-center">
                <DollarSign size={40} className="opacity-20 text-gray-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">No payment records found</p>
                  <p className="text-xs text-gray-400 mt-0.5">Record payments received from the client for this project</p>
                </div>
                <button onClick={() => openAddPayment()} className="btn-primary text-xs mt-1">
                  <Plus size={14} /> Record First Payment
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                    <tr>
                      <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Code</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Client</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Milestone / Purpose</th>
                      <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Amount</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Date</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Method</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Type</th>
                      <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                            {p.payment_code || `PAY-${p.id}`}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{p.client_name || project?.client_name || 'Client'}</p>
                          {p.bank_name && <span className="text-[11px] text-gray-400 block">{p.bank_name}</span>}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-medium text-gray-700 block max-w-[200px] truncate" title={p.milestone || p.milestone_ref_name || 'General Payment'}>
                            {p.milestone || p.milestone_ref_name || '—'}
                          </span>
                          {p.cheque_number && <span className="text-[10px] text-purple-700 font-medium">Chq: {p.cheque_number}</span>}
                          {p.transaction_ref && <span className="text-[10px] text-blue-700 font-medium">Ref: {p.transaction_ref}</span>}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-bold text-emerald-700 text-sm">{formatCurrency(p.amount)}</span>
                        </td>
                        <td className="px-5 py-4 text-gray-600 text-xs">{formatDate(p.payment_date)}</td>
                        <td className="px-5 py-4">
                          <span className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold ${getMethodBadge(p.payment_method)}`}>
                            {METHOD_LABELS[p.payment_method] || p.payment_method}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold ${getForBadge(p.payment_for)}`}>
                            {FOR_LABELS[p.payment_for] || p.payment_for}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => openReceiptView(p)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                              title="Print Money Receipt Voucher"
                            >
                              <Printer size={15} />
                            </button>
                            <button
                              onClick={() => openEditPayment(p)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                              title="Edit Record"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => confirmDelete('payment', p)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. PAYMENT PLANS (MILESTONES) */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Planned Milestones</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalPlannedMilestones)}</p>
              <span className="text-xs text-gray-400 mt-0.5 block">{safeMilestones.length} defined stages</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Collected on Plans</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollectedMilestones)}</p>
              <span className="text-xs text-gray-400 mt-0.5 block">Directly milestone linked</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Target</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalPendingMilestones)}</p>
              <span className="text-xs text-gray-400 mt-0.5 block">Future billable milestone sum</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Financial Completion</span>
              <p className="text-2xl font-bold text-primary-600 mt-1">
                {totalPlannedMilestones > 0 ? `${Math.min(100, Math.round((totalCollectedMilestones / totalPlannedMilestones) * 100))}%` : '0%'}
              </p>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                <div
                  className="bg-primary-500 h-full rounded-full transition-all"
                  style={{ width: `${totalPlannedMilestones > 0 ? Math.min(100, (totalCollectedMilestones / totalPlannedMilestones) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search payment milestones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-9 text-xs sm:text-sm py-2"
              />
            </div>
            <button
              onClick={openAddPlan}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus size={16} /> Add Milestone Plan
            </button>
          </div>

          {/* Milestones Cards / List */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col items-center justify-center gap-3 text-gray-400 text-center">
              <Calendar size={40} className="opacity-20 text-gray-600" />
              <div>
                <p className="text-sm font-semibold text-gray-700">No payment plans or milestones defined</p>
                <p className="text-xs text-gray-400 mt-0.5">Setup payment milestones (e.g. 5th Floor Casting, Handover) to track collection progress</p>
              </div>
              <button onClick={openAddPlan} className="btn-primary text-xs mt-1">
                <Plus size={14} /> Add First Payment Plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlans.map((plan, idx) => {
                const target = parseFloat(plan.target_amount || 0);
                const collected = parseFloat(plan.collected_amount || 0);
                const remaining = Math.max(0, target - collected);
                const financialProgress = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
                const isOverdue = plan.due_date && new Date(plan.due_date) < new Date() && plan.status !== 'completed';

                return (
                  <div
                    key={plan.id}
                    className="bg-white rounded-2xl border border-gray-200 hover:border-primary-200 p-5 shadow-xs hover:shadow transition-all space-y-4 relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary-700 font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">{plan.milestone_name}</h3>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{plan.description || 'No stage description added'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getPlanStatusBadge(plan.status)}
                      </div>
                    </div>

                    {/* Financial Progress Breakdown */}
                    <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Target Billing</span>
                        <span className="font-bold text-gray-900">{formatCurrency(target)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Collected</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(collected)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Remaining Due</span>
                        <span className="font-bold text-amber-700">{formatCurrency(remaining)}</span>
                      </div>

                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between items-center text-[11px] text-gray-500">
                          <span>Financial Collection Progress</span>
                          <span className="font-semibold text-gray-700">{financialProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${financialProgress >= 100 ? 'bg-emerald-500' : 'bg-primary-500'}`}
                            style={{ width: `${financialProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Milestone Footer */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar size={14} className={isOverdue ? 'text-rose-500' : 'text-gray-400'} />
                        <span className={isOverdue ? 'text-rose-600 font-semibold' : ''}>
                          Due: {plan.due_date ? formatDate(plan.due_date) : 'Flexible'}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openAddPayment(plan)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
                          title="Record Payment for this Milestone"
                        >
                          <DollarSign size={13} /> Record Payment
                        </button>
                        <button
                          onClick={() => openEditPlan(plan)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Edit Milestone Plan"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => confirmDelete('plan', plan)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          title="Delete Milestone Plan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Invoiced</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalInvoiced)}</p>
              <span className="text-xs text-gray-400 mt-0.5 block">{safeInvoices.length} invoices issued</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Collected on Invoices</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalInvoicePaid)}</p>
              <span className="text-xs text-gray-400 mt-0.5 block">Cleared payments</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outstanding Balance</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalInvoiceDue)}</p>
              <span className="text-xs text-gray-400 mt-0.5 block">Unpaid balance amount</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Overdue Invoices</span>
              <p className={`text-2xl font-bold mt-1 ${overdueInvoicesCount > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                {overdueInvoicesCount}
              </p>
              <span className="text-xs text-gray-400 mt-0.5 block">Require urgent follow-up</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number or client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-9 text-xs sm:text-sm py-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={15} className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field py-1.5 text-xs font-medium w-auto"
              >
                <option value="all">All Invoices</option>
                <option value="sent">Sent</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="draft">Draft</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="font-bold text-gray-900 text-sm sm:text-base">Project Invoices</h2>
                <p className="text-xs text-gray-500">Official client billing, certificates of payment, and outstanding balances</p>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                {filteredInvoices.length} invoices
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400 p-6 text-center">
                <FileText size={40} className="opacity-20 text-gray-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">No invoices issued for this project</p>
                  <p className="text-xs text-gray-400 mt-0.5">Generate formal client invoices with detailed line items and taxes</p>
                </div>
                <button onClick={openAddInvoice} className="btn-primary text-xs mt-1">
                  <Plus size={14} /> Create First Invoice
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                    <tr>
                      <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Invoice #</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Client</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Dates</th>
                      <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Total Bill</th>
                      <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Paid Amount</th>
                      <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Balance Due</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Status</th>
                      <th className="text-right px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInvoices.map((inv) => {
                      const total = parseFloat(inv.total || 0);
                      const paid = parseFloat(inv.paid_amount || 0);
                      const balance = Math.max(0, total - paid);

                      return (
                        <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors group">
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                              {inv.invoice_no}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-900">{inv.client_name || project?.client_name || 'Client'}</p>
                            {inv.items && inv.items.length > 0 && (
                              <span className="text-[11px] text-gray-400 block truncate max-w-[180px]">
                                {inv.items[0].description} {inv.items.length > 1 ? `(+${inv.items.length - 1} more)` : ''}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs">
                            <span className="text-gray-700 block">Issued: {formatDate(inv.issue_date)}</span>
                            <span className="text-gray-400 block mt-0.5">Due: {formatDate(inv.due_date)}</span>
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-gray-900">
                            {formatCurrency(total)}
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                            {formatCurrency(paid)}
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-amber-700">
                            {formatCurrency(balance)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="relative inline-block">
                              <select
                                value={inv.status || 'sent'}
                                onChange={(e) => handleQuickInvoiceStatusChange(inv, e.target.value)}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-all outline-none ${
                                  inv.status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                    : inv.status === 'partially_paid'
                                    ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                                    : inv.status === 'sent'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100'
                                    : inv.status === 'overdue'
                                    ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                    : inv.status === 'draft'
                                    ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                                }`}
                                title="Click to change status (automatically updates Project Expenses & Cost Tracking)"
                              >
                                <option value="draft">Draft</option>
                                <option value="sent">Sent</option>
                                <option value="partially_paid">Partially Paid</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setIsInvoiceViewOpen(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                                title="View & Print Invoice"
                              >
                                <Eye size={15} />
                              </button>
                              {balance > 0 && (
                                <button
                                  onClick={() => openInvoicePayment(inv)}
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                                  title="Record Payment on this Invoice"
                                >
                                  <DollarSign size={15} />
                                </button>
                              )}
                              <button
                                onClick={() => openEditInvoice(inv)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                                title="Edit Invoice"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => confirmDelete('invoice', inv)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                title="Delete Invoice"
                              >
                                <Trash2 size={15} />
                              </button>
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
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: RECORD / EDIT PAYMENT                           */}
      {/* ======================================================== */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={selectedPayment ? 'Edit Client Payment' : 'Record Client Payment'}
        size="lg"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Amount Received (BDT) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 1500000"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                className="input-field"
              >
                <option value="bank_transfer">Bank Transfer (RTGS / EFT)</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="mobile_banking">Mobile Banking (bKash / Nagad)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment For / Type
              </label>
              <select
                value={paymentForm.payment_for}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_for: e.target.value })}
                className="input-field"
              >
                <option value="milestone">Milestone Progress Bill</option>
                <option value="advance">Mobilization Advance</option>
                <option value="final">Final Settlement</option>
                <option value="retention">Retention Release</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Link to Payment Milestone / Plan (Optional)
              </label>
              <select
                value={paymentForm.milestone_id}
                onChange={(e) => {
                  const mId = e.target.value;
                  const match = safeMilestones.find(m => String(m.id) === String(mId));
                  setPaymentForm({
                    ...paymentForm,
                    milestone_id: mId,
                    milestone: match ? match.milestone_name : paymentForm.milestone
                  });
                }}
                className="input-field"
              >
                <option value="">-- Choose Existing Milestone or Enter Below --</option>
                {safeMilestones.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.milestone_name} (Target: {formatCurrency(m.target_amount)})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Milestone Name / Stage Description
              </label>
              <input
                type="text"
                placeholder="e.g. 5th Floor Slab Completion"
                value={paymentForm.milestone}
                onChange={(e) => setPaymentForm({ ...paymentForm, milestone: e.target.value })}
                className="input-field"
              />
            </div>

            {(paymentForm.payment_method === 'bank_transfer' || paymentForm.payment_method === 'cheque') && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. City Bank, Sonali Bank"
                    value={paymentForm.bank_name}
                    onChange={(e) => setPaymentForm({ ...paymentForm, bank_name: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {paymentForm.payment_method === 'cheque' ? 'Cheque Number' : 'Account / Ref Number'}
                  </label>
                  <input
                    type="text"
                    placeholder={paymentForm.payment_method === 'cheque' ? 'e.g. CHQ-994821' : 'e.g. A/C 20501234567'}
                    value={paymentForm.payment_method === 'cheque' ? paymentForm.cheque_number : paymentForm.account_number}
                    onChange={(e) => {
                      if (paymentForm.payment_method === 'cheque') {
                        setPaymentForm({ ...paymentForm, cheque_number: e.target.value });
                      } else {
                        setPaymentForm({ ...paymentForm, account_number: e.target.value });
                      }
                    }}
                    className="input-field"
                  />
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Internal Remarks / Notes
              </label>
              <textarea
                rows={2}
                placeholder="Reference details, transaction code, or remarks..."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm px-5 py-2"
            >
              {submitting ? 'Saving...' : (selectedPayment ? 'Update Payment' : 'Record Payment')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: PAYMENT RECEIPT / VOUCHER PREVIEW               */}
      {/* ======================================================== */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Money Receipt Voucher"
        size="lg"
      >
        {selectedReceipt && (
          <div className="space-y-6">
            <div id="printable-voucher" className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-6">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">BANGLADESH CONSTRUCTION CO.</h2>
                  <p className="text-xs text-gray-500">Corporate Engineering & Infrastructure Management</p>
                  <p className="text-xs text-gray-500">Gulshan-2, Dhaka-1212, Bangladesh</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">
                    MONEY RECEIPT
                  </span>
                  <p className="font-mono text-xs font-bold text-gray-700 mt-1">
                    Voucher: {selectedReceipt.payment_code || `PAY-${selectedReceipt.id}`}
                  </p>
                  <p className="text-xs text-gray-500">Date: {formatDate(selectedReceipt.payment_date)}</p>
                </div>
              </div>

              {/* Receipt Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 font-medium">Received From (Client):</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{selectedReceipt.client_name || project?.client_name || 'Client'}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Project Name:</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{project?.name || `Project #${projectId}`}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Payment Purpose / Milestone:</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{selectedReceipt.milestone || 'General Milestone / Advance'}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Payment Mode:</span>
                  <p className="font-semibold text-gray-800 mt-0.5 uppercase">
                    {METHOD_LABELS[selectedReceipt.payment_method] || selectedReceipt.payment_method}
                    {selectedReceipt.cheque_number && ` (Cheque: ${selectedReceipt.cheque_number})`}
                    {selectedReceipt.bank_name && ` - ${selectedReceipt.bank_name}`}
                  </p>
                </div>
              </div>

              {/* Amount Showcase */}
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Amount Received</span>
                  <p className="text-xs text-emerald-700 mt-0.5">Payment type: {FOR_LABELS[selectedReceipt.payment_for] || 'Milestone'}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-700">{formatCurrency(selectedReceipt.amount)}</span>
                </div>
              </div>

              {selectedReceipt.notes && (
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="font-semibold text-gray-700">Remarks:</span> {selectedReceipt.notes}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="h-10 border-b border-gray-300 w-3/4 mx-auto" />
                  <p className="text-xs font-semibold text-gray-600 mt-1">Client Representative Signature</p>
                </div>
                <div className="text-center">
                  <div className="h-10 border-b border-gray-300 w-3/4 mx-auto" />
                  <p className="text-xs font-semibold text-gray-600 mt-1">Authorized Cashier / Accounts Dept.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all"
              >
                <Printer size={16} /> Print Voucher
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: ADD / EDIT PAYMENT PLAN (MILESTONE)             */}
      {/* ======================================================== */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={selectedPlan ? 'Edit Payment Milestone Plan' : 'Add Payment Milestone Plan'}
        size="md"
      >
        <form onSubmit={handlePlanSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Milestone Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 5th Floor Slab Casting Completion"
              value={planForm.milestone_name}
              onChange={(e) => setPlanForm({ ...planForm, milestone_name: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description / Deliverables
            </label>
            <textarea
              rows={2}
              placeholder="Specify structural work, materials, or certification requirements..."
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Target Amount (BDT) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 20000000"
                value={planForm.target_amount}
                onChange={(e) => setPlanForm({ ...planForm, target_amount: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Expected Due Date
              </label>
              <input
                type="date"
                value={planForm.due_date}
                onChange={(e) => setPlanForm({ ...planForm, due_date: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Completion Percentage ({planForm.completion_percentage}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={planForm.completion_percentage}
                onChange={(e) => setPlanForm({ ...planForm, completion_percentage: parseInt(e.target.value) || 0 })}
                className="w-full accent-primary-600 mt-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Stage Status
              </label>
              <select
                value={planForm.status}
                onChange={(e) => setPlanForm({ ...planForm, status: e.target.value })}
                className="input-field"
              >
                <option value="pending">Pending</option>
                <option value="partial">In Progress / Partial</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm px-5 py-2"
            >
              {submitting ? 'Saving...' : (selectedPlan ? 'Update Plan' : 'Save Plan')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 4: CREATE / EDIT INVOICE                           */}
      {/* ======================================================== */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title={selectedInvoice ? 'Edit Project Invoice' : 'Create Project Invoice'}
        size="xl"
      >
        <form onSubmit={handleInvoiceSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice Number (Auto or Custom)</label>
              <input
                type="text"
                placeholder="e.g. INV-2026-004 (Leave blank for auto)"
                value={invoiceForm.invoice_no}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_no: e.target.value })}
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Issue Date *</label>
              <input
                type="date"
                required
                value={invoiceForm.issue_date}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, issue_date: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={invoiceForm.due_date}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          {/* Line Items Builder */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Billable Items / Milestones</label>
              <button
                type="button"
                onClick={addInvoiceItem}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
              {invoiceForm.items.map((it, idx) => (
                <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                  <input
                    type="text"
                    required
                    placeholder="Milestone description or item details..."
                    value={it.description}
                    onChange={(e) => handleInvoiceItemChange(idx, 'description', e.target.value)}
                    className="input-field text-xs flex-1"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={it.quantity}
                    onChange={(e) => handleInvoiceItemChange(idx, 'quantity', e.target.value)}
                    className="input-field text-xs w-20 text-center"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price"
                    value={it.unit_price}
                    onChange={(e) => handleInvoiceItemChange(idx, 'unit_price', e.target.value)}
                    className="input-field text-xs w-28 text-right"
                  />
                  <span className="font-bold text-gray-800 text-xs w-28 text-right px-2">
                    {formatCurrency(it.total || 0)}
                  </span>
                  {invoiceForm.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInvoiceItem(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Taxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice Notes / Terms</label>
              <textarea
                rows={3}
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                className="input-field text-xs"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-gray-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(invoiceSubtotal)}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-600">VAT / Tax (%):</span>
                <input
                  type="number"
                  step="0.1"
                  value={invoiceForm.vat}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, vat: e.target.value })}
                  className="input-field text-xs w-24 text-right py-1"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-600">Discount (BDT):</span>
                <input
                  type="number"
                  step="0.01"
                  value={invoiceForm.discount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: e.target.value })}
                  className="input-field text-xs w-28 text-right py-1"
                />
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Grand Total:</span>
                <span className="text-emerald-700">{formatCurrency(invoiceGrandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm px-5 py-2"
            >
              {submitting ? 'Saving...' : (selectedInvoice ? 'Update Invoice' : 'Create Invoice')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 5: FULL INVOICE VIEW & PRINT                       */}
      {/* ======================================================== */}
      <Modal
        isOpen={isInvoiceViewOpen}
        onClose={() => setIsInvoiceViewOpen(false)}
        title="Project Invoice Details"
        size="xl"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div id="printable-invoice" className="p-6 sm:p-8 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-6">
              {/* Invoice Header */}
              <div className="flex flex-wrap justify-between items-start gap-4 border-b border-gray-200 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">BANGLADESH CONSTRUCTION CO.</h2>
                  <p className="text-xs text-gray-500 mt-1">General Contractors & Engineering Consultants</p>
                  <p className="text-xs text-gray-500">Dhaka, Bangladesh | Phone: +880 1700-000000</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold text-gray-900 font-mono">{selectedInvoice.invoice_no}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Date: {formatDate(selectedInvoice.issue_date)}</p>
                  <p className="text-xs text-gray-500">Due: {formatDate(selectedInvoice.due_date)}</p>
                  <div className="mt-2">
                    {getInvoiceStatusBadge(selectedInvoice.status, selectedInvoice.due_date)}
                  </div>
                </div>
              </div>

              {/* Client & Project Info */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Billed To:</span>
                  <p className="font-bold text-gray-900 text-sm">{selectedInvoice.client_name || project?.client_name || 'Client Name'}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Project:</span>
                  <p className="font-bold text-gray-900 text-sm">{project?.name || `Project #${projectId}`}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th className="text-left p-3 font-bold uppercase">#</th>
                      <th className="text-left p-3 font-bold uppercase">Description</th>
                      <th className="text-center p-3 font-bold uppercase">Qty</th>
                      <th className="text-right p-3 font-bold uppercase">Rate</th>
                      <th className="text-right p-3 font-bold uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selectedInvoice.items && selectedInvoice.items.length > 0 ? selectedInvoice.items : [
                      { description: 'Construction Milestone Bill', quantity: 1, unit_price: selectedInvoice.subtotal || selectedInvoice.total, total: selectedInvoice.subtotal || selectedInvoice.total }
                    ]).map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 text-gray-400">{idx + 1}</td>
                        <td className="p-3 font-medium text-gray-900">{item.description}</td>
                        <td className="p-3 text-center text-gray-600">{item.quantity}</td>
                        <td className="p-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                        <td className="p-3 text-right font-bold text-gray-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedInvoice.subtotal || selectedInvoice.total)}</span>
                  </div>
                  {Number(selectedInvoice.vat) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>VAT ({selectedInvoice.vat}%):</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency((parseFloat(selectedInvoice.subtotal || 0) * parseFloat(selectedInvoice.vat)) / 100)}
                      </span>
                    </div>
                  )}
                  {Number(selectedInvoice.discount) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Discount:</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(selectedInvoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total Amount:</span>
                    <span className="text-emerald-700">{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-emerald-600 pt-1">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(selectedInvoice.paid_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-amber-700 pt-1 border-t border-gray-200">
                    <span>Outstanding Due:</span>
                    <span>{formatCurrency(Math.max(0, (selectedInvoice.total || 0) - (selectedInvoice.paid_amount || 0)))}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="text-xs text-gray-500 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                  <span className="font-semibold text-gray-700">Terms & Instructions:</span> {selectedInvoice.notes}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsInvoiceViewOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all"
              >
                <Printer size={16} /> Print Invoice
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 6: RECORD PAYMENT AGAINST INVOICE                  */}
      {/* ======================================================== */}
      <Modal
        isOpen={isInvoicePaymentOpen}
        onClose={() => setIsInvoicePaymentOpen(false)}
        title={`Record Payment for ${selectedInvoice?.invoice_no}`}
        size="md"
      >
        {selectedInvoice && (
          <form onSubmit={handleRecordInvoicePayment} className="space-y-4">
            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 text-xs space-y-1">
              <div className="flex justify-between text-blue-900">
                <span>Invoice Total:</span>
                <span className="font-bold">{formatCurrency(selectedInvoice.total)}</span>
              </div>
              <div className="flex justify-between text-blue-900">
                <span>Already Paid:</span>
                <span className="font-semibold">{formatCurrency(selectedInvoice.paid_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-amber-800 font-bold pt-1 border-t border-blue-200">
                <span>Current Balance Due:</span>
                <span>{formatCurrency(Math.max(0, selectedInvoice.total - (selectedInvoice.paid_amount || 0)))}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment Amount (BDT) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                max={Math.max(0, selectedInvoice.total - (selectedInvoice.paid_amount || 0))}
                value={invoicePaymentForm.amount}
                onChange={(e) => setInvoicePaymentForm({ ...invoicePaymentForm, amount: e.target.value })}
                className="input-field font-bold text-emerald-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={invoicePaymentForm.payment_date}
                  onChange={(e) => setInvoicePaymentForm({ ...invoicePaymentForm, payment_date: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Method
                </label>
                <select
                  value={invoicePaymentForm.payment_method}
                  onChange={(e) => setInvoicePaymentForm({ ...invoicePaymentForm, payment_method: e.target.value })}
                  className="input-field"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="mobile_banking">Mobile Banking</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={invoicePaymentForm.notes}
                onChange={(e) => setInvoicePaymentForm({ ...invoicePaymentForm, notes: e.target.value })}
                className="input-field text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsInvoicePaymentOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-sm px-5 py-2"
              >
                {submitting ? 'Recording...' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 7: DELETE CONFIRMATION                             */}
      {/* ======================================================== */}
      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={executeDelete}
        title={`Delete ${deleteTarget?.type === 'payment' ? 'Payment Record' : deleteTarget?.type === 'plan' ? 'Payment Milestone' : 'Invoice'}?`}
        message="This action cannot be undone and will permanently remove this record from financial accounts."
      />
    </div>
  );
}
