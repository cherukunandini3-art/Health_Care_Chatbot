import React from 'react';
import {
  FaCalendarAlt, FaUsers, FaClock, FaCheckCircle,
  FaTimesCircle, FaClipboardList, FaArrowRight, FaChartLine,
} from 'react-icons/fa';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

const formatDate = (v) =>
  v ? new Date(v).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const StatCard = ({ icon: Icon, label, value, color, border }) => (
  <div className={`bg-white rounded-2xl p-4 border ${border} shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
    <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${color} mb-3`}>
      <Icon className="text-white text-lg" />
    </div>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-800">{value ?? 0}</p>
  </div>
);

const DoctorOverview = ({ stats, appointments, onNavigate }) => {
  const recent = (appointments || []).slice(0, 5);
  const today = new Date().toDateString();
  const todayAppts = (appointments || []).filter(
    a => new Date(a.appointmentDate).toDateString() === today
  );

  const STATUS_STYLES = {
    PENDING:   'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
  };

  const visitByDepartment = [
    { name: 'General', value: Math.max(1, stats?.confirmed || 0), color: '#f97316' },
    { name: 'Follow-up', value: Math.max(1, stats?.pending || 0), color: '#fb7185' },
    { name: 'Specialist', value: Math.max(1, stats?.completed || 0), color: '#06b6d4' },
  ];

  const monthlyTrendMap = (appointments || []).reduce((acc, a) => {
    const d = new Date(a.appointmentDate);
    const key = d.toLocaleString('en-US', { month: 'short' });
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendData = monthOrder.map((m) => ({ month: m, visits: monthlyTrendMap[m] || 0 }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={FaCalendarAlt} label="Total Appts"  value={stats?.totalAppointments} color="bg-gradient-to-br from-blue-500 to-blue-600"    border="border-blue-100" />
        <StatCard icon={FaUsers}       label="Patients"     value={stats?.totalPatients}      color="bg-gradient-to-br from-indigo-500 to-indigo-600"  border="border-indigo-100" />
        <StatCard icon={FaClock}       label="Pending"      value={stats?.pending}            color="bg-gradient-to-br from-yellow-500 to-amber-500"    border="border-yellow-100" />
        <StatCard icon={FaCheckCircle} label="Completed"    value={stats?.completed}          color="bg-gradient-to-br from-emerald-500 to-emerald-600" border="border-emerald-100" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-800 mb-4">Patient Visit by Department</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={visitByDepartment} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>
                  {visitByDepartment.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {visitByDepartment.map((item) => (
              <div key={item.name} className="text-xs text-slate-500 flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <FaChartLine className="text-orange-500" /> Hospital Survey
            </h2>
            <span className="text-xs font-semibold bg-orange-50 text-orange-600 px-2 py-1 rounded-full">Monthly</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="visits" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <FaClipboardList className="text-indigo-500" /> Appointment Activity
            </h2>
            <button
              onClick={() => onNavigate('appointments')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              View all <FaArrowRight className="text-[10px]" />
            </button>
          </div>
          {recent.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No appointments yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                    <th className="py-2 pr-3">Patient</th>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((a) => (
                    <tr key={a.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 pr-3 text-slate-700 font-medium">{a.patient?.fullName || a.patient?.username || `Patient #${a.patient?.id}`}</td>
                      <td className="py-2.5 pr-3 text-slate-500">{formatDate(a.appointmentDate)}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[a.status] || 'bg-gray-100 text-gray-500'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-500 max-w-[180px] truncate">{a.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-[#16155a] rounded-2xl p-5 text-white shadow-md">
          <h2 className="font-bold mb-4">Status Snapshot</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2">
              <span className="text-sm">Confirmed</span>
              <span className="text-xs font-semibold bg-emerald-300/20 text-emerald-200 px-2 py-1 rounded-full">{stats?.confirmed ?? 0}</span>
            </div>
            <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2">
              <span className="text-sm">Pending</span>
              <span className="text-xs font-semibold bg-amber-300/20 text-amber-200 px-2 py-1 rounded-full">{stats?.pending ?? 0}</span>
            </div>
            <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2">
              <span className="text-sm">Completed</span>
              <span className="text-xs font-semibold bg-cyan-300/20 text-cyan-200 px-2 py-1 rounded-full">{stats?.completed ?? 0}</span>
            </div>
            <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2">
              <span className="text-sm">Cancelled</span>
              <span className="text-xs font-semibold bg-rose-300/20 text-rose-200 px-2 py-1 rounded-full">{stats?.cancelled ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's appointments */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <FaCalendarAlt className="text-blue-500" /> Today's Appointments
            </h2>
            <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-1 rounded-full">{todayAppts.length}</span>
          </div>
          {todayAppts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No appointments today</p>
          ) : (
            <ul className="space-y-3">
              {todayAppts.map(a => (
                <li key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{a.patient?.fullName || a.patient?.username || `Patient #${a.patient?.id}`}</p>
                    <p className="text-xs text-gray-400">{formatDate(a.appointmentDate)}</p>
                    {a.reason && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{a.reason}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[a.status] || 'bg-gray-100 text-gray-500'}`}>
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Outcome mix */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <FaTimesCircle className="text-rose-400" /> Outcome Mix
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
              <p className="text-xs text-emerald-600">Completed</p>
              <p className="text-2xl font-bold text-emerald-700">{stats?.completed ?? 0}</p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs text-blue-600">Confirmed</p>
              <p className="text-2xl font-bold text-blue-700">{stats?.confirmed ?? 0}</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
              <p className="text-xs text-amber-600">Pending</p>
              <p className="text-2xl font-bold text-amber-700">{stats?.pending ?? 0}</p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-3">
              <p className="text-xs text-rose-600">Cancelled</p>
              <p className="text-2xl font-bold text-rose-700">{stats?.cancelled ?? 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorOverview;
