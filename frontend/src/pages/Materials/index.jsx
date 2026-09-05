import { useState, useEffect } from 'react';
import { materialsAPI } from '../../api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import { formatCurrency, MATERIAL_CATEGORIES } from '../../utils/helpers';
import { Plus, Search, Package, AlertTriangle, Edit2, Trash2, Layers, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_MATERIALS = [
  {
    id: 1,
    material_code: 'MAT-001',
    name: 'Bashundhara Portland Composite Cement (PCC)',
    category: 'cement',
    unit: 'bag',
    unit_price: 540,
    min_stock_alert: 100,
    description: '50kg Bag, BDS EN 197-1:2003 standard, suitable for all structural casting'
  },
  {
    id: 2,
    material_code: 'MAT-002',
    name: 'BSRM 500D TMT Rebar (16mm)',
    category: 'steel',
    unit: 'ton',
    unit_price: 98500,
    min_stock_alert: 5,
    description: 'High strength thermo-mechanically treated bar for columns and beams'
  },
  {
    id: 3,
    material_code: 'MAT-003',
    name: 'Sylhet Coarse Sand (FM 2.5)',
    category: 'sand',
    unit: 'cft',
    unit_price: 48,
    min_stock_alert: 500,
    description: 'Screened coarse sand optimal for concrete mix and RCC slab casting'
  },
  {
    id: 4,
    material_code: 'MAT-004',
    name: 'Bholaganj Crushed Stone Chips (3/4" down)',
    category: 'aggregate',
    unit: 'cft',
    unit_price: 115,
    min_stock_alert: 400,
    description: 'Hard granite boulder stone chips for heavy foundation works'
  },
  {
    id: 5,
    material_code: 'MAT-005',
    name: '1st Class Auto Gas-Burn Bricks',
    category: 'bricks',
    unit: 'pcs',
    unit_price: 14.5,
    min_stock_alert: 5000,
    description: 'Uniform red bricks, standard 9.5"x4.5"x2.75", crushing strength > 2000 psi'
  },
  {
    id: 6,
    material_code: 'MAT-006',
    name: 'Berger WeatherCoat Smooth Luxury Exterior',
    category: 'finishing',
    unit: 'liter',
    unit_price: 420,
    min_stock_alert: 30,
    description: 'High performance antifungal exterior acrylic emulsion'
  }
];

export default function Materials() {
  const [materials, setMaterials] = useState(DEMO_MATERIALS);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: DEMO_MATERIALS.length, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'cement',
    unit: 'bag',
    unit_price: '',
    min_stock_alert: '',
    description: '',
  });

  useEffect(() => {
    loadMaterials();
  }, [pagination.page, categoryFilter]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const res = await materialsAPI.getAll({
        page: pagination.page,
        per_page: pagination.per_page,
        search,
        category: categoryFilter,
      });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setMaterials(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      } else {
        const filtered = categoryFilter
          ? DEMO_MATERIALS.filter(m => m.category === categoryFilter)
          : DEMO_MATERIALS;
        setMaterials(filtered);
        setPagination({ page: 1, per_page: 10, total: filtered.length, total_pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load materials:', err);
      const filtered = categoryFilter
        ? DEMO_MATERIALS.filter(m => m.category === categoryFilter)
        : DEMO_MATERIALS;
      setMaterials(filtered);
      setPagination({ page: 1, per_page: 10, total: filtered.length, total_pages: 1 });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) {
      setMaterials(DEMO_MATERIALS);
      return;
    }
    const q = search.toLowerCase();
    const filtered = DEMO_MATERIALS.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.material_code.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
    setMaterials(filtered);
  };

  const openCreateModal = () => {
    setSelectedMaterial(null);
    setFormData({
      name: '',
      category: 'cement',
      unit: 'bag',
      unit_price: '',
      min_stock_alert: '',
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (mat) => {
    setSelectedMaterial(mat);
    setFormData({
      name: mat.name || '',
      category: mat.category || 'cement',
      unit: mat.unit || 'bag',
      unit_price: mat.unit_price || '',
      min_stock_alert: mat.min_stock_alert || '',
      description: mat.description || '',
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (mat) => {
    setSelectedMaterial(mat);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedMaterial) {
        await materialsAPI.update(selectedMaterial.id, formData);
        toast.success('Material catalog item updated!');
      } else {
        await materialsAPI.create(formData);
        toast.success('Material added to catalog!');
      }
      setIsModalOpen(false);
      loadMaterials();
    } catch (err) {
      console.warn('API error or demo mode fallback:', err);
      if (selectedMaterial) {
        setMaterials(prev => prev.map(m => m.id === selectedMaterial.id ? { ...m, ...formData, unit_price: Number(formData.unit_price) } : m));
        toast.success('Material item updated (Demo)!');
      } else {
        const newMat = {
          id: Date.now(),
          material_code: `MAT-00${materials.length + 1}`,
          ...formData,
          unit_price: Number(formData.unit_price),
          min_stock_alert: Number(formData.min_stock_alert || 0)
        };
        setMaterials(prev => [newMat, ...prev]);
        toast.success('Material item added to catalog (Demo)!');
      }
      setIsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    try {
      await materialsAPI.delete(selectedMaterial.id);
      toast.success('Material deleted');
      setIsDeleteOpen(false);
      loadMaterials();
    } catch (err) {
      console.warn('API delete or demo fallback:', err);
      setMaterials(prev => prev.filter(m => m.id !== selectedMaterial.id));
      toast.success('Material removed from catalog (Demo)');
      setIsDeleteOpen(false);
    }
  };

  const getCategoryLabel = (cat) => {
    const c = MATERIAL_CATEGORIES.find(item => item.value === cat);
    return c ? c.label : cat;
  };

  const columns = [
    {
      header: 'Code & Material Name',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded font-semibold">{row.material_code}</span>
            <span className="font-bold text-gray-900">{row.name}</span>
          </div>
          {row.description && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">{row.description}</div>}
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
      header: 'Unit',
      render: (row) => (
        <span className="text-xs font-mono uppercase bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-gray-700">
          {row.unit}
        </span>
      ),
    },
    {
      header: 'Unit Price (BDT)',
      render: (row) => (
        <span className="font-bold text-gray-900">{formatCurrency(row.unit_price)}</span>
      ),
    },
    {
      header: 'Min Alert Threshold',
      render: (row) => (
        <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
          {row.min_stock_alert || 0} {row.unit}
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
          <h1 className="text-2xl font-bold text-gray-900">Materials & Construction Supplies</h1>
          <p className="text-gray-500 text-sm mt-1">Catalog of cement, rod, bricks, aggregates, sand, and finishes</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={18} /> Add Material
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
            <Package size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Catalog Items</span>
            <p className="text-xl font-bold text-gray-900">{materials.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Structural Supplies</span>
            <p className="text-xl font-bold text-gray-900">
              {materials.filter(m => ['cement', 'steel', 'aggregate', 'bricks'].includes(m.category)).length} Items
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Alert Thresholds</span>
            <p className="text-xl font-bold text-gray-900">
              {materials.filter(m => Number(m.min_stock_alert) > 0).length} Monitored
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle size={22} />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Categories Active</span>
            <p className="text-xl font-bold text-gray-900">
              {new Set(materials.map(m => m.category)).size} Active
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex-1 w-full md:w-auto relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search material by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10"
          />
        </form>
        <div className="w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-input text-xs w-full md:w-56"
          >
            <option value="">All Categories (সকল ক্যাটাগরি)</option>
            {MATERIAL_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={materials}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(p => ({ ...p, page }))}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedMaterial ? 'Edit Material Item' : 'New Material Definition'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Material Name (আইটেমের নাম) *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Shah Cement Special / BSRM 16mm Rod"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Category (ক্যাটাগরি) *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-input"
              >
                {MATERIAL_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Unit of Measure (একক) *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="form-input"
              >
                <option value="bag">Bag (বস্তা - 50kg)</option>
                <option value="ton">Ton (টন / মেট্রিক টন)</option>
                <option value="cft">Cft (ঘনফুট / সিএফটি)</option>
                <option value="piece">Piece (পিস / সংখ্যা)</option>
                <option value="sft">Sft (বর্গফুট / স্কয়ার ফিট)</option>
                <option value="kg">Kg (কেজি / কিলোগ্রাম)</option>
                <option value="bundle">Bundle (বান্ডিল)</option>
                <option value="drum">Drum (ড্রাম)</option>
                <option value="litre">Litre (লিটার)</option>
                <option value="roll">Roll (রোল)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Standard Unit Price (BDT / ৳)</label>
              <input
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                placeholder="e.g. 540"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Low Stock Alert Threshold</label>
              <input
                type="number"
                value={formData.min_stock_alert}
                onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                placeholder="e.g. 100"
                className="form-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Specification & Brand Details</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brand name, testing certificates, ASTM / BSTI standards, delivery conditions..."
                className="form-input"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {selectedMaterial ? 'Save Changes' : 'Save Material'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Material"
        message={`Are you sure you want to remove "${selectedMaterial?.name}" from material master catalog?`}
      />
    </div>
  );
}
