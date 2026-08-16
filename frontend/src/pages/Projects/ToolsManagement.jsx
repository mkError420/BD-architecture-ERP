import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toolsAPI } from '../../api';
import { Wrench, Plus } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';

export default function ToolsManagement() {
  const { projectId } = useParams();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);

  const [formData, setFormData] = useState({
    project_id: projectId,
    tool_name: '',
    tool_code: '',
    category: 'equipment',
    status: 'available',
    purchase_date: new Date().toISOString().split('T')[0],
    tool_condition: 'good',
    notes: '',
  });

  useEffect(() => {
    loadTools();
  }, [projectId]);

  const loadTools = async () => {
    setLoading(true);
    try {
      const res = await toolsAPI.getAll({ project_id: projectId, type: 'inventory' });
      if (res.data.success) {
        setTools(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load tools:', err);
      setTools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, type: 'inventory' };
      if (selectedTool) {
        await toolsAPI.update(selectedTool.id, data);
        toast.success('Tool updated successfully!');
      } else {
        await toolsAPI.create(data);
        toast.success('Tool added successfully!');
      }
      setIsModalOpen(false);
      loadTools();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    try {
      await toolsAPI.delete(selectedTool.id, { type: 'inventory' });
      toast.success('Tool deleted');
      setIsDeleteOpen(false);
      loadTools();
    } catch (err) {
      toast.error('Failed to delete tool');
    }
  };

  const columns = [
    { header: 'Tool Code', render: (row) => <span className="font-mono text-xs">{row.tool_code}</span> },
    { header: 'Tool Name', render: (row) => <span className="font-medium">{row.tool_name}</span> },
    { header: 'Category', render: (row) => <span className="capitalize">{row.category}</span> },
    { header: 'Status', render: (row) => <span className="capitalize">{row.status}</span> },
    { header: 'Condition', render: (row) => <span className="capitalize">{row.tool_condition}</span> },
    { header: 'Purchase Date', render: (row) => <span>{row.purchase_date}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #A0975A, #8a824a)' }}>
            <Wrench size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tools Management</h1>
            <p className="text-gray-500 text-sm">Manage tools inventory and assignments</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Add Tool
        </button>
      </div>

      <DataTable columns={columns} data={tools} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Tool" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Tool Name *</label>
              <input type="text" required value={formData.tool_name} onChange={(e) => setFormData({ ...formData, tool_name: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Tool Code</label>
              <input type="text" value={formData.tool_code} onChange={(e) => setFormData({ ...formData, tool_code: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Category</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="form-input">
                <option value="equipment">Equipment</option>
                <option value="hand_tool">Hand Tool</option>
                <option value="power_tool">Power Tool</option>
                <option value="safety_gear">Safety Gear</option>
                <option value="measuring">Measuring</option>
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="form-input">
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="damaged">Damaged</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div>
              <label className="form-label">Condition</label>
              <select value={formData.tool_condition} onChange={(e) => setFormData({ ...formData, tool_condition: e.target.value })} className="form-input">
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="form-label">Purchase Date *</label>
              <input type="date" required value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input"></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Tool</button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Tool" message="Are you sure you want to delete this tool?" />
    </div>
  );
}
