import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { vehiclesAPI } from '../../api';
import { Truck, Plus } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';

export default function VehicleWorkSlips() {
  const { projectId } = useParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [formData, setFormData] = useState({
    project_id: projectId,
    vehicle_number: '',
    vehicle_type: 'truck',
    driver_name: '',
    work_date: new Date().toISOString().split('T')[0],
    work_hours: '',
    hourly_rate: '',
    fuel_cost: 0,
    total_amount: '',
    notes: '',
  });

  useEffect(() => {
    loadVehicles();
  }, [projectId]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await vehiclesAPI.getAll({ project_id: projectId, type: 'work_slips' });
      if (res.data.success) {
        setVehicles(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load vehicles:', err);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, type: 'work_slips' };
      if (selectedVehicle) {
        await vehiclesAPI.update(selectedVehicle.id, data);
        toast.success('Work slip updated successfully!');
      } else {
        await vehiclesAPI.create(data);
        toast.success('Work slip created successfully!');
      }
      setIsModalOpen(false);
      loadVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    try {
      await vehiclesAPI.delete(selectedVehicle.id, { type: 'work_slips' });
      toast.success('Work slip deleted');
      setIsDeleteOpen(false);
      loadVehicles();
    } catch (err) {
      toast.error('Failed to delete work slip');
    }
  };

  const columns = [
    { header: 'Vehicle Number', render: (row) => <span className="font-mono text-xs">{row.vehicle_number}</span> },
    { header: 'Type', render: (row) => <span className="capitalize">{row.vehicle_type}</span> },
    { header: 'Driver', render: (row) => <span>{row.driver_name}</span> },
    { header: 'Work Hours', render: (row) => <span>{row.work_hours}</span> },
    { header: 'Total Amount', render: (row) => <span className="font-bold">৳{Number(row.total_amount).toLocaleString()}</span> },
    { header: 'Work Date', render: (row) => <span>{row.work_date}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
            <Truck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Work Slips & Payments</h1>
            <p className="text-gray-500 text-sm">Manage vehicle usage and payments</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
          <Plus size={18} /> Create Work Slip
        </button>
      </div>

      <DataTable columns={columns} data={vehicles} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Work Slip" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Vehicle Number *</label>
              <input type="text" required value={formData.vehicle_number} onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Vehicle Type</label>
              <select value={formData.vehicle_type} onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })} className="form-input">
                <option value="truck">Truck</option>
                <option value="pickup">Pickup</option>
                <option value="car">Car</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="excavator">Excavator</option>
                <option value="crane">Crane</option>
              </select>
            </div>
            <div>
              <label className="form-label">Driver Name *</label>
              <input type="text" required value={formData.driver_name} onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Work Date *</label>
              <input type="date" required value={formData.work_date} onChange={(e) => setFormData({ ...formData, work_date: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Work Hours *</label>
              <input type="number" step="0.5" required value={formData.work_hours} onChange={(e) => setFormData({ ...formData, work_hours: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Hourly Rate (৳) *</label>
              <input type="number" step="0.01" required value={formData.hourly_rate} onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Fuel Cost (৳)</label>
              <input type="number" step="0.01" value={formData.fuel_cost} onChange={(e) => setFormData({ ...formData, fuel_cost: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Total Amount (৳) *</label>
              <input type="number" step="0.01" required value={formData.total_amount} onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input"></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Work Slip</button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Work Slip" message="Are you sure you want to delete this work slip?" />
    </div>
  );
}
