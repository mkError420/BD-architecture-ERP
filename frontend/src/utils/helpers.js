// Format BDT currency
export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return '৳' + num.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// Format date
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Status badge class
export const getStatusClass = (status) => {
  const map = {
    planning: 'badge-planning',
    active: 'badge-active',
    on_hold: 'badge-on_hold',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    pending: 'badge-pending',
    in_progress: 'badge-in_progress',
    paid: 'badge-paid',
    overdue: 'badge-overdue',
    present: 'badge-active',
    absent: 'badge-cancelled',
    half_day: 'badge-on_hold',
    draft: 'badge-planning',
    sent: 'badge-active',
    partially_paid: 'badge-on_hold',
  };
  return map[status] || 'badge-planning';
};

// Format status label
export const formatStatus = (status) => {
  if (!status) return '';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

// Bangladesh divisions
export const BD_DIVISIONS = ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'];

// Bangladesh districts (common ones)
export const BD_DISTRICTS = [
  'Dhaka', 'Gazipur', 'Narayanganj', 'Chittagong', 'Comilla', 'Cox\'s Bazar',
  'Rajshahi', 'Rangpur', 'Sylhet', 'Khulna', 'Barishal', 'Mymensingh',
  'Jessore', 'Bogra', 'Dinajpur', 'Faridpur', 'Tangail', 'Narsingdi',
  'Manikganj', 'Munshiganj', 'Savar', 'Tongi', 'Keraniganj',
];

// Project types
export const PROJECT_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'renovation', label: 'Renovation' },
];

// Employee roles
export const EMPLOYEE_ROLES = [
  { value: 'engineer', label: 'Engineer' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'mason', label: 'Mason (রাজমিস্ত্রি)' },
  { value: 'rod_binder', label: 'Rod Binder (রডবাইন্ডার)' },
  { value: 'helper', label: 'Helper (হেলপার)' },
  { value: 'electrician', label: 'Electrician (ইলেকট্রিশিয়ান)' },
  { value: 'plumber', label: 'Plumber (প্লাম্বার)' },
  { value: 'painter', label: 'Painter (রং মিস্ত্রি)' },
  { value: 'driver', label: 'Driver' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
];

// Material categories
export const MATERIAL_CATEGORIES = [
  { value: 'cement', label: 'Cement (সিমেন্ট)' },
  { value: 'sand', label: 'Sand (বালু)' },
  { value: 'brick', label: 'Brick (ইট)' },
  { value: 'rod_steel', label: 'Rod / Steel (রড)' },
  { value: 'aggregate', label: 'Aggregate (খোয়া)' },
  { value: 'paint', label: 'Paint (রং)' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'wood', label: 'Wood (কাঠ)' },
  { value: 'glass', label: 'Glass (কাচ)' },
  { value: 'tile', label: 'Tiles (টাইলস)' },
  { value: 'waterproofing', label: 'Waterproofing' },
  { value: 'other', label: 'Other' },
];

// Expense categories
export const EXPENSE_CATEGORIES = [
  { value: 'material', label: 'Material Purchase' },
  { value: 'labor', label: 'Labor Cost' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'transport', label: 'Transport' },
  { value: 'utility', label: 'Utility' },
  { value: 'professional_fee', label: 'Professional Fee' },
  { value: 'permit', label: 'Permit / License' },
  { value: 'other', label: 'Other' },
];

// Work order categories
export const WO_CATEGORIES = [
  { value: 'foundation', label: 'Foundation (ভিত্তি)' },
  { value: 'structure', label: 'Structure (কাঠামো)' },
  { value: 'masonry', label: 'Masonry (গাঁথুনি)' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'roofing', label: 'Roofing (ছাদ)' },
  { value: 'flooring', label: 'Flooring (মেঝে)' },
  { value: 'painting', label: 'Painting (রং)' },
  { value: 'other', label: 'Other' },
];

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'mobile_banking', label: 'Mobile Banking (bKash/Nagad)' },
];
