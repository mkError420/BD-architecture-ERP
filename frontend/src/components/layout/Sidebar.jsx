import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Users, HardHat, Package, Wallet,
  ClipboardList, CalendarCheck, FileText, BarChart3, UserCog, Settings,
  ChevronLeft, Building2, Truck, X
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/employees', label: 'Workers / Staff', icon: HardHat },
  { path: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { path: '/materials', label: 'Materials', icon: Package },
  { path: '/suppliers', label: 'Suppliers', icon: Truck },
  { path: '/work-orders', label: 'Work Orders', icon: ClipboardList },
  { divider: true, label: 'Financials' },
  { path: '/expenses', label: 'Expenses', icon: Wallet },
  { path: '/invoices', label: 'Invoices', icon: FileText },
  { path: '/salary', label: 'Salary Payroll', icon: Wallet },
  { divider: true, label: 'Analytics' },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { divider: true, label: 'Administration' },
  { path: '/users', label: 'User Roles', icon: UserCog },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen, mobileOpen, onClose, onToggle }) {
  const location = useLocation();

  return (
    <>
      {/* Desktop / Collapsible Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${isOpen ? 'w-64' : 'w-20'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-slate-950 text-slate-100 sidebar-transition flex flex-col shadow-2xl lg:shadow-none border-r border-slate-800
        `}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <Building2 size={22} className="text-white" />
            </div>
            {isOpen && (
              <div className="truncate">
                <h1 className="text-base font-extrabold tracking-tight text-white leading-tight">Buildium-solution</h1>
                <p className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">Bangladesh CMS</p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1 scrollbar-thin">
          {navItems.map((item, i) => {
            if (item.divider) {
              return isOpen ? (
                <div key={i} className="pt-4 pb-1.5 px-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                </div>
              ) : (
                <div key={i} className="pt-2 border-t border-slate-800/60 my-2" />
              );
            }

            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                } ${!isOpen ? 'justify-center px-0' : ''}`}
                title={!isOpen ? item.label : undefined}
              >
                <Icon size={19} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {isOpen && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Toggle Bar */}
        <div className="hidden lg:block p-3 border-t border-slate-800/80 bg-slate-950/40">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors text-xs font-medium"
          >
            <ChevronLeft size={16} className={`transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`} />
            {isOpen && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
