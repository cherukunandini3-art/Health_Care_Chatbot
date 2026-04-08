import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  FaChartPie, FaComments, FaFileAlt, FaCalendarAlt,
  FaChartLine, FaExclamationCircle, FaUser, FaSignOutAlt,
  FaBars, FaTimes, FaHeartbeat, FaShieldAlt, FaLayerGroup,
} from 'react-icons/fa';

const NAV_ITEMS = [
  { id: 'overview',      label: 'Overview',         icon: FaChartPie },
  { id: 'chat',          label: 'AI Chat',           icon: FaComments },
  { id: 'reports',       label: 'Medical Reports',   icon: FaFileAlt },
  { id: 'appointments',  label: 'Appointments',      icon: FaCalendarAlt },
  { id: 'analytics',     label: 'Health Analytics',  icon: FaChartLine },
  { id: 'suite',         label: 'Smart Suite',       icon: FaLayerGroup },
  { id: 'emergency',     label: 'Emergency',         icon: FaExclamationCircle, danger: true },
  { id: 'profile',       label: 'My Profile',        icon: FaUser },
];

const PatientSidebar = ({ activeSection, onNavigate }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const handleNav = (id) => { onNavigate(id); setMobileOpen(false); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg">
          <FaHeartbeat className="text-white text-lg" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight">HealthAI</p>
            <p className="text-slate-400 text-xs">Patient Portal</p>
          </div>
        )}
      </div>

      {/* Patient badge */}
      {!collapsed && (
        <div className="mx-4 mt-4 mb-2 px-3 py-2 rounded-lg bg-slate-700/60 border border-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {(user?.fullName || user?.username || '?').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{user?.fullName || user?.username}</p>
              <p className="text-emerald-400 text-xs flex items-center gap-1">
                <FaShieldAlt className="text-[10px]" /> Patient
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon, danger }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                danger && !isActive
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                  : isActive
                  ? danger
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                    : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title={collapsed ? label : ''}
            >
              <Icon className={`flex-shrink-0 text-base ${isActive ? 'text-white' : danger ? 'text-red-400 group-hover:text-red-300' : 'text-slate-400 group-hover:text-white'}`} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && danger && !isActive && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
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
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-800 z-50 transform transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col h-screen bg-slate-800 sticky top-0 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-slate-600 border-2 border-slate-800 text-white flex items-center justify-center hover:bg-emerald-500 transition-colors"
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

export default PatientSidebar;
