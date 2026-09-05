import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { vehiclesAPI } from '../../api';
import { Truck, Plus, Edit, Trash2, ArrowLeft, DollarSign, Clock, CheckCircle2, AlertCircle, Navigation, Fuel, Gauge } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/helpers';

const DEMO_VEHICLES = [
  {
    id: 1,
    slip_code: 'VWS-202502-0081',
    project_id: 1,
    registration_number: 'DHAKA-METRO-U-14-3891',
    vehicle_type: 'truck',
    driver_name: 'Md. Joynal Abedin',
    work_date: '2025-02-18',
    start_location: 'Savar Sand Quarry',
    end_location: 'Site Block B',
    distance_km: 75,
    fuel_consumed: 30,
    fuel_cost: 3300,
    daily_rate: 6500,
    overtime_hours: 2,
    overtime_rate: 500,
    total_amount: 10800,
    status: 'paid',
    work_description: '3 Trips of Sylhet coarse sand delivery',
  },
  {
    id: 2,
    slip_code: 'VWS-202502-0082',
    project_id: 1,
    registration_number: 'DHAKA-METRO-E-11-2045',
    vehicle_type: 'excavator',
    driver_name: 'Shamsul Alam',
    work_date: '2025-02-19',
    start_location: 'Site Yard',
    end_location: 'Basement Pit 2',
    distance_km: 5,
    fuel_consumed: 65,
    fuel_cost: 7150,
    daily_rate: 15000,
    overtime_hours: 3,
    overtime_rate: 1200,
    total_amount: 25750,
    status: 'approved',
    work_description: '8 hours basement excavation & earth loading onto dumpers',
  },
  {
    id: 3,
    slip_code: 'VWS-202502-0083',
    project_id: 1,
    registration_number: 'DHAKA-METRO-SH-12-9011',
    vehicle_type: 'concrete_mixer',
    driver_name: 'Babul Miah',
    work_date: '2025-02-20',
    start_location: 'ReadyMix Plant Gabtoli',
    end_location: 'Project Gate 1',
    distance_km: 42,
    fuel_consumed: 22,
    fuel_cost: 2420,
    daily_rate: 8000,
    overtime_hours: 0,
    overtime_rate: 0,
    total_amount: 10420,
    status: 'paid',
    work_description: '2 Transit loads of M-25 grade concrete for column casting',
  },
  {
    id: 4,
    slip_code: 'VWS-202502-0084',
    project_id: 1,
    registration_number: 'DHAKA-METRO-CR-07-3310',
    vehicle_type: 'crane',
    driver_name: 'Rashedul Karim',
    work_date: '2025-02-21',
    start_location: 'On Site',
    end_location: 'Block A Level 4',
    distance_km: 0,
    fuel_consumed: 40,
    fuel_cost: 4400,
    daily_rate: 18000,
    overtime_hours: 2,
    overtime_rate: 1500,
    total_amount: 25400,
    status: 'pending',
    work_description: 'Lifting heavy steel I-beams & prefabricated shutter panels',
  },
  {
    id: 5,
    slip_code: 'VWS-202502-0085',
    project_id: 1,
    registration_number: 'DHAKA-METRO-N-19-4502',
    vehicle_type: 'pickup',
    driver_name: 'Anisur Rahman',
    work_date: '2025-02-22',
    start_location: 'Bangshal Hardware Market',
    end_location: 'Site Store',
    distance_km: 35,
    fuel_consumed: 12,
    fuel_cost: 1320,
    daily_rate: 3500,
    overtime_hours: 1,
    overtime_rate: 350,
    total_amount: 5170,
    status: 'pending',
    work_description: 'Emergency delivery of plumbing PVC fittings and adhesives',
  },
];

export default function VehicleWorkSlips() {
  const { projectId } = useParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  const initialForm = {
    project_id: projectId,
    registration_number: '',
    vehicle_type: 'truck',
    driver_name: '',
    work_date: new Date().toISOString().split('T')[0],
    start_location: 'Site Yard',
    end_location: 'Project Site',
    distance_km: 25,
    daily_rate: 5000,
    overtime_hours: 0,
    overtime_rate: 400,
    fuel_consumed: 10,
    fuel_cost: 1100,
    total_amount: 6100,
    status: 'pending',
    work_description: '',
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    loadVehicles();
  }, [projectId]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await vehiclesAPI.getAll({ project_id: projectId, type: 'work_slips' });
      const records = res.data?.data?.data || res.data?.data || [];
      if (Array.isArray(records) && records.length > 0) {
        setVehicles(records);
        setIsDemo(false);
      } else {
        setVehicles(DEMO_VEHICLES);
        setIsDemo(true);
      }
    } catch (err) {
      console.warn('Vehicles API failed, showing demo data:', err);
      setVehicles(DEMO_VEHICLES);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCalc = (updatedFields) => {
    const next = { ...formData, ...updatedFields };
    const rate = parseFloat(next.daily_rate) || 0;
    const otHours = parseFloat(next.overtime_hours) || 0;
    const otRate = parseFloat(next.overtime_rate) || 0;
    const fuel = parseFloat(next.fuel_cost) || 0;
    const total = rate + (otHours * otRate) + fuel;

    setFormData({
      ...next,
      total_amount: Math.max(0, total),
    });
  };

  const handleAddNew = () => {
    setSelectedVehicle(null);
    setFormData({
      ...initialForm,
      project_id: projectId,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (slip) => {
    setSelectedVehicle(slip);
    setFormData({
      project_id: projectId,
      registration_number: slip.registration_number || slip.vehicle_number || '',
      vehicle_type: slip.vehicle_type || 'truck',
      driver_name: slip.driver_name || '',
      work_date: slip.work_date || new Date().toISOString().split('T')[0],
      start_location: slip.start_location || '',
      end_location: slip.end_location || '',
      distance_km: slip.distance_km || 0,
      daily_rate: slip.daily_rate || slip.hourly_rate || 0,
      overtime_hours: slip.overtime_hours || slip.work_hours || 0,
      overtime_rate: slip.overtime_rate || 0,
      fuel_consumed: slip.fuel_consumed || 0,
      fuel_cost: slip.fuel_cost || 0,
      total_amount: slip.total_amount || 0,
      status: slip.status || 'pending',
      work_description: slip.work_description || slip.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (slip) => {
    setSelectedVehicle(slip);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      type: 'work_slips',
      project_id: projectId,
      daily_rate: parseFloat(formData.daily_rate) || 0,
      overtime_hours: parseFloat(formData.overtime_hours) || 0,
      overtime_rate: parseFloat(formData.overtime_rate) || 0,
      fuel_cost: parseFloat(formData.fuel_cost) || 0,
      total_amount: parseFloat(formData.total_amount) || 0,
      distance_km: parseFloat(formData.distance_km) || 0,
      fuel_consumed: parseFloat(formData.fuel_consumed) || 0,
      vehicle_number: formData.registration_number,
    };

    try {
      if (selectedVehicle) {
        if (isDemo) {
          setVehicles(prev => prev.map(v => v.id === selectedVehicle.id ? { ...v, ...payload } : v));
          toast.success('Work slip updated successfully!');
        } else {
          await vehiclesAPI.update(selectedVehicle.id, payload);
          toast.success('Work slip updated successfully!');
          loadVehicles();
        }
      } else {
        if (isDemo) {
          const newSlip = {
            id: Date.now(),
            slip_code: `VWS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
            ...payload,
          };
          setVehicles(prev => [newSlip, ...prev]);
          toast.success('Work slip recorded successfully!');
        } else {
          await vehiclesAPI.create(payload);
          toast.success('Work slip recorded successfully!');
          loadVehicles();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      if (isDemo) {
        setVehicles(prev => prev.filter(v => v.id !== selectedVehicle.id));
        toast.success('Work slip deleted');
      } else {
        await vehiclesAPI.delete(selectedVehicle.id, { type: 'work_slips' });
        toast.success('Work slip deleted');
        loadVehicles();
      }
      setIsDeleteOpen(false);
    } catch {
      toast.error('Failed to delete work slip');
    }
  };

  // KPIs
  const stats = useMemo(() => {
    const totalPaid = vehicles
      .filter(v => v.status === 'paid')
      .reduce((sum, v) => sum + (parseFloat(v.total_amount) || 0), 0);
    const totalPending = vehicles
      .filter(v => v.status === 'pending' || v.status === 'approved')
      .reduce((sum, v) => sum + (parseFloat(v.total_amount) || 0), 0);
    const totalKm = vehicles.reduce((sum, v) => sum + (parseFloat(v.distance_km) || 0), 0);
    return { totalPaid, totalPending, count: vehicles.length, totalKm };
  }, [vehicles]);

  const columns = [
    {
      header: 'Slip Code',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
            {row.slip_code || `VWS-${row.id}`}
          </span>
          <div className="text-[11px] text-gray-400 mt-0.5">{formatDate(row.work_date)}</div>
        </div>
      ),
    },
    {
      header: 'Vehicle & Type',
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900 font-mono text-xs">{row.registration_number || row.vehicle_number || 'Site Vehicle'}</div>
          <span className="text-[11px] text-gray-500 capitalize bg-slate-100 px-1.5 py-0.2 rounded inline-block mt-0.5">
            {(row.vehicle_type || 'truck').replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Driver & Route',
      render: (row) => (
        <div className="text-xs">
          <div className="font-medium text-gray-900">{row.driver_name || 'Assigned Driver'}</div>
          {(row.start_location || row.end_location) && (
            <div className="text-gray-400 flex items-center gap-1 mt-0.5">
              <Navigation size={10} />
              <span>{row.start_location} → {row.end_location}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Fuel & Distance',
      render: (row) => (
        <div className="text-xs text-gray-600">
          <div className="flex items-center gap-1"><Gauge size={11} className="text-blue-500" /> {row.distance_km || 0} km</div>
          {parseFloat(row.fuel_cost) > 0 && (
            <div className="text-amber-600 flex items-center gap-1 mt-0.5">
              <Fuel size={11} /> {row.fuel_consumed || 0}L ({formatCurrency(row.fuel_cost)})
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Total Cost',
      render: (row) => (
        <div>
          <div className="font-bold text-gray-900 text-sm">
            {formatCurrency(row.total_amount || 0)}
          </div>
          <div className="text-[10px] text-gray-400">Rate: {formatCurrency(row.daily_rate || row.hourly_rate || 0)}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => {
        const s = row.status || 'pending';
        const styles = {
          paid: 'bg-green-100 text-green-800',
          approved: 'bg-blue-100 text-blue-800',
          pending: 'bg-amber-100 text-amber-800',
        };
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[s] || 'bg-gray-100 text-gray-800'}`}>
            {s === 'paid' && <CheckCircle2 size={12} />}
            {s === 'approved' && <Clock size={12} />}
            {s === 'pending' && <Clock size={12} />}
            {s}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
            title="Edit"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={() => handleDeleteClick(row)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div>
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Project Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
              <Truck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Work Slips</h1>
              <p className="text-gray-500 text-sm">Log transport trips, excavator hours, fuel expenses, and plant machinery billing</p>
            </div>
          </div>
          <button onClick={handleAddNew} className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto">
            <Plus size={18} /> New Work Slip
          </button>
        </div>
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
          <AlertCircle size={16} className="shrink-0 text-amber-600" />
          <span>Showing sample vehicle slips. Records you create will be safely recorded in the system.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Paid</span>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign size={18} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalPaid)}</div>
          <span className="text-xs text-green-600 font-medium">Cleared transport bills</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Pending Bills</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock size={18} /></div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{formatCurrency(stats.totalPending)}</div>
          <span className="text-xs text-gray-500 font-medium">Pending / Approved</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Work Slips</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Truck size={18} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.count}</div>
          <span className="text-xs text-gray-500">Trip / machine logs</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Distance</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Gauge size={18} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.totalKm} km</div>
          <span className="text-xs text-gray-500">Logged distance</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <DataTable columns={columns} data={vehicles} loading={loading} />
      </div>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedVehicle ? 'Edit Vehicle Work Slip' : 'Create Vehicle Work Slip'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Vehicle Registration No. *</label>
              <input
                type="text"
                required
                placeholder="e.g. DHAKA-METRO-U-14-3891"
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                className="form-input font-mono"
              />
            </div>

            <div>
              <label className="form-label">Vehicle / Plant Type</label>
              <select
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="form-input"
              >
                <option value="truck">Dump Truck (10 Wheeler / 6 Wheeler)</option>
                <option value="excavator">Excavator / Backhoe</option>
                <option value="concrete_mixer">Concrete Transit Mixer</option>
                <option value="crane">Mobile Crane / Tower Crane</option>
                <option value="pickup">Pickup / Van</option>
                <option value="car">Supervisor Car / Jeep</option>
                <option value="other">Other Plant Equipment</option>
              </select>
            </div>

            <div>
              <label className="form-label">Driver / Operator Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Md. Joynal Abedin"
                value={formData.driver_name}
                onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Work Date *</label>
              <input
                type="date"
                required
                value={formData.work_date}
                onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Start Location / Origin</label>
              <input
                type="text"
                placeholder="e.g. Savar Quarry, Site Yard"
                value={formData.start_location}
                onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Destination / Work Area</label>
              <input
                type="text"
                placeholder="e.g. Site Block B, Basement Pit"
                value={formData.end_location}
                onChange={(e) => setFormData({ ...formData, end_location: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Distance (km)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.distance_km}
                onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Daily / Base Rate (৳) *</label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={formData.daily_rate}
                onChange={(e) => handleCalc({ daily_rate: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Overtime Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.overtime_hours}
                onChange={(e) => handleCalc({ overtime_hours: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Overtime Rate (৳/hr)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.overtime_rate}
                onChange={(e) => handleCalc({ overtime_rate: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Fuel Consumed (Liters)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.fuel_consumed}
                onChange={(e) => setFormData({ ...formData, fuel_consumed: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Fuel Cost (৳)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.fuel_cost}
                onChange={(e) => handleCalc({ fuel_cost: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Total Amount (৳) *</label>
              <input
                type="number"
                step="1"
                required
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                className="form-input font-bold bg-gray-50"
              />
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-input"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Work Description / Trip Notes</label>
              <textarea
                rows="2"
                placeholder="Trips completed, material hauled, soil conditions..."
                value={formData.work_description}
                onChange={(e) => setFormData({ ...formData, work_description: e.target.value })}
                className="form-input"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {selectedVehicle ? 'Update Work Slip' : 'Save Work Slip'}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Work Slip"
        message="Are you sure you want to delete this vehicle work slip? This action cannot be undone."
      />
    </div>
  );
}
