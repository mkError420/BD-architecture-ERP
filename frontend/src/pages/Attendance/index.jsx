import { useState, useEffect } from 'react';
import { attendanceAPI, employeesAPI, projectsAPI } from '../../api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { Calendar, Save, CheckCircle, XCircle, Clock, AlertCircle, Building2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Attendance() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadData();
  }, [date, projectId]);

  const loadProjects = async () => {
    try {
      const res = await projectsAPI.getAll({ per_page: 100 });
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (e) {
      console.warn('Projects fallback');
      setProjects([
        { id: 1, name: 'Gulshan Heights Tower' },
        { id: 2, name: 'Uttara Commercial Complex' },
      ]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, attRes] = await Promise.allSettled([
        employeesAPI.getAll({ per_page: 100, project_id: projectId }),
        attendanceAPI.getAll({ date, project_id: projectId, per_page: 100 })
      ]);

      let empList = [];
      if (empRes.status === 'fulfilled' && empRes.value.data.success) {
        empList = empRes.value.data.data;
      } else {
        empList = [
          { id: 1, employee_code: 'EMP-00101', name: 'Md. Rafiqul Islam', role: 'supervisor', salary: 35000, salary_type: 'monthly' },
          { id: 2, employee_code: 'EMP-00102', name: 'Al-Amin Mia', role: 'mason', salary: 850, salary_type: 'daily' },
          { id: 3, employee_code: 'EMP-00103', name: 'Sujon Howlader', role: 'rod_binder', salary: 800, salary_type: 'daily' },
          { id: 4, employee_code: 'EMP-00104', name: 'Kalam Hossain', role: 'electrician', salary: 900, salary_type: 'daily' },
        ];
      }
      setEmployees(empList);

      const records = {};
      if (attRes.status === 'fulfilled' && attRes.value.data.success) {
        attRes.value.data.data.forEach(item => {
          records[item.employee_id] = {
            status: item.status,
            check_in: item.check_in || '08:00',
            check_out: item.check_out || '17:00',
            overtime_hours: item.overtime_hours || 0,
            daily_wage: item.daily_wage || 0,
            notes: item.notes || '',
          };
        });
      }

      // Fill in defaults for employees not yet recorded
      empList.forEach(emp => {
        if (!records[emp.id]) {
          const rate = emp.salary_type === 'daily' ? Number(emp.salary) : Math.round(Number(emp.salary || 0) / 26);
          records[emp.id] = {
            status: 'present',
            check_in: '08:00',
            check_out: '17:00',
            overtime_hours: 0,
            daily_wage: rate,
            notes: '',
          };
        }
      });
      setAttendanceRecords(records);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (empId, status) => {
    const emp = employees.find(e => e.id === empId);
    let wage = 0;
    if (emp) {
      const baseDaily = emp.salary_type === 'daily' ? Number(emp.salary) : Math.round(Number(emp.salary || 0) / 26);
      if (status === 'present') wage = baseDaily;
      else if (status === 'half_day') wage = Math.round(baseDaily / 2);
      else wage = 0;
    }
    setAttendanceRecords(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        status,
        daily_wage: wage,
      }
    }));
  };

  const handleFieldChange = (empId, field, value) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: value
      }
    }));
  };

  const handleMarkAll = (status) => {
    const updated = { ...attendanceRecords };
    employees.forEach(emp => {
      const baseDaily = emp.salary_type === 'daily' ? Number(emp.salary) : Math.round(Number(emp.salary || 0) / 26);
      let wage = status === 'present' ? baseDaily : (status === 'half_day' ? Math.round(baseDaily / 2) : 0);
      updated[emp.id] = {
        ...updated[emp.id],
        status,
        daily_wage: wage
      };
    });
    setAttendanceRecords(updated);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const payload = {
        records: employees.map(emp => {
          const rec = attendanceRecords[emp.id] || {};
          return {
            employee_id: emp.id,
            project_id: projectId || null,
            attendance_date: date,
            status: rec.status || 'present',
            check_in: rec.check_in || '08:00',
            check_out: rec.check_out || '17:00',
            overtime_hours: Number(rec.overtime_hours || 0),
            daily_wage: Number(rec.daily_wage || 0),
            notes: rec.notes || ''
          };
        })
      };
      await attendanceAPI.save(payload);
      toast.success(`Attendance successfully recorded for ${formatDate(date)}`);
    } catch (err) {
      toast.error('Failed to save attendance records');
    } finally {
      setSaving(false);
    }
  };

  // Totals summary
  const presentCount = Object.values(attendanceRecords).filter(r => r.status === 'present').length;
  const absentCount = Object.values(attendanceRecords).filter(r => r.status === 'absent').length;
  const halfDayCount = Object.values(attendanceRecords).filter(r => r.status === 'half_day').length;
  const totalWages = Object.values(attendanceRecords).reduce((acc, curr) => acc + (Number(curr.daily_wage) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Site Attendance Register</h1>
          <p className="text-gray-500 text-sm mt-1">Track daily worker presenteeism, overtime hours, and daily wage liabilities</p>
        </div>
        <button
          onClick={handleSaveAttendance}
          disabled={saving || loading}
          className="btn-success shadow-lg shadow-emerald-600/20"
        >
          <Save size={18} /> {saving ? 'Saving Records...' : 'Save Today\'s Register'}
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input text-xs w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-gray-400" />
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="form-input text-xs w-56"
            >
              <option value="">-- All Projects / General Site --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Batch Select */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs text-gray-500 font-medium mr-1">Mark All:</span>
          <button
            onClick={() => handleMarkAll('present')}
            className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
          >
            All Present
          </button>
          <button
            onClick={() => handleMarkAll('absent')}
            className="px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
          >
            All Absent
          </button>
        </div>
      </div>

      {/* Day Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-500">Present</span>
            <p className="text-lg font-bold text-gray-900">{presentCount} Workers</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
            <XCircle size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-500">Absent</span>
            <p className="text-lg font-bold text-gray-900">{absentCount} Workers</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-500">Half Day</span>
            <p className="text-lg font-bold text-gray-900">{halfDayCount} Workers</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-primary-700 flex items-center justify-center font-bold">
            ৳
          </div>
          <div>
            <span className="text-xs text-gray-500">Estimated Wage Total</span>
            <p className="text-lg font-bold text-primary-700">{formatCurrency(totalWages)}</p>
          </div>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Worker / Employee</th>
                <th>Status</th>
                <th>In / Out Time</th>
                <th>Overtime (Hrs)</th>
                <th>Daily Payable (BDT)</th>
                <th>Remarks / Notes</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const rec = attendanceRecords[emp.id] || { status: 'present', check_in: '08:00', check_out: '17:00', overtime_hours: 0, daily_wage: 0, notes: '' };
                return (
                  <tr key={emp.id} className="hover:bg-blue-50/40 transition-colors">
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">{emp.employee_code}</span>
                        <span className="font-bold text-gray-900">{emp.name}</span>
                      </div>
                      <div className="text-xs text-gray-400 capitalize">{emp.role?.replace('_', ' ')} • {formatCurrency(emp.salary)} / {emp.salary_type}</div>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {['present', 'absent', 'half_day', 'leave'].map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusChange(emp.id, st)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all
                              ${rec.status === st
                                ? st === 'present' ? 'bg-emerald-600 text-white shadow-sm'
                                  : st === 'absent' ? 'bg-red-600 text-white shadow-sm'
                                  : st === 'half_day' ? 'bg-amber-500 text-white shadow-sm'
                                  : 'bg-purple-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }
                            `}
                          >
                            {st === 'half_day' ? 'Half' : st}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <input
                          type="time"
                          value={rec.check_in}
                          onChange={(e) => handleFieldChange(emp.id, 'check_in', e.target.value)}
                          className="px-1.5 py-1 text-xs border border-gray-200 rounded"
                        />
                        <span className="text-gray-400 text-xs">-</span>
                        <input
                          type="time"
                          value={rec.check_out}
                          onChange={(e) => handleFieldChange(emp.id, 'check_out', e.target.value)}
                          className="px-1.5 py-1 text-xs border border-gray-200 rounded"
                        />
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        step="0.5"
                        value={rec.overtime_hours}
                        onChange={(e) => handleFieldChange(emp.id, 'overtime_hours', e.target.value)}
                        className="w-16 px-2 py-1 text-xs border border-gray-200 rounded text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={rec.daily_wage}
                        onChange={(e) => handleFieldChange(emp.id, 'daily_wage', e.target.value)}
                        className="w-24 px-2 py-1 text-xs font-semibold border border-gray-200 rounded text-gray-900"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Site notes..."
                        value={rec.notes}
                        onChange={(e) => handleFieldChange(emp.id, 'notes', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
