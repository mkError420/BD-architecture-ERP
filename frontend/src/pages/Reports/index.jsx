import { useState, useEffect } from 'react';
import { reportsAPI, projectsAPI } from '../../api';
import { formatCurrency, formatDate, formatStatus, getStatusClass } from '../../utils/helpers';
import { BarChart3, Printer, FileSpreadsheet, Building2, Wallet, CalendarCheck, Package, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('project_summary');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadReport();
  }, [activeTab, selectedProject]);

  const loadProjects = async () => {
    try {
      const res = await projectsAPI.getAll({ per_page: 100 });
      if (res.data.success) setProjects(res.data.data);
    } catch {
      setProjects([{ id: 1, name: 'Gulshan Heights Tower' }, { id: 2, name: 'Uttara Commercial Complex' }]);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await reportsAPI.get({
        type: activeTab,
        project_id: selectedProject,
      });
      if (res.data.success) setData(res.data.data);
    } catch {
      // Fallback mocks
      if (activeTab === 'project_summary') {
        setData([
          { id: 1, name: 'Gulshan Heights Tower', client_name: 'Rahman Real Estate', status: 'active', progress: 65, total_budget: 45000000, total_spent: 24500000, total_invoiced: 30000000, total_received: 28000000, completed_tasks: 14, total_tasks: 20 },
          { id: 2, name: 'Uttara Commercial Complex', client_name: 'Karim Enterprises', status: 'active', progress: 40, total_budget: 85000000, total_spent: 32000000, total_invoiced: 40000000, total_received: 35000000, completed_tasks: 8, total_tasks: 25 },
          { id: 3, name: 'Dhanmondi Luxury Duplex', client_name: 'Engr. Hasan Ahmed', status: 'completed', progress: 100, total_budget: 12000000, total_spent: 11200000, total_invoiced: 12000000, total_received: 12000000, completed_tasks: 15, total_tasks: 15 },
        ]);
      } else if (activeTab === 'financial') {
        setData({
          by_category: [
            { category: 'material', total: 42000000, count: 45 },
            { category: 'labor', total: 18000000, count: 60 },
            { category: 'equipment', total: 5500000, count: 12 },
            { category: 'utility', total: 2100000, count: 15 },
            { category: 'professional_fee', total: 1800000, count: 6 },
          ],
          total: 69400000
        });
      } else if (activeTab === 'attendance') {
        setData([
          { id: 1, name: 'Md. Rafiqul Islam', employee_code: 'EMP-00101', role: 'supervisor', present_days: 26, absent_days: 0, half_days: 0, total_overtime: 15, total_wages: 35000 },
          { id: 2, name: 'Al-Amin Mia', employee_code: 'EMP-00102', role: 'mason', present_days: 24, absent_days: 2, half_days: 1, total_overtime: 28, total_wages: 20400 },
          { id: 3, name: 'Sujon Howlader', employee_code: 'EMP-00103', role: 'rod_binder', present_days: 25, absent_days: 1, half_days: 0, total_overtime: 20, total_wages: 20000 },
        ]);
      } else if (activeTab === 'material_stock') {
        setData([
          { name: 'Shah Cement Special', category: 'cement', unit: 'bag', total_purchased: 4500, total_used: 3800, remaining: 700, total_cost: 2430000 },
          { name: 'BSRM 16mm Rod 500W', category: 'rod_steel', unit: 'ton', total_purchased: 85, total_used: 72, remaining: 13, total_cost: 8372500 },
          { name: 'Sylhet Sand (FM 2.5)', category: 'sand', unit: 'cft', total_purchased: 25000, total_used: 22000, remaining: 3000, total_cost: 1200000 },
          { name: '1st Class Auto Bricks', category: 'brick', unit: 'piece', total_purchased: 150000, total_used: 135000, remaining: 15000, total_cost: 2025000 },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs = [
    { id: 'project_summary', label: 'Project Performance', icon: Building2 },
    { id: 'financial', label: 'Financial & Expenses', icon: Wallet },
    { id: 'attendance', label: 'Labor & Attendance', icon: CalendarCheck },
    { id: 'material_stock', label: 'Material Stock & Usage', icon: Package },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Generate comprehensive construction statements, cost audit sheets, and labor logs</p>
        </div>
        <button onClick={handlePrint} className="btn-secondary">
          <Printer size={18} /> Print / Export PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3 print:hidden">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${activeTab === tab.id
                  ? 'text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
              style={activeTab === tab.id ? { backgroundColor: '#A0975A', boxShadow: '0 4px 6px -1px rgba(160, 151, 90, 0.3)' } : {}}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Print Header */}
      <div className="hidden print:block border-b-2 border-gray-900 pb-4 mb-4">
        <h1 className="text-2xl font-extrabold">Bangladesh Construction Management System</h1>
        <p className="text-sm text-gray-600">Official Executive Report • Generated on {new Date().toLocaleDateString('en-BD')}</p>
      </div>

      {/* Project Performance Tab */}
      {activeTab === 'project_summary' && Array.isArray(data) && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900">
              Project Performance & Financial Audit Summary
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Project & Client</th>
                    <th>Status & Progress</th>
                    <th>Approved Budget</th>
                    <th>Total Expenses</th>
                    <th>Total Invoiced</th>
                    <th>Received Amount</th>
                    <th>Net Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(p => {
                    const due = Number(p.total_invoiced || 0) - Number(p.total_received || 0);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="font-bold text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-500">{p.client_name}</div>
                        </td>
                        <td>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold mb-1 ${getStatusClass(p.status)}`}>
                            {formatStatus(p.status)}
                          </span>
                          <div className="text-xs text-gray-600 font-semibold">{p.progress}% Completed</div>
                        </td>
                        <td className="font-semibold text-gray-900">{formatCurrency(p.total_budget)}</td>
                        <td className="text-red-700 font-semibold">{formatCurrency(p.total_spent)}</td>
                        <td className="font-semibold text-gray-900">{formatCurrency(p.total_invoiced)}</td>
                        <td className="text-emerald-700 font-bold">{formatCurrency(p.total_received)}</td>
                        <td className="text-amber-700 font-semibold">{formatCurrency(due)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Financial Breakdown Tab */}
      {activeTab === 'financial' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Cost Distribution by Category</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.by_category || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="total"
                    nameKey="category"
                    label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {(data.by_category || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Category Spend Table (BDT)</h3>
              <div className="space-y-3">
                {(data.by_category || []).map((cat, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-semibold capitalize text-gray-800">{cat.category}</span>
                      <span className="text-xs text-gray-400">({cat.count} vouchers)</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatCurrency(cat.total)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-3 bg-primary-50 rounded-xl border border-primary-100">
                  <span className="font-bold text-primary-900">Total Expenditure:</span>
                  <span className="font-extrabold text-primary-700 text-lg">{formatCurrency(data.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Labor & Attendance Report */}
      {activeTab === 'attendance' && Array.isArray(data) && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 font-bold text-gray-900">
            Monthly Labor Attendance & Wage Liability Sheet
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Worker Name</th>
                  <th>Trade / Role</th>
                  <th>Present Days</th>
                  <th>Absent Days</th>
                  <th>Overtime (Hours)</th>
                  <th>Gross Payable (BDT)</th>
                </tr>
              </thead>
              <tbody>
                {data.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="font-bold text-gray-900">{emp.name}</div>
                      <div className="text-xs font-mono text-gray-400">{emp.employee_code}</div>
                    </td>
                    <td className="capitalize text-gray-700 text-xs font-semibold">{emp.role?.replace('_', ' ')}</td>
                    <td className="text-emerald-700 font-bold">{emp.present_days} Days</td>
                    <td className="text-red-600 font-medium">{emp.absent_days} Days</td>
                    <td className="font-semibold text-amber-700">{emp.total_overtime || 0} Hrs</td>
                    <td className="font-bold text-gray-900 text-base">{formatCurrency(emp.total_wages)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Material Stock & Usage */}
      {activeTab === 'material_stock' && Array.isArray(data) && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 font-bold text-gray-900">
            Material Inventory Balance & Consumption Report
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Material Specification</th>
                  <th>Total Purchased</th>
                  <th>Total Consumed / Used</th>
                  <th>Remaining Godown Stock</th>
                  <th>Procurement Cost (BDT)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m, i) => (
                  <tr key={i}>
                    <td>
                      <div className="font-bold text-gray-900">{m.name}</div>
                      <div className="text-xs text-gray-400 capitalize">{m.category}</div>
                    </td>
                    <td className="font-medium text-gray-800">{m.total_purchased} {m.unit}</td>
                    <td className="text-amber-700 font-medium">{m.total_used} {m.unit}</td>
                    <td>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {m.remaining} {m.unit}
                      </span>
                    </td>
                    <td className="font-bold text-gray-900">{formatCurrency(m.total_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
