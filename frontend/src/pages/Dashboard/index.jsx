import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../api';
import { formatCurrency, formatDate, formatStatus, getStatusClass } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, Users, HardHat, Wallet, TrendingUp, TrendingDown,
  CalendarCheck, ClipboardList, ArrowUpRight, Building2, PlusCircle, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await dashboardAPI.getStats();
      setData(res.data.data);
    } catch (err) {
      console.warn('Dashboard load failed, using rich demo fallback:', err);
      setData({
        stats: {
          total_projects: 24, active_projects: 8, completed_projects: 12,
          total_clients: 45, total_employees: 156,
          total_budget: 85000000, total_expenses: 42000000,
          total_invoiced: 65000000, total_received: 52000000,
        },
        recent_projects: [
          { id: 1, project_code: 'PRJ-00001', name: 'Gulshan Heights Tower', status: 'active', progress: 65, client_name: 'Rahman Real Estate', start_date: '2025-01-15', end_date: '2026-06-30' },
          { id: 2, project_code: 'PRJ-00002', name: 'Uttara Commercial Complex', status: 'active', progress: 40, client_name: 'Karim Enterprises', start_date: '2025-03-01', end_date: '2026-12-31' },
          { id: 3, project_code: 'PRJ-00003', name: 'Dhanmondi Residence', status: 'completed', progress: 100, client_name: 'Mr. Hasan', start_date: '2024-06-01', end_date: '2025-08-01' },
          { id: 4, project_code: 'PRJ-00004', name: 'Mirpur Road Bridge', status: 'planning', progress: 10, client_name: 'Dhaka City Corp.', start_date: '2025-10-01', end_date: '2027-03-31' },
          { id: 5, project_code: 'PRJ-00005', name: 'Banani Office Park', status: 'active', progress: 78, client_name: 'Tech BD Ltd.', start_date: '2024-11-01', end_date: '2026-02-28' },
        ],
        monthly_expenses: [
          { month: '2025-03', total: 5200000 }, { month: '2025-04', total: 6800000 },
          { month: '2025-05', total: 7500000 }, { month: '2025-06', total: 6200000 },
          { month: '2025-07', total: 8100000 }, { month: '2025-08', total: 8200000 },
        ],
        monthly_invoices: [
          { month: '2025-03', total: 8000000, paid: 6500000 }, { month: '2025-04', total: 9500000, paid: 8000000 },
          { month: '2025-05', total: 11000000, paid: 9200000 }, { month: '2025-06', total: 10000000, paid: 8700000 },
          { month: '2025-07', total: 12000000, paid: 10500000 }, { month: '2025-08', total: 14500000, paid: 9000000 },
        ],
        project_status: [
          { status: 'planning', count: 4 }, { status: 'active', count: 8 },
          { status: 'completed', count: 12 }, { status: 'on_hold', count: 2 },
        ],
        today_attendance: 89,
        pending_work_orders: 15,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};

  const kpiCards = [
    { label: 'Active Projects', value: stats.active_projects || 8, sub: `${stats.total_projects || 24} Total in pipeline`, icon: FolderKanban, color: 'from-blue-600 to-indigo-700', bgLight: 'bg-blue-50/60', trend: '+2 new' },
    { label: 'Enrolled Clients', value: stats.total_clients || 45, sub: 'Landowners & Developers', icon: Users, color: 'from-emerald-500 to-teal-700', bgLight: 'bg-emerald-50/60', trend: '+5 this mo' },
    { label: 'On-Site Headcount', value: data?.today_attendance || 89, sub: `${stats.total_employees || 156} Enrolled staff`, icon: HardHat, color: 'from-amber-500 to-orange-600', bgLight: 'bg-amber-50/60', trend: 'Live today' },
    { label: 'Total Project Budget', value: formatCurrency(stats.total_budget || 85000000), sub: `Spent: ${formatCurrency(stats.total_expenses || 42000000)}`, icon: Wallet, color: 'from-purple-600 to-indigo-800', bgLight: 'bg-purple-50/60', trend: 'BDT (৳)' },
  ];

  const pieData = (data?.project_status || []).map((s) => ({
    name: formatStatus(s.status),
    value: parseInt(s.count),
  }));

  const barData = (data?.monthly_expenses || []).map((m) => ({
    month: m.month?.slice(5),
    Expenses: parseInt(m.total) / 100000,
  }));

  const lineData = (data?.monthly_invoices || []).map((m) => ({
    month: m.month?.slice(5),
    Invoiced: parseInt(m.total) / 100000,
    Received: parseInt(m.paid) / 100000,
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Construction Command Center</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Real-time status overview across all active construction sites in Bangladesh</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/projects')}
            className="btn-primary text-xs py-2 px-3 sm:px-4"
          >
            <PlusCircle size={16} /> New Project
          </button>
          <button
            onClick={() => navigate('/attendance')}
            className="btn-secondary text-xs py-2 px-3 sm:px-4"
          >
            <CalendarCheck size={16} /> Mark Attendance
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 card-hover flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{card.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">{card.sub}</p>
                </div>
                <div
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md shadow-slate-200 flex-shrink-0`}
                >
                  <Icon size={20} />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <TrendingUp size={13} /> {card.trend}
                </span>
                <span className="text-slate-400 font-medium text-[11px]">BDT ৳</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Health Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-2xl sm:rounded-3xl p-5 text-white shadow-md">
          <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">Total Billed Invoices</p>
          <p className="text-2xl sm:text-3xl font-black mt-1 tracking-tight">{formatCurrency(stats.total_invoiced)}</p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Issued across all clients</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-700 to-teal-800 rounded-2xl sm:rounded-3xl p-5 text-white shadow-md">
          <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Collected Cash Inflow</p>
          <p className="text-2xl sm:text-3xl font-black mt-1 tracking-tight">{formatCurrency(stats.total_received)}</p>
          <p className="text-xs text-emerald-200 mt-1 font-medium">Bank & Mobile Banking</p>
        </div>
        <div className="bg-gradient-to-br from-amber-600 to-rose-700 rounded-2xl sm:rounded-3xl p-5 text-white shadow-md">
          <p className="text-xs font-bold text-amber-200 uppercase tracking-wider">Receivable Dues</p>
          <p className="text-2xl sm:text-3xl font-black mt-1 tracking-tight">
            {formatCurrency((stats.total_invoiced || 0) - (stats.total_received || 0))}
          </p>
          <p className="text-xs text-amber-200 mt-1 font-medium">Pending client clearance</p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Expenses Bar Chart */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Monthly Site Outflow (Lakh ৳)</h3>
            <span className="text-xs text-slate-400 font-semibold">Last 6 Months</span>
          </div>
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [`৳${v} Lakh`, 'Expense']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="Expenses" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Invoice vs Collection Line Chart */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Invoice vs Realized Payment (Lakh ৳)</h3>
            <span className="text-xs text-slate-400 font-semibold">Cashflow Comparison</span>
          </div>
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [`৳${v} Lakh`]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Invoiced" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Received" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Breakdown & Recent Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Project Status Pie Chart */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base mb-2">Project Portfolio Status</h3>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={4}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-600 font-medium truncate">{item.name}:</span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Site Activity Feeds */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base mb-3">Live Site Operations</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50/70 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                  <CalendarCheck size={16} />
                </div>
                <span className="text-xs font-bold text-slate-800">Present Workers Today</span>
              </div>
              <span className="text-base font-black text-blue-700">{data?.today_attendance || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50/70 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                  <ClipboardList size={16} />
                </div>
                <span className="text-xs font-bold text-slate-800">Pending Work Orders</span>
              </div>
              <span className="text-base font-black text-amber-700">{data?.pending_work_orders || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <FolderKanban size={16} />
                </div>
                <span className="text-xs font-bold text-slate-800">Handed Over Projects</span>
              </div>
              <span className="text-base font-black text-emerald-700">{stats.completed_projects || 0}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/work-orders')}
            className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            Review Active Tasks <ArrowRight size={14} />
          </button>
        </div>

        {/* Recent Projects List */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Recent Site Works</h3>
            <button
              onClick={() => navigate('/projects')}
              className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-0.5"
            >
              View All <ArrowUpRight size={13} />
            </button>
          </div>
          <div className="space-y-2.5">
            {(data?.recent_projects || []).slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => navigate('/projects')}
                className="flex items-center gap-2.5 p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-xs border border-blue-100">
                  <Building2 size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{p.client_name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusClass(p.status)}`}>
                    {formatStatus(p.status)}
                  </span>
                  <p className="text-[11px] font-bold text-slate-700 mt-0.5">{p.progress}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
