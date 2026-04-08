import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  FaChartPie, FaUsers, FaComments, FaFileAlt,
  FaCalendarAlt, FaChartLine, FaSignOutAlt,
  FaBars, FaTimes, FaHeartbeat, FaShieldAlt,
} from 'react-icons/fa';

const NAV_ITEMS = [
  { id: 'overview',      label: 'Overview',      icon: FaChartPie },
  { id: 'users',         label: 'Users',          icon: FaUsers },
  { id: 'chats',         label: 'Chats',          icon: FaComments },
  { id: 'reports',       label: 'Reports',        icon: FaFileAlt },
  { id: 'appointments',  label: 'Appointments',   icon: FaCalendarAlt },
  { id: 'analytics',     label: 'Analytics',      icon: FaChartLine },
];

const AdminSidebar = ({ activeSection, onSectionChange }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNav = (id) => {
    onSectionChange(id);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
          <FaHeartbeat className="text-white text-lg" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight">HealthAI</p>
            <p className="text-slate-400 text-xs">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Admin badge */}
      {!collapsed && (
        <div className="mx-4 mt-4 mb-2 px-3 py-2 rounded-lg bg-slate-700/60 border border-slate-600">
          <div className="flex items-center gap-2">
            <FaShieldAlt className="text-blue-400 text-sm flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{user?.fullName || user?.username}</p>
              <p className="text-blue-400 text-xs">Administrator</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title={collapsed ? label : ''}
            >
              <Icon className={`flex-shrink-0 text-base ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
          title={collapsed ? 'Logout' : ''}
        >
          <FaSignOutAlt className="flex-shrink-0 text-base" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-800 text-white p-2 rounded-lg shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-800 z-50 transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen bg-slate-800 sticky top-0 transition-all duration-300 flex-shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-slate-600 border-2 border-slate-800 text-white flex items-center justify-center hover:bg-blue-500 transition-colors"
        >
          {collapsed
            ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          }
        </button>
        <SidebarContent />
      </aside>
    </>
  );
};

export default AdminSidebar;
