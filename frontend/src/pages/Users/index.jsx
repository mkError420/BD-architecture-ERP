import { useState, useEffect } from 'react';
import { usersAPI } from '../../api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import { formatDate } from '../../utils/helpers';
import { Plus, Search, UserCog, Shield, Phone, Mail, Edit2, Trash2, CheckCircle2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'engineer',
    phone: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll();
      if (res.data.success) setUsers(res.data.data);
    } catch {
      setUsers([
        { id: 1, name: 'System Administrator', email: 'admin@construction.com', role: 'admin', phone: '+880 1700-000000', is_active: 1, created_at: '2025-01-01' },
        { id: 2, name: 'Engr. Tareq Mahmud', email: 'tareq.pm@construction.com', role: 'project_manager', phone: '+880 1711-223344', is_active: 1, created_at: '2025-02-01' },
        { id: 3, name: 'Md. Kamrul Hasan', email: 'kamrul.eng@construction.com', role: 'engineer', phone: '+880 1812-334455', is_active: 1, created_at: '2025-03-01' },
        { id: 4, name: 'Farhana Akter', email: 'accounts@construction.com', role: 'accountant', phone: '+880 1913-445566', is_active: 1, created_at: '2025-03-15' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'engineer',
      phone: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'engineer',
      phone: u.phone || '',
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (u) => {
    setSelectedUser(u);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await usersAPI.update(selectedUser.id, formData);
        toast.success('User updated successfully!');
      } else {
        await usersAPI.create(formData);
        toast.success('User created successfully!');
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await usersAPI.delete(selectedUser.id);
      toast.success('User deactivated');
      setIsDeleteOpen(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const getRoleBadge = (role) => {
    const map = {
      admin: { label: 'Admin', bg: 'bg-red-100 text-red-800' },
      project_manager: { label: 'Project Manager', bg: 'bg-blue-100 text-blue-800' },
      engineer: { label: 'Site Engineer', bg: 'bg-emerald-100 text-emerald-800' },
      accountant: { label: 'Accountant', bg: 'bg-purple-100 text-purple-800' },
      site_supervisor: { label: 'Site Supervisor', bg: 'bg-amber-100 text-amber-800' },
    };
    const r = map[role] || { label: role, bg: 'bg-gray-100 text-gray-800' };
    return <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${r.bg}`}>{r.label}</span>;
  };

  const columns = [
    {
      header: 'Staff Name & Role',
      render: (row) => (
        <div>
          <div className="font-bold text-gray-900">{row.name}</div>
          <div className="mt-1">{getRoleBadge(row.role)}</div>
        </div>
      ),
    },
    {
      header: 'Email & Login ID',
      render: (row) => (
        <div className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
          <Mail size={13} className="text-gray-400" /> {row.email}
        </div>
      ),
    },
    {
      header: 'Contact Phone',
      render: (row) => (
        <div className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
          <Phone size={13} className="text-gray-400" /> {row.phone || '—'}
        </div>
      ),
    },
    {
      header: 'Account Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${row.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          <CheckCircle2 size={12} /> {row.is_active ? 'Active' : 'Inactive'}
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
          {row.role !== 'admin' && (
            <button
              onClick={() => openDeleteModal(row)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Access & Role Permissions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage system administrators, project managers, site engineers, and accountants</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={18} /> Add System User
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? 'Edit User Credentials' : 'Create New System User'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Engr. Tanvir Ahmed"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Email Address (Login Username) *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@construction.com"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">{selectedUser ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
            <input
              type="password"
              required={!selectedUser}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">System Role / Permissions *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="form-input"
            >
              <option value="admin">Administrator (Full Access)</option>
              <option value="project_manager">Project Manager (Site + Planning)</option>
              <option value="engineer">Site Engineer (Work Orders & Attendance)</option>
              <option value="accountant">Accountant (Expenses, Invoices, Salary)</option>
              <option value="site_supervisor">Site Supervisor</option>
            </select>
          </div>

          <div>
            <label className="form-label">Official Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+880 1XXXXXXXXX"
              className="form-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {selectedUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Deactivate Account"
        message={`Are you sure you want to revoke system access for "${selectedUser?.name}"?`}
      />
    </div>
  );
}
