import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { FaChartLine, FaChartBar, FaChartPie, FaRobot, FaHeartbeat } from 'react-icons/fa';

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

const MONTHLY_DATA = [
  { month: 'Sep', consultations: 2, reports: 1 },
  { month: 'Oct', consultations: 4, reports: 2 },
  { month: 'Nov', consultations: 3, reports: 1 },
  { month: 'Dec', consultations: 6, reports: 3 },
  { month: 'Jan', consultations: 5, reports: 2 },
  { month: 'Feb', consultations: 8, reports: 4 },
];

const SYMPTOM_DATA = [
  { symptom: 'Headache',  count: 5 },
  { symptom: 'Fever',     count: 3 },
  { symptom: 'Fatigue',   count: 4 },
  { symptom: 'Cough',     count: 2 },
  { symptom: 'Nausea',    count: 1 },
  { symptom: 'Pain',      count: 3 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length)
    return (
      <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-2.5 text-sm">
        <p className="font-semibold text-gray-600 mb-1">{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="text-xs">{p.name}: {p.value}</p>)}
      </div>
    );
  return null;
};

const HealthAnalytics = ({ sessions, reports, appointments }) => {
  const totalSessions = sessions?.length || 0;
  const emergencies   = (sessions || []).filter(s => s.isEmergency).length;

  const severityData = [
    { name: 'Low Risk',    value: Math.max(0, totalSessions - emergencies - Math.floor(totalSessions * 0.3)) },
    { name: 'Medium Risk', value: Math.floor(totalSessions * 0.3) },
    { name: 'High Risk / Emergency', value: emergencies },
  ].filter(d => d.value > 0);

  const consultationData = sessions?.length > 0
    ? Object.entries(
        sessions.reduce((acc, s) => {
          const m = new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short' });
          acc[m] = (acc[m] || 0) + 1;
          return acc;
        }, {})
      ).map(([month, consultations]) => ({ month, consultations })).slice(-6)
    : MONTHLY_DATA;

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Consultations', value: totalSessions, icon: FaRobot,     color: 'bg-blue-500' },
          { label: 'Reports Analyzed',    value: reports?.length || 0, icon: FaChartLine, color: 'bg-orange-500' },
          { label: 'Appointments',        value: appointments?.length || 0, icon: FaChartBar, color: 'bg-violet-500' },
          { label: 'Emergency Alerts',    value: emergencies, icon: FaHeartbeat,  color: 'bg-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="text-white" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
            <p className="text-3xl font-bold text-gray-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly consultation line chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FaChartLine className="text-blue-500" />
            Monthly Consultations
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={consultationData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="consultations" stroke="#3b82f6" strokeWidth={2.5}
                dot={{ r: 4, fill: '#3b82f6' }} name="Consultations" />
              {consultationData[0]?.reports !== undefined && (
                <Line type="monotone" dataKey="reports" stroke="#f97316" strokeWidth={2}
                  strokeDasharray="5 3" dot={{ r: 3, fill: '#f97316' }} name="Reports" />
              )}
              <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-600">{v}</span>} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Severity pie chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FaChartPie className="text-emerald-500" />
            Severity Distribution
          </h3>
          {severityData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-300">
              <p className="text-sm">No data yet — start a consultation</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value">
                  {severityData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => [v, 'Sessions']} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Symptom bar chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <FaChartBar className="text-violet-500" />
          Most Commonly Reported Symptoms
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={SYMPTOM_DATA} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="symptom" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={40} name="Mentions" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HealthAnalytics;
