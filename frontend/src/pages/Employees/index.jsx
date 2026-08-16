import { useState, useEffect } from 'react';
import { employeesAPI } from '../../api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import { formatCurrency, formatDate, EMPLOYEE_ROLES, BD_DISTRICTS } from '../../utils/helpers';
import { Plus, Search, HardHat, Phone, CreditCard, ShieldAlert, Eye, Edit2, Trash2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    phone: '',
    email: '',
    nid: '',
    address: '',
    district: 'Dhaka',
    division: 'Dhaka',
    role: 'helper',
    department: 'Site Operations',
    join_date: new Date().toISOString().split('T')[0],
    salary_type: 'monthly',
    salary: '',
    blood_group: 'A+',
    emergency_contact: '',
    bank_account: '',
    bank_name: 'bKash / Nagad',
  });

  useEffect(() => {
    loadEmployees();
  }, [pagination.page, roleFilter]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res = await employeesAPI.getAll({
        page: pagination.page,
        per_page: pagination.per_page,
        search,
        role: roleFilter,
      });
      if (res.data.success) {
        setEmployees(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    loadEmployees();
  };

  const openCreateModal = () => {
    setSelectedEmployee(null);
    setFormData({
      name: '',
      father_name: '',
      phone: '',
      email: '',
      nid: '',
      address: '',
      district: 'Dhaka',
      division: 'Dhaka',
      role: 'helper',
      department: 'Site Operations',
      join_date: new Date().toISOString().split('T')[0],
      salary_type: 'monthly',
      salary: '',
      blood_group: 'A+',
      emergency_contact: '',
      bank_account: '',
      bank_name: 'bKash / Nagad',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      name: emp.name || '',
      father_name: emp.father_name || '',
      phone: emp.phone || '',
      email: emp.email || '',
      nid: emp.nid || '',
      address: emp.address || '',
      district: emp.district || 'Dhaka',
      division: emp.division || 'Dhaka',
      role: emp.role || 'helper',
      department: emp.department || 'Site Operations',
      join_date: emp.join_date || '',
      salary_type: emp.salary_type || 'monthly',
      salary: emp.salary || '',
      blood_group: emp.blood_group || 'A+',
      emergency_contact: emp.emergency_contact || '',
      bank_account: emp.bank_account || '',
      bank_name: emp.bank_name || 'bKash / Nagad',
    });
    setIsModalOpen(true);
  };

  const openViewModal = (emp) => {
    setSelectedEmployee(emp);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (emp) => {
    setSelectedEmployee(emp);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedEmployee) {
        await employeesAPI.update(selectedEmployee.id, formData);
        toast.success('Worker details updated!');
      } else {
        await employeesAPI.create(formData);
        toast.success('Worker enrolled successfully!');
      }
      setIsModalOpen(false);
      loadEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await employeesAPI.delete(selectedEmployee.id);
      toast.success('Worker record archived');
      setIsDeleteOpen(false);
      loadEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Archive failed');
    }
  };

  const getRoleLabel = (role) => {
    const r = EMPLOYEE_ROLES.find(item => item.value === role);
    return r ? r.label : role;
  };

  const columns = [
    {
      header: 'Worker / Engineer',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded font-semibold">{row.employee_code}</span>
            <span className="font-bold text-gray-900">{row.name}</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{getRoleLabel(row.role)}</div>
        </div>
      ),
    },
    {
      header: 'Contact & Blood',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="text-gray-800 font-medium">{row.phone}</div>
          <div className="flex items-center gap-2 text-gray-400">
            <span>District: {row.district || 'Dhaka'}</span>
            {row.blood_group && (
              <span className="bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded text-[10px]">
                {row.blood_group}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Wage / Salary',
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{formatCurrency(row.salary)}</div>
          <span className="text-[11px] text-gray-400 capitalize">/ {row.salary_type}</span>
        </div>
      ),
    },
    {
      header: 'NID / Smart Card',
      render: (row) => (
        <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
          {row.nid || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Enrolled Date',
      render: (row) => (
        <span className="text-xs text-gray-600">{formatDate(row.join_date)}</span>
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
          >
            <Eye size={16} />
          </button>
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
          <h1 className="text-2xl font-bold text-gray-900">Workers & Engineers Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage masons, rod binders, site helpers, supervisors, and site engineers</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={18} /> Enroll Worker
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex-1 w-full md:w-auto relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by worker name, code, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10"
          />
        </form>
        <div className="w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="form-input text-xs w-full md:w-56"
          >
            <option value="">All Roles (সকল পদবী)</option>
            {EMPLOYEE_ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(p => ({ ...p, page }))}
        onRowClick={openViewModal}
      />

      {/* Modal Enroll / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedEmployee ? 'Edit Employee Details' : 'Enroll Worker / Staff'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Full Name (সম্পূর্ণ নাম) *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Md. Kabir Hossain"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Father's Name (পিতার নাম)</label>
              <input
                type="text"
                value={formData.father_name}
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                placeholder="Father's full name"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+880 1XXXXXXXXX"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Trade / Role (কাজের ধরন) *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="form-input"
              >
                {EMPLOYEE_ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Wage Type</label>
              <select
                value={formData.salary_type}
                onChange={(e) => setFormData({ ...formData, salary_type: e.target.value })}
                className="form-input"
              >
                <option value="daily">Daily Wage (দৈনিক মজুরি)</option>
                <option value="monthly">Monthly Salary (মাসিক বেতন)</option>
                <option value="weekly">Weekly (সাপ্তাহিক)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Rate / Salary (BDT / ৳) *</label>
              <input
                type="number"
                required
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="e.g. 850 or 35000"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">National ID (NID)</label>
              <input
                type="text"
                value={formData.nid}
                onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
                placeholder="NID card number"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Blood Group</label>
              <select
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                className="form-input"
              >
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Home District</label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="form-input"
              >
                {BD_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label">Join Date</label>
              <input
                type="date"
                value={formData.join_date}
                onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Emergency Phone</label>
              <input
                type="text"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                placeholder="Family/Relative contact"
                className="form-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Payment Account / Mobile Banking (bKash/Nagad/Bank)</label>
              <input
                type="text"
                value={formData.bank_account}
                onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                placeholder="bKash/Nagad No. or Bank Account No."
                className="form-input"
              />
            </div>

            <div className="md:col-span-3">
              <label className="form-label">Village / Permanent Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Village, Post Office, Thana, District"
                className="form-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {selectedEmployee ? 'Update Record' : 'Enroll Worker'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Worker & Employee Card"
        size="md"
      >
        {selectedEmployee && (
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center font-bold text-xl text-white shadow-md">
                  <HardHat size={28} />
                </div>
                <div>
                  <span className="font-mono text-xs bg-gray-700 text-amber-300 px-2 py-0.5 rounded">
                    {selectedEmployee.employee_code}
                  </span>
                  <h3 className="text-lg font-bold mt-1">{selectedEmployee.name}</h3>
                  <p className="text-xs text-gray-300">{getRoleLabel(selectedEmployee.role)}</p>
                </div>
              </div>
              {selectedEmployee.blood_group && (
                <div className="bg-red-500/20 text-red-300 border border-red-500/40 px-3 py-1 rounded-xl text-center">
                  <span className="text-[10px] uppercase block text-red-400">Blood</span>
                  <span className="font-extrabold text-sm">{selectedEmployee.blood_group}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">Phone Number:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedEmployee.phone}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">Agreed Wage / Salary:</span>
                <p className="font-semibold text-emerald-600 mt-0.5 text-sm">{formatCurrency(selectedEmployee.salary)} / {selectedEmployee.salary_type}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">NID Number:</span>
                <p className="font-semibold text-gray-800 mt-0.5 font-mono">{selectedEmployee.nid || '—'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">Father's Name:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedEmployee.father_name || '—'}</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
              <div><span className="text-gray-500">Payment Account:</span> <span className="font-medium text-gray-800">{selectedEmployee.bank_account || 'Cash in hand'}</span></div>
              <div><span className="text-gray-500">Home District & Address:</span> <span className="font-medium text-gray-800">{selectedEmployee.address || selectedEmployee.district || 'Dhaka'}</span></div>
              <div><span className="text-gray-500">Enrolled Since:</span> <span className="font-medium text-gray-800">{formatDate(selectedEmployee.join_date)}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setIsViewModalOpen(false)} className="btn-secondary">
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
        title="Archive Employee"
        message={`Are you sure you want to deactivate and archive record for "${selectedEmployee?.name}"?`}
      />
    </div>
  );
}
