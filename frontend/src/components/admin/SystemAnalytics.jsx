import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  FaRobot, FaClock, FaExclamationTriangle, FaChartLine,
  FaUsers, FaComments,
} from 'react-icons/fa';

const PIE_COLORS = ['#3b82f6', '#0ea5e9', '#6366f1'];

// Placeholder monthly growth data when real data is unavailable
const PLACEHOLDER_MONTHLY = [
  { month: 'Aug', users: 8, sessions: 12 },
  { month: 'Sep', users: 15, sessions: 22 },
  { month: 'Oct', users: 22, sessions: 38 },
  { month: 'Nov', users: 30, sessions: 51 },
  { month: 'Dec', users: 41, sessions: 67 },
  { month: 'Jan', users: 55, sessions: 89 },
  { month: 'Feb', users: 70, sessions: 110 },
];

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5`}>
    <div className="flex items-start gap-3">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="text-white text-lg" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-2.5 text-sm">
        <p className="font-semibold text-gray-600 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="text-xs">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const SystemAnalytics = ({ stats }) => {
  const totalMessages    = stats?.totalMessages         ?? 0;
  const emergencies      = stats?.emergencySessions     ?? 0;
  const totalSessions    = stats?.totalChatSessions     ?? 0;
  const emergencyPct     = totalSessions > 0 ? ((emergencies / totalSessions) * 100).toFixed(1) : '0.0';
  const monthlyData      = stats?.monthlyGrowth         ?? PLACEHOLDER_MONTHLY;

  const sessionDistData  = [
    { name: 'Regular', value: Math.max(0, totalSessions - emergencies) },
    { name: 'Emergency', value: emergencies },
    { name: 'Active', value: stats?.activeSessionsToday ?? Math.floor(totalSessions * 0.1) },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FaRobot}
          label="AI Interactions"
          value={totalMessages.toLocaleString()}
          sub="Total AI messages sent"
          color="bg-blue-500"
        />
        <StatCard
          icon={FaClock}
          label="Avg Response Time"
          value={stats?.avgResponseTime ?? '< 2s'}
          sub="Per AI message"
          color="bg-violet-500"
        />
        <StatCard
          icon={FaExclamationTriangle}
          label="Emergency Rate"
          value={`${emergencyPct}%`}
          sub={`${emergencies} emergency sessions`}
          color="bg-red-500"
        />
        <StatCard
          icon={FaUsers}
          label="Total Users"
          value={(stats?.totalUsers ?? 0).toLocaleString()}
          sub="Registered accounts"
          color="bg-emerald-500"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Line Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FaChartLine className="text-blue-500" />
            User & Session Growth (Monthly)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="users" stroke="#3b82f6"
                strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }}
                name="Users"
              />
              <Line
                type="monotone" dataKey="sessions" stroke="#a855f7"
                strokeWidth={2} dot={{ r: 3, fill: '#a855f7' }}
                strokeDasharray="5 3"
                name="Sessions"
              />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Session Distribution Pie */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FaComments className="text-violet-500" />
            Session Distribution
          </h3>
          {sessionDistData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-300">
              <p className="text-sm">No session data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sessionDistData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value"
                >
                  {sessionDistData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Sessions']} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* AI Usage Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <FaRobot className="text-blue-500" />
          Monthly AI Usage
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sessions" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} name="Sessions" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SystemAnalytics;
