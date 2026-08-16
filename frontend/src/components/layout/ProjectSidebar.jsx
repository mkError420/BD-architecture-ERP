import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Info,
  DollarSign,
  ShieldCheck,
  FileText,
  Calendar,
  ShoppingCart,
  Package,
  Users,
  Wrench,
  Wallet,
  Truck,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';

const projectMenuItems = [
  {
    id: 'project-info',
    label: 'Project Info',
    icon: Info,
    path: 'info',
  },
  {
    id: 'client-payments',
    label: 'Client Payments',
    icon: DollarSign,
    hasSubmenu: true,
    submenu: [
      { label: 'Payment History', path: 'payments/history' },
      { label: 'Payment Plans', path: 'payments/plans' },
      { label: 'Invoices', path: 'payments/invoices' },
    ],
  },
  {
    id: 'security-deposits',
    label: 'Security Deposits',
    icon: ShieldCheck,
    path: 'security-deposits',
  },
  {
    id: 'boq',
    label: 'BOQ',
    icon: FileText,
    hasSubmenu: true,
    submenu: [
      { label: 'Bill of Quantities', path: 'boq/items' },
      { label: 'Cost Estimates', path: 'boq/estimates' },
      { label: 'Rate Analysis', path: 'boq/rates' },
    ],
  },
  {
    id: 'project-scheduling',
    label: 'Project Scheduling',
    icon: Calendar,
    path: 'scheduling',
  },
  {
    id: 'purchases',
    label: 'Purchases',
    icon: ShoppingCart,
    hasSubmenu: true,
    submenu: [
      { label: 'Purchase Orders', path: 'purchases/orders' },
      { label: 'Purchase Requests', path: 'purchases/requests' },
      { label: 'Quotations', path: 'purchases/quotations' },
    ],
  },
  {
    id: 'stock-management',
    label: 'Stock Management',
    icon: Package,
    hasSubmenu: true,
    submenu: [
      { label: 'Inventory', path: 'stock/inventory' },
      { label: 'Stock Transfers', path: 'stock/transfers' },
      { label: 'Stock Adjustments', path: 'stock/adjustments' },
    ],
  },
  {
    id: 'labour-wage-slips',
    label: 'Labour Wage Slips',
    icon: Users,
    path: 'labour-wages',
  },
  {
    id: 'tools-management',
    label: 'Tools Management',
    icon: Wrench,
    hasSubmenu: true,
    submenu: [
      { label: 'Tools Inventory', path: 'tools/inventory' },
      { label: 'Tool Assignments', path: 'tools/assignments' },
      { label: 'Tool Maintenance', path: 'tools/maintenance' },
    ],
  },
  {
    id: 'salary-slips',
    label: 'Salary Slips & Payments',
    icon: Wallet,
    path: 'salary',
  },
  {
    id: 'vehicle-work-slips',
    label: 'Vehicle Work Slips & Payments',
    icon: Truck,
    path: 'vehicles',
  },
];

export default function ProjectSidebar({ isOpen, onClose, projectId }) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menuId) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const isActive = (item) => {
    if (item.path) {
      return location.pathname.endsWith(item.path);
    }
    if (item.submenu) {
      return item.submenu.some((sub) => location.pathname.endsWith(sub.path));
    }
    return false;
  };

  const isSubActive = (subPath) => {
    return location.pathname.endsWith(subPath);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${isOpen ? 'w-72' : 'w-0 lg:w-72'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-white border-r border-gray-200 sidebar-transition flex flex-col shadow-xl lg:shadow-none
          overflow-hidden
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(to bottom right, #A0975A, #8a824a)' }}>
              <FileText size={18} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 truncate">Project Overview</h2>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {projectMenuItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedMenus[item.id];
            const active = isActive(item);

            return (
              <div key={item.id}>
                {/* Main Menu Item */}
                {item.hasSubmenu ? (
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={active ? 'text-blue-600' : 'text-gray-500'} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-400" />
                    )}
                  </button>
                ) : (
                  <NavLink
                    to={`/projects/${projectId}/${item.path}`}
                    onClick={onClose}
                    className={({ isActive: linkActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        linkActive || active
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <Icon size={16} className={active ? 'text-blue-600' : 'text-gray-500'} />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                )}

                {/* Submenu */}
                {item.hasSubmenu && isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.submenu.map((sub) => (
                      <NavLink
                        key={sub.path}
                        to={`/projects/${projectId}/${sub.path}`}
                        onClick={onClose}
                        className={({ isActive: linkActive }) =>
                          `block px-3 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                            linkActive || isSubActive(sub.path)
                              ? 'bg-blue-100 text-blue-800'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`
                        }
                      >
                        {sub.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-[10px] text-gray-500 text-center">
            Project ID: {projectId}
          </div>
        </div>
      </aside>
    </>
  );
}
