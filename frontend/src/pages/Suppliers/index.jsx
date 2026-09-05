import { useState, useEffect } from 'react';
import { suppliersAPI } from '../../api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import { BD_DISTRICTS } from '../../utils/helpers';
import { Plus, Search, Truck, Phone, Mail, Building, MapPin, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_SUPPLIERS = [
  {
    id: 1,
    name: 'Md. Anwar Hossain',
    company: 'Bashundhara Industrial Complex Ltd',
    phone: '+880 1713-445566',
    email: 'cement.sales@bashundharagroup.com',
    address: 'Plot 3, Block G, Umme Kulsum Road, Bashundhara R/A',
    district: 'Dhaka',
    trade_license: 'TRAD/DNCC/012984/2021',
    product_categories: 'Portland Composite Cement, OPC',
    payment_terms: '30 Days Net Credit'
  },
  {
    id: 2,
    name: 'Kamrul Hasan Chowdhury',
    company: 'BSRM Steels Limited',
    phone: '+880 1819-223388',
    email: 'corporate.sales@bsrm.com',
    address: 'Ali Mansion, 1207/1099 Sadarghat Road',
    district: 'Chittagong',
    trade_license: 'TRAD/CCC/044512/2019',
    product_categories: '500D TMT Bar, Deformed Rebar (8mm-32mm)',
    payment_terms: '15 Days Credit / LC'
  },
  {
    id: 3,
    name: 'Al-Haj Sirajul Islam',
    company: 'Surma River Stone & Sand Traders',
    phone: '+880 1712-998877',
    email: 'surma.materials@gmail.com',
    address: 'Bholaganj Ghat, Companiganj',
    district: 'Sylhet',
    trade_license: 'TRAD/SYL/098765/2022',
    product_categories: 'Bholaganj Stone Chips, Sylhet Balu (FM 2.5)',
    payment_terms: 'Cash on Delivery (COD)'
  },
  {
    id: 4,
    name: 'Engr. Shafiul Alam',
    company: 'Mir Ceramic & Sanitary Ware',
    phone: '+880 1911-334422',
    email: 'info@mirceramic.com',
    address: 'Mirpur Road, Kalyanpur',
    district: 'Dhaka',
    trade_license: 'TRAD/DNCC/087612/2020',
    product_categories: 'Vitrified Tiles, Wall Tiles, Sanitary Fixtures',
    payment_terms: '50% Advance, 50% on Delivery'
  },
  {
    id: 5,
    name: 'Zahidul Haque',
    company: 'National Polymer Industries PLC',
    phone: '+880 1714-556677',
    email: 'sales@npoly.com',
    address: 'Tejgaon Industrial Area',
    district: 'Dhaka',
    trade_license: 'TRAD/DNCC/054321/2018',
    product_categories: 'uPVC Pipes, Fittings, Water Tanks, CPVC',
    payment_terms: 'Cash on Delivery (COD)'
  }
];

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState(DEMO_SUPPLIERS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    district: 'Dhaka',
    trade_license: '',
    product_categories: '',
    payment_terms: 'Cash on Delivery (COD)',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await suppliersAPI.getAll({ search });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setSuppliers(res.data.data);
      } else {
        setSuppliers(DEMO_SUPPLIERS);
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err);
      setSuppliers(DEMO_SUPPLIERS);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) {
      setSuppliers(DEMO_SUPPLIERS);
      return;
    }
    const q = search.toLowerCase();
    const filtered = DEMO_SUPPLIERS.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.company && s.company.toLowerCase().includes(q)) ||
      (s.product_categories && s.product_categories.toLowerCase().includes(q))
    );
    setSuppliers(filtered);
  };

  const openCreateModal = () => {
    setSelectedSupplier(null);
    setFormData({
      name: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      district: 'Dhaka',
      trade_license: '',
      product_categories: '',
      payment_terms: 'Cash on Delivery (COD)',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sup) => {
    setSelectedSupplier(sup);
    setFormData({
      name: sup.name || '',
      company: sup.company || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      district: sup.district || 'Dhaka',
      trade_license: sup.trade_license || '',
      product_categories: sup.product_categories || '',
      payment_terms: sup.payment_terms || 'Cash on Delivery (COD)',
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (sup) => {
    setSelectedSupplier(sup);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedSupplier) {
        await suppliersAPI.update(selectedSupplier.id, formData);
        toast.success('Supplier details updated!');
      } else {
        await suppliersAPI.create(formData);
        toast.success('Supplier registered successfully!');
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err) {
      console.warn('API error or demo fallback:', err);
      if (selectedSupplier) {
        setSuppliers(prev => prev.map(s => s.id === selectedSupplier.id ? { ...s, ...formData } : s));
        toast.success('Supplier updated (Demo)!');
      } else {
        const newSup = {
          id: Date.now(),
          ...formData,
        };
        setSuppliers(prev => [newSup, ...prev]);
        toast.success('Supplier registered (Demo)!');
      }
      setIsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    try {
      await suppliersAPI.delete(selectedSupplier.id);
      toast.success('Supplier removed');
      setIsDeleteOpen(false);
      loadSuppliers();
    } catch (err) {
      console.warn('API delete or demo fallback:', err);
      setSuppliers(prev => prev.filter(s => s.id !== selectedSupplier.id));
      toast.success('Supplier removed (Demo)');
      setIsDeleteOpen(false);
    }
  };

  const columns = [
    {
      header: 'Supplier & Company',
      render: (row) => (
        <div>
          <div className="font-bold text-gray-900">{row.name}</div>
          <div className="text-xs text-primary-700 font-semibold">{row.company || '—'}</div>
        </div>
      ),
    },
    {
      header: 'Supplied Categories',
      render: (row) => (
        <span className="text-xs font-medium text-gray-700 bg-gray-50 border border-gray-100 px-2 py-1 rounded">
          {row.product_categories || 'General Construction Materials'}
        </span>
      ),
    },
    {
      header: 'Contact Details',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1 font-medium text-gray-800">
            <Phone size={12} className="text-gray-400" /> {row.phone}
          </div>
          {row.email && (
            <div className="flex items-center gap-1 text-gray-400">
              <Mail size={12} /> {row.email}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Trade License & Terms',
      render: (row) => (
        <div className="text-xs">
          <div className="font-mono text-gray-600">{row.trade_license || 'No Trade Lic.'}</div>
          <div className="text-emerald-700 font-medium">{row.payment_terms}</div>
        </div>
      ),
    },
    {
      header: 'District',
      render: (row) => (
        <span className="text-xs text-gray-600">{row.district || 'Dhaka'}</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Vendors & Material Suppliers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage vendor contacts, trade licenses, payment terms, and procurement channels</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
            <Truck size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Registered Vendors</span>
            <p className="text-xl font-bold text-gray-900">{suppliers.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Building size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Corporate Mills</span>
            <p className="text-xl font-bold text-gray-900">
              {suppliers.filter(s => s.company?.toLowerCase().includes('ltd') || s.company?.toLowerCase().includes('plc') || s.company?.toLowerCase().includes('limited')).length} Partners
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Edit2 size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Credit Lines</span>
            <p className="text-xl font-bold text-gray-900">
              {suppliers.filter(s => s.payment_terms?.toLowerCase().includes('credit') || s.payment_terms?.toLowerCase().includes('lc')).length} Approved
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <MapPin size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Supply Coverage</span>
            <p className="text-xl font-bold text-gray-900">
              {new Set(suppliers.map(s => s.district)).size} Districts
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search suppliers by name, company, or supplied product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10"
          />
        </form>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        loading={loading}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSupplier ? 'Edit Supplier' : 'Register New Vendor'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Contact Person Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Haji Rafiq Uddin"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Business / Enterprise Name</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Rafiq Steel & Cement"
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
                placeholder="vendor@domain.com"
                className="form-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Products / Materials Supplied</label>
              <input
                type="text"
                value={formData.product_categories}
                onChange={(e) => setFormData({ ...formData, product_categories: e.target.value })}
                placeholder="e.g. 500W Rod, Shah Cement, Stone Chips, Bricks"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Trade License No.</label>
              <input
                type="text"
                value={formData.trade_license}
                onChange={(e) => setFormData({ ...formData, trade_license: e.target.value })}
                placeholder="TRAD/DCC/XXXXXX"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Payment Terms</label>
              <input
                type="text"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                placeholder="e.g. 15 Days Credit / COD"
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

            <div className="sm:col-span-2">
              <label className="form-label">Warehouse / Godown Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Godown / Store location"
                className="form-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {selectedSupplier ? 'Save Changes' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message={`Are you sure you want to remove vendor "${selectedSupplier?.name}"?`}
      />
    </div>
  );
}
