import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { doctorAPI } from '../services/api';
import { FaSync, FaBell, FaSearch } from 'react-icons/fa';

import DoctorSidebar      from '../components/doctor/DoctorSidebar';
import DoctorOverview     from '../components/doctor/DoctorOverview';
import DoctorAppointments from '../components/doctor/DoctorAppointments';
import DoctorPatients     from '../components/doctor/DoctorPatients';
import DoctorSoapNote     from '../components/doctor/DoctorSoapNote';
import DoctorProfile      from '../components/doctor/DoctorProfile';

const SECTION_LABELS = {
  overview:     'Dashboard Overview',
  appointments: 'Appointments',
  patients:     'My Patients',
  'soap-note':  'SOAP Note Generator',
  profile:      'My Profile',
};

const DoctorDashboard = ({ initialSection = 'overview' }) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState(initialSection);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats:        null,
    appointments: [],
    patients:     [],
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, appointmentsRes, patientsRes] = await Promise.allSettled([
        doctorAPI.getStats(),
        doctorAPI.getAppointments(),
        doctorAPI.getPatients(),
      ]);
      setData({
        stats:        statsRes.status        === 'fulfilled' ? statsRes.value.data?.data                : null,
        appointments: appointmentsRes.status === 'fulfilled' ? (appointmentsRes.value.data?.data ?? [])  : [],
        patients:     patientsRes.status     === 'fulfilled' ? (patientsRes.value.data?.data     ?? [])  : [],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':     return <DoctorOverview stats={data.stats} appointments={data.appointments} onNavigate={setActiveSection} />;
      case 'appointments': return <DoctorAppointments appointments={data.appointments} onRefresh={handleRefresh} />;
      case 'patients':     return <DoctorPatients patients={data.patients} />;
      case 'soap-note':    return <DoctorSoapNote patients={data.patients} />;
      case 'profile':      return <DoctorProfile user={user} stats={data.stats} />;
      default:             return null;
    }
  };

  return (
    <div className="h-screen p-4 md:p-6 overflow-hidden bg-[radial-gradient(circle_at_10%_10%,#ffb070_0%,#fb923c_35%,#fdba74_100%)]">
      <div className="h-full w-full rounded-3xl bg-[#f5f6f8] p-3 md:p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)]">
        <div className="h-full flex overflow-hidden rounded-2xl border border-white/80 bg-white">
          <DoctorSidebar activeSection={activeSection} onNavigate={setActiveSection} />

          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-white border-b border-slate-100 px-4 md:px-6 py-4 flex items-center justify-between gap-3 shadow-sm flex-shrink-0">
              <div>
                <h1 className="text-lg md:text-xl font-extrabold text-slate-800">{SECTION_LABELS[activeSection]}</h1>
                <p className="text-xs text-slate-400">Doctor workspace and live care operations</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl min-w-64">
                  <FaSearch className="text-slate-400 text-sm" />
                  <input
                    readOnly
                    value="Search here..."
                    className="bg-transparent text-sm text-slate-400 outline-none w-full"
                  />
                </div>

                <button className="relative p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <FaBell />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] leading-4">4</span>
                </button>

                <div className="hidden sm:flex items-center gap-2 border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-xs font-bold">
                    {(user?.fullName || user?.username || 'D').charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-700 leading-tight">{user?.fullName || user?.username}</p>
                    <p className="text-[11px] text-slate-400 leading-tight">Doctor</p>
                  </div>
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  title="Refresh data"
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <FaSync className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f7f8fb]">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : (
                renderSection()
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
