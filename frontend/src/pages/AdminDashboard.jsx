import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import { adminAPI } from '../services/api';

import AdminSidebar from '../components/admin/AdminSidebar';
import OverviewCards from '../components/admin/OverviewCards';
import UsersTable from '../components/admin/UsersTable';
import ChatMonitor from '../components/admin/ChatMonitor';
import ReportsAnalytics from '../components/admin/ReportsAnalytics';
import AppointmentsTable from '../components/admin/AppointmentsTable';
import SystemAnalytics from '../components/admin/SystemAnalytics';

import { FaSync, FaChartPie, FaUsers, FaComments, FaFileAlt, FaCalendarAlt, FaChartLine } from 'react-icons/fa';

const SECTION_META = {
  overview:     { title: 'Overview',            subtitle: 'System summary and key metrics', icon: FaChartPie },
  users:        { title: 'User Management',      subtitle: 'Manage patients, doctors & admins', icon: FaUsers },
  chats:        { title: 'Chat Monitoring',      subtitle: 'Review all AI chat sessions', icon: FaComments },
  reports:      { title: 'Report Analytics',     subtitle: 'OCR reports and symptom analysis', icon: FaFileAlt },
  appointments: { title: 'Appointment Manager',  subtitle: 'View and control all appointments', icon: FaCalendarAlt },
  analytics:    { title: 'System Analytics',     subtitle: 'AI usage, growth and performance', icon: FaChartLine },
};

const AdminDashboard = () => {
  const { hasRole, loading: authLoading } = useAuth();

  const [activeSection, setActiveSection] = useState('overview');
  const [data, setData] = useState({ stats: null, users: [], sessions: [], appointments: [] });
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchAll = useCallback(async (signal) => {
    try {
      const [statsRes, usersRes, sessionsRes, apptsRes] = await Promise.allSettled([
        adminAPI.getDashboardStats(),
        adminAPI.getAllUsers(),
        adminAPI.getAllSessions(),
        adminAPI.getAllAppointments(),
      ]);
      if (signal?.aborted) return;
      setData({
        stats:        statsRes.status === 'fulfilled' && statsRes.value.data?.success  ? statsRes.value.data.data  : null,
        users:        usersRes.status === 'fulfilled' && usersRes.value.data?.success  ? usersRes.value.data.data  : [],
        sessions:     sessionsRes.status === 'fulfilled' && sessionsRes.value.data?.success ? sessionsRes.value.data.data : [],
        appointments: apptsRes.status === 'fulfilled' && apptsRes.value.data?.success  ? apptsRes.value.data.data  : [],
      });
      setLastRefresh(new Date());
    } catch (e) {
      if (e?.name !== 'AbortError' && e?.code !== 'ERR_CANCELED') console.error(e);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchAll(controller.signal);
    return () => controller.abort();
  }, [fetchAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll(null);
    setRefreshing(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const meta = SECTION_META[activeSection] || SECTION_META.overview;
  const HeaderIcon = meta.icon;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 pl-10 lg:pl-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <HeaderIcon className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">{meta.title}</h1>
              <p className="text-xs text-gray-400">{meta.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="hidden sm:block text-xs text-gray-400">
                Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <FaSync className={`text-xs ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-400 text-sm">Loading dashboard data…</p>
              </div>
            </div>
          ) : (
            <>
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <OverviewCards stats={data.stats} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Recent Sessions */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Recent Sessions</p>
                      {data.sessions.slice(0, 5).map(s => (
                        <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.isEmergency ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          <span className="text-sm text-gray-700 truncate">{s.title || 'Session'}</span>
                          <span className="text-xs text-gray-400 ml-auto flex-shrink-0">@{s.username}</span>
                        </div>
                      ))}
                      {data.sessions.length === 0 && <p className="text-xs text-gray-300">No sessions</p>}
                    </div>
                    {/* Pending Appointments */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Pending Appointments</p>
                      {data.appointments.filter(a => a.status === 'PENDING').slice(0, 5).map(a => (
                        <div key={a.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{a.patient?.fullName || 'Patient'}</span>
                          <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                            {a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : 'TBD'}
                          </span>
                        </div>
                      ))}
                      {data.appointments.filter(a => a.status === 'PENDING').length === 0 && (
                        <p className="text-xs text-gray-300">No pending appointments</p>
                      )}
                    </div>
                    {/* Recent Users */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Recent Users</p>
                      {data.users.slice(0, 5).map(u => (
                        <div key={u.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {(u.fullName || u.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-700 truncate">{u.fullName || u.username}</span>
                          <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                            {(typeof u.roles?.[0] === 'string' ? u.roles[0] : u.roles?.[0]?.name)?.replace('ROLE_', '') || 'User'}
                          </span>
                        </div>
                      ))}
                      {data.users.length === 0 && <p className="text-xs text-gray-300">No users</p>}
                    </div>
                  </div>
                </div>
              )}
              {activeSection === 'users'        && <UsersTable        users={data.users}              onRefresh={handleRefresh} />}
              {activeSection === 'chats'        && <ChatMonitor       sessions={data.sessions}        onRefresh={handleRefresh} />}
              {activeSection === 'reports'      && <ReportsAnalytics  stats={data.stats} />}
              {activeSection === 'appointments' && <AppointmentsTable appointments={data.appointments} onRefresh={handleRefresh} />}
              {activeSection === 'analytics'    && <SystemAnalytics   stats={data.stats} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
