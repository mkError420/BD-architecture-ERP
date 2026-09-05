import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, LogOut, User, ChevronDown, Building2, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Header({
  onMenuClick,
  sidebarOpen,
  isProjectPage,
  projectSidebarOpen,
  onToggleProjectSidebar,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    admin: 'bg-red-50 text-red-700 border-red-200',
    project_manager: 'bg-blue-50 text-blue-700 border-blue-200',
    engineer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accountant: 'bg-purple-50 text-purple-700 border-purple-200',
    site_supervisor: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 flex-shrink-0 sticky top-0 z-20 shadow-xs">
      {/* Left Menu & Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu size={22} />
        </button>

        {/* Brand on small screens */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(to bottom right, #A0975A, #8a824a)' }}>
            <Building2 size={18} />
          </div>
          <span className="font-extrabold text-slate-900 text-sm hidden sm:inline">Buildium-solution</span>
        </div>

        {/* Project Overview Sidebar Toggle when on a project page */}
        {isProjectPage && (
          <button
            onClick={onToggleProjectSidebar}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              projectSidebarOpen
                ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                : 'bg-primary-50 text-primary-800 border-primary-300 hover:bg-primary-100 shadow-xs'
            }`}
            title={projectSidebarOpen ? "Collapse Project Overview Sidebar" : "Open Project Overview Sidebar"}
          >
            <FileText size={15} className="text-primary-700 flex-shrink-0" />
            <span className="hidden sm:inline">Project Overview</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
              projectSidebarOpen ? 'bg-slate-200 text-slate-700' : 'bg-primary-200/80 text-primary-900'
            }`}>
              {projectSidebarOpen ? 'Collapse' : 'Expand'}
            </span>
          </button>
        )}

        {/* Global Search Bar */}
        <div className={`${searchOpen ? 'flex absolute inset-x-2 top-2 z-30 bg-white p-2 rounded-2xl shadow-lg border border-slate-200' : 'hidden md:flex'} items-center relative flex-1 max-w-md`}>
          <Search size={16} className="absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects, clients, vouchers..."
            className="pl-9 pr-8 py-2 w-full bg-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all border border-transparent focus:border-blue-300"
          />
          {searchOpen && (
            <button onClick={() => setSearchOpen(false)} className="text-xs text-slate-400 font-bold ml-2">
              Close
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Mobile Search Toggle */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
        >
          <Search size={19} />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
        </button>

        {/* User Profile Pill */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs" style={{ background: 'linear-gradient(to bottom right, #A0975A, #8a824a)' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="hidden sm:block text-left max-w-[130px]">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate">{user?.name || 'Administrator'}</p>
              <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase border mt-0.5 ${roleColors[user?.role] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {user?.role?.replace('_', ' ') || 'ADMIN'}
              </span>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-[fadeInUp_0.15s_ease-out]">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Admin User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@construction.com'}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User size={15} className="text-slate-400" /> Account Settings
              </button>
              <hr className="my-1 border-slate-100" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
