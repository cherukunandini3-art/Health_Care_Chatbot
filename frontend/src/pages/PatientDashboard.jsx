import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { patientAPI, chatAPI, reportAPI } from '../services/api';

// Patient sidebar + sections
import PatientSidebar       from '../components/patient/PatientSidebar';
import PatientOverview      from '../components/patient/PatientOverview';
import PatientChat          from '../components/patient/PatientChat';
import PatientReports       from '../components/patient/PatientReports';
import PatientAppointments  from '../components/patient/PatientAppointments';
import HealthAnalytics      from '../components/patient/HealthAnalytics';
import EmergencyPage        from '../components/patient/EmergencyPage';
import PatientProfile       from '../components/patient/PatientProfile';
import AdvancedHealthSuite  from '../components/patient/AdvancedHealthSuite';

import { FaSync } from 'react-icons/fa';

const SECTION_LABELS = {
  overview:     'Dashboard Overview',
  chat:         'AI Health Assistant',
  reports:      'Medical Reports',
  appointments: 'Appointments',
  analytics:    'Health Analytics',
  suite:        'Smart Health Suite',
  emergency:    'Emergency',
  profile:      'My Profile',
};

const PatientDashboard = ({ initialSection = 'overview' }) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState(initialSection);
  const [refreshKey, setRefreshKey]       = useState(0);
  const [loading, setLoading]             = useState(true);
  const [data, setData] = useState({
    stats:        null,
    profile:      null,
    sessions:     [],
    reports:      [],
    appointments: [],
    doctors:      [],
  });

  const fetchAll = useCallback(async (signal) => {
    setLoading(true);
    try {
      const [statsRes, profileRes, sessionsRes, reportsRes, appointmentsRes, doctorsRes] =
        await Promise.allSettled([
          patientAPI.getStats(),
          patientAPI.getProfile(),
          chatAPI.getSessions(),
          reportAPI.getReports(),
          patientAPI.getAppointments(),
          patientAPI.getDoctors(),
        ]);

      if (signal?.aborted) return;

      setData({
        stats:        statsRes.status        === 'fulfilled' ? statsRes.value.data?.data        : null,
        profile:      profileRes.status      === 'fulfilled' ? profileRes.value.data?.data      : null,
        sessions:     sessionsRes.status     === 'fulfilled' ? (sessionsRes.value.data?.data ?? sessionsRes.value.data ?? []) : [],
        reports:      reportsRes.status      === 'fulfilled' ? (reportsRes.value.data?.data   ?? reportsRes.value.data   ?? []) : [],
        appointments: appointmentsRes.status === 'fulfilled' ? (appointmentsRes.value.data?.data ?? appointmentsRes.value.data ?? []) : [],
        doctors:      doctorsRes.status      === 'fulfilled' ? (doctorsRes.value.data?.data    ?? doctorsRes.value.data    ?? []) : [],
      });
    } catch (e) {
      if (e?.name !== 'AbortError') console.error(e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAll(controller.signal);
    return () => controller.abort();
  }, [fetchAll, refreshKey]);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <PatientOverview
          stats={data.stats} sessions={data.sessions} reports={data.reports}
          appointments={data.appointments} onNavigate={setActiveSection} />;
      case 'chat':
        return <PatientChat />;
      case 'reports':
        return <PatientReports reports={data.reports} onRefresh={handleRefresh} />;
      case 'appointments':
        return <PatientAppointments appointments={data.appointments} doctors={data.doctors} onRefresh={handleRefresh} />;
      case 'analytics':
        return <HealthAnalytics stats={data.stats} sessions={data.sessions} reports={data.reports} appointments={data.appointments} />;
      case 'suite':
        return <AdvancedHealthSuite />;
      case 'emergency':
        return <EmergencyPage stats={data.stats} sessions={data.sessions} />;
      case 'profile':
        return <PatientProfile user={user} profile={data.profile} onRefresh={handleRefresh} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <PatientSidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        user={user}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-gray-800">{SECTION_LABELS[activeSection]}</h1>
            <p className="text-xs text-gray-400">Welcome back, {user?.fullName || user?.username}</p>
          </div>
          <div className="flex items-center gap-3">
            {activeSection === 'emergency' && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full animate-pulse">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Emergency
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh data"
              className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <FaSync className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Scrollable content area */}
        <main className={activeSection === 'chat'
          ? 'flex-1 overflow-hidden'
          : 'flex-1 overflow-y-auto p-6'
        }>
          {loading && activeSection === 'overview' ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            renderSection()
          )}
        </main>
      </div>
    </div>
  );
};

export default PatientDashboard;
