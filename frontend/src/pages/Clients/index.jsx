import { useState, useEffect } from 'react';
import { clientsAPI } from '../../api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import { BD_DIVISIONS, BD_DISTRICTS } from '../../utils/helpers';
import { Plus, Search, Phone, Mail, Building, User, MapPin, Eye, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    nid: '',
    address: '',
    district: 'Dhaka',
    division: 'Dhaka',
    client_type: 'individual',
    notes: '',
  });

  useEffect(() => {
    loadClients();
  }, [pagination.page]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const res = await clientsAPI.getAll({
        page: pagination.page,
        per_page: pagination.per_page,
        search,
      });
      if (res.data.success) {
        setClients(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    loadClients();
  };

  const openCreateModal = () => {
    setSelectedClient(null);
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      nid: '',
      address: '',
      district: 'Dhaka',
      division: 'Dhaka',
      client_type: 'individual',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name || '',
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      nid: client.nid || '',
      address: client.address || '',
      district: client.district || 'Dhaka',
      division: client.division || 'Dhaka',
      client_type: client.client_type || 'individual',
      notes: client.notes || '',
    });
    setIsModalOpen(true);
  };

  const openViewModal = (client) => {
    setSelectedClient(client);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (client) => {
    setSelectedClient(client);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedClient) {
        await clientsAPI.update(selectedClient.id, formData);
        toast.success('Client updated successfully!');
      } else {
        await clientsAPI.create(formData);
        toast.success('Client registered successfully!');
      }
      setIsModalOpen(false);
      loadClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    try {
      await clientsAPI.delete(selectedClient.id);
      toast.success('Client removed');
      setIsDeleteOpen(false);
      loadClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      header: 'Client Name & Info',
      render: (row) => (
        <div>
          <div className="font-bold text-gray-900 flex items-center gap-2">
            {row.name}
            {row.client_type === 'government' && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Govt</span>
            )}
            {row.client_type === 'corporate' && (
              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">Corporate</span>
            )}
          </div>
          {row.company && <div className="text-xs text-gray-500">{row.company}</div>}
        </div>
      ),
    },
    {
      header: 'Contact Information',
      render: (row) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-gray-700 font-medium">
            <Phone size={13} className="text-gray-400" /> {row.phone}
          </div>
          {row.email && (
            <div className="flex items-center gap-1.5 text-gray-500">
              <Mail size={13} className="text-gray-400" /> {row.email}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Location / Address',
      render: (row) => (
        <div className="text-xs text-gray-600">
          <div className="font-medium text-gray-800">{row.district || 'Dhaka'}</div>
          <div className="text-gray-400 truncate max-w-[200px]">{row.address || '—'}</div>
        </div>
      ),
    },
    {
      header: 'NID Number',
      render: (row) => (
        <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
          {row.nid || 'N/A'}
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
          <h1 className="text-2xl font-bold text-gray-900">Client Directory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage project landowners, corporate partners, and institutional clients</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={18} /> Add Client
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client name, company, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10"
          />
        </form>
      </div>

      <DataTable
        columns={columns}
        data={clients}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(p => ({ ...p, page }))}
        onRowClick={openViewModal}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedClient ? 'Edit Client Profile' : 'Register New Client'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Client / Contact Name *</label>
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
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@domain.com"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Company / Organization</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Apex Property Holdings"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Client Type</label>
              <select
                value={formData.client_type}
                onChange={(e) => setFormData({ ...formData, client_type: e.target.value })}
                className="form-input"
              >
                <option value="individual">Individual (ব্যক্তিগত)</option>
                <option value="corporate">Corporate (প্রাতিষ্ঠানিক)</option>
                <option value="government">Government (সরকারি)</option>
              </select>
            </div>

            <div>
              <label className="form-label">National ID (NID / Smart Card)</label>
              <input
                type="text"
                value={formData.nid}
                onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
                placeholder="10 or 17 digit NID number"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">District</label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="form-input"
              >
                {BD_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label">Division</label>
              <select
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                className="form-input"
              >
                {BD_DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Full Address / Location</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="House/Plot, Road, Thana/Area"
                className="form-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Additional Notes</label>
              <textarea
                rows="2"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Special agreements, contact preferences, payment history notes..."
                className="form-input"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {selectedClient ? 'Save Changes' : 'Save Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Client Information"
        size="md"
      >
        {selectedClient && (
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl text-white flex items-center justify-center font-bold text-xl" style={{ background: 'linear-gradient(to bottom right, #A0975A, #8a824a)' }}>
                {selectedClient.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedClient.name}</h3>
                <p className="text-xs text-gray-500">{selectedClient.company || 'Private Landowner / Individual'}</p>
                <span className="inline-block mt-1 text-[11px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium capitalize">
                  {selectedClient.client_type}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">Phone Number:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedClient.phone}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">Email Address:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedClient.email || '—'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">NID Number:</span>
                <p className="font-semibold text-gray-800 mt-0.5 font-mono">{selectedClient.nid || '—'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500">District & Division:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedClient.district || 'Dhaka'}, {selectedClient.division || 'Dhaka'}</p>
              </div>
            </div>

            {selectedClient.address && (
              <div className="p-3 bg-gray-50 rounded-xl text-xs">
                <span className="text-gray-500">Full Address:</span>
                <p className="font-medium text-gray-800 mt-0.5">{selectedClient.address}</p>
              </div>
            )}

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
        title="Remove Client"
        message={`Are you sure you want to deactivate client profile for "${selectedClient?.name}"?`}
      />
    </div>
  );
}
