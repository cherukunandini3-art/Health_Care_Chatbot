import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { FaFileAlt, FaExclamationCircle, FaChartBar } from 'react-icons/fa';

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

const SEVERITY_LABELS = {
  LOW: 'Low',
  NORMAL: 'Normal',
  MODERATE: 'Moderate',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-2.5 text-sm">
        <p className="font-semibold text-gray-700 capitalize">{label}</p>
        <p className="text-blue-600">{payload[0].value} mentions</p>
      </div>
    );
  }
  return null;
};

const ReportsAnalytics = ({ stats }) => {
  const symptomData = stats?.recentSymptoms
    ? Object.entries(stats.recentSymptoms)
        .map(([symptom, count]) => ({
          symptom: symptom.charAt(0).toUpperCase() + symptom.slice(1),
          count,
        }))
        .sort((a, b) => b.count - a.count)
    : [];

  const severityData = stats?.severityDistribution
    ? Object.entries(stats.severityDistribution).map(([key, val]) => ({
        name: SEVERITY_LABELS[key] || key,
        value: val,
      }))
    : [
        { name: 'Normal', value: 42 },
        { name: 'Moderate', value: 28 },
        { name: 'High', value: 18 },
        { name: 'Critical', value: 8 },
        { name: 'Low', value: 4 },
      ];

  const totalReports  = stats?.totalReports ?? 0;
  const ocrProcessed  = stats?.ocrProcessed  ?? totalReports;
  const mostAbnormal  = stats?.mostAbnormalTest ?? 'Blood Glucose';

  return (
    <div className="space-y-6">
      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <FaFileAlt className="text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">OCR Reports Processed</p>
              <p className="text-3xl font-bold text-orange-600 mt-0.5">{ocrProcessed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <FaExclamationCircle className="text-red-500" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Most Common Abnormal</p>
              <p className="text-xl font-bold text-red-600 mt-0.5 leading-tight">{mostAbnormal}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FaChartBar className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Reports</p>
              <p className="text-3xl font-bold text-blue-600 mt-0.5">{totalReports}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart — Top Symptoms */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Reported Symptoms</h3>
          {symptomData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-300">
              <div className="text-center">
                <FaChartBar className="text-4xl mx-auto mb-2" />
                <p className="text-sm">No symptom data yet</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={symptomData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="symptom" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart — Severity Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {severityData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [v, 'Reports']} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(val) => <span className="text-xs text-gray-600">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
