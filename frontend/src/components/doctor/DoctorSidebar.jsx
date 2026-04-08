import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  FaChartPie, FaCalendarAlt, FaUsers, FaNotesMedical,
  FaUser, FaSignOutAlt, FaBars, FaTimes, FaStethoscope, FaShieldAlt,
} from 'react-icons/fa';

const NAV_ITEMS = [
  { id: 'overview',      label: 'Overview',          icon: FaChartPie },
  { id: 'appointments',  label: 'Appointments',       icon: FaCalendarAlt },
  { id: 'patients',      label: 'My Patients',        icon: FaUsers },
  { id: 'soap-note',     label: 'SOAP Note Generator',icon: FaNotesMedical },
  { id: 'profile',       label: 'My Profile',         icon: FaUser },
];

const DoctorSidebar = ({ activeSection, onNavigate }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const handleNav = (id) => { onNavigate(id); setMobileOpen(false); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200 bg-white">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg">
          <FaStethoscope className="text-white text-lg" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-slate-900 font-bold text-sm leading-tight">E-Health Tips</p>
            <p className="text-slate-400 text-xs">Doctor Portal</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="ml-auto text-slate-400 hover:text-slate-700 transition-colors hidden lg:block"
        >
          {collapsed ? <FaBars /> : <FaTimes />}
        </button>
      </div>

      {/* Doctor badge */}
      {!collapsed && (
        <div className="mx-4 mt-4 mb-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {(user?.fullName || user?.username || '?').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-slate-800 text-sm font-medium truncate">{user?.fullName || user?.username}</p>
              <p className="text-orange-600 text-xs flex items-center gap-1">
                <FaShieldAlt className="text-[10px]" /> Doctor
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              title={collapsed ? label : ''}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`flex-shrink-0 text-base ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-200">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : ''}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
        >
          <FaSignOutAlt className="flex-shrink-0 text-base" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-orange-500 text-white shadow-lg"
      >
        <FaBars />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-white" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-slate-200 flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
      </aside>
    </>
  );
};

export default DoctorSidebar;
