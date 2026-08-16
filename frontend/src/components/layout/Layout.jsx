import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import {
  LayoutDashboard, FolderKanban, CalendarCheck, Wallet, Menu,
  Users, HardHat, Package, FileText, BarChart3, Settings, X, Truck, ClipboardList
} from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const location = useLocation();

  const mobileNavItems = [
    { path: '/', label: 'Home', icon: LayoutDashboard },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { path: '/expenses', label: 'Finance', icon: Wallet },
  ];

  const moreMenuItems = [
    { path: '/clients', label: 'Clients Directory', icon: Users },
    { path: '/employees', label: 'Workers & Staff', icon: HardHat },
    { path: '/materials', label: 'Materials Catalog', icon: Package },
    { path: '/suppliers', label: 'Vendors & Suppliers', icon: Truck },
    { path: '/work-orders', label: 'Work Orders', icon: ClipboardList },
    { path: '/invoices', label: 'Client Invoices', icon: FileText },
    { path: '/salary', label: 'Salary Payroll', icon: Wallet },
    { path: '/documents', label: 'Documents & Permits', icon: FileText },
    { path: '/reports', label: 'Reports & Audits', icon: BarChart3 },
    { path: '/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <Sidebar
        isOpen={sidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          onMenuClick={() => setMobileSidebarOpen(true)}
          sidebarOpen={sidebarOpen}
        />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6 p-3 sm:p-5 lg:p-6">
          <div className="page-enter max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (< 1024px) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 flex items-center justify-around px-2 py-1.5 shadow-lg">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[11px] font-medium transition-all ${
                  isActive
                    ? 'text-blue-600 font-bold scale-105'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500'} />
                <span className="mt-0.5">{item.label}</span>
              </NavLink>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[11px] font-medium transition-all ${
              mobileMoreOpen ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Menu size={20} className={mobileMoreOpen ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500'} />
            <span className="mt-0.5">More</span>
          </button>
        </nav>

        {/* Mobile "More" Modal / Bottom Sheet */}
        {mobileMoreOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setMobileMoreOpen(false)} />
            <div className="relative bg-white rounded-t-3xl p-5 shadow-2xl z-50 max-h-[80vh] overflow-y-auto animate-[fadeInUp_0.2s_ease-out]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-bold text-slate-900 text-base">All Modules & Tools</h3>
                <button onClick={() => setMobileMoreOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pb-6">
                {moreMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMoreOpen(false)}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                          : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-white shadow-xs text-blue-600">
                        <Icon size={18} />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
