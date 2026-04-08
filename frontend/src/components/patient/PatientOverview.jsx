import React from 'react';
import {
  FaComments, FaCalendarAlt, FaFileAlt, FaHeartbeat,
  FaExclamationTriangle, FaCheckCircle, FaClock, FaRobot,
} from 'react-icons/fa';

const RISK_CONFIG = {
  LOW:    { label: 'Low Risk',    bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  MEDIUM: { label: 'Medium Risk', bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500' },
  HIGH:   { label: 'High Risk',   bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500' },
};

const formatDate = (v) => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const timeAgo = (v) => {
  if (!v) return '—';
  const diff = Date.now() - new Date(v);
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const StatCard = ({ icon: Icon, label, value, sub, color, border }) => (
  <div className={`group bg-white rounded-xl p-5 border ${border} shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
    <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${color} mb-3 group-hover:scale-110 transition-transform duration-200`}>
      <Icon className="text-white text-lg" />
    </div>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-800">{value ?? 0}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const PatientOverview = ({ stats, sessions, reports, appointments, onNavigate }) => {
  const riskLevel = stats?.riskLevel || 'LOW';
  const riskCfg   = RISK_CONFIG[riskLevel] || RISK_CONFIG.LOW;

  const upcomingAppts = (appointments || []).filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED');
  const recentSessions = (sessions || []).slice(0, 5);
  const lastSession = sessions?.[0];

  const activityItems = [
    ...(sessions || []).slice(0, 3).map(s => ({
      icon: FaRobot,
      color: s.isEmergency ? 'text-red-500 bg-red-50' : 'text-blue-500 bg-blue-50',
      text: s.isEmergency ? `Emergency chat: "${s.title || 'Session'}"` : `AI Chat: "${s.title || 'Session'}"`,
      time: s.lastMessageAt || s.createdAt,
    })),
    ...(reports || []).slice(0, 2).map(r => ({
      icon: FaFileAlt,
      color: 'text-orange-500 bg-orange-50',
      text: `Report uploaded: "${r.fileName}"`,
      time: r.uploadedAt,
    })),
    ...(appointments || []).slice(0, 2).map(a => ({
      icon: FaCalendarAlt,
      color: 'text-violet-500 bg-violet-50',
      text: `Appointment ${a.status?.toLowerCase()} with Dr. ${a.doctor?.fullName || 'Unknown'}`,
      time: a.createdAt,
    })),
  ]
    .filter(i => i.time)
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FaComments}     label="AI Consultations" value={sessions?.length}       sub="Total chat sessions"   color="bg-gradient-to-br from-blue-500 to-blue-600"      border="border-blue-100" />
        <StatCard icon={FaCalendarAlt}  label="Upcoming Appts"   value={upcomingAppts.length}   sub="Pending or confirmed"  color="bg-gradient-to-br from-violet-500 to-violet-600"   border="border-violet-100" />
        <StatCard icon={FaFileAlt}      label="Reports Uploaded"  value={reports?.length}        sub="Medical documents"     color="bg-gradient-to-br from-orange-500 to-orange-600"   border="border-orange-100" />
        <div className={`bg-white rounded-xl p-5 border ${riskCfg.border} shadow-sm hover:shadow-md transition-all duration-200`}>
          <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${riskCfg.bg} mb-3`}>
            <FaHeartbeat className={`text-lg ${riskCfg.text}`} />
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Health Risk</p>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${riskCfg.bg} ${riskCfg.text}`}>
            <span className={`w-2 h-2 rounded-full ${riskCfg.dot}`} />
            {riskCfg.label}
          </div>
        </div>
      </div>

      {/* Last AI Diagnosis + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Last AI Diagnosis */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <FaRobot className="text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-700">Last AI Consultation</h3>
          </div>
          {lastSession ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-800">{lastSession.title || 'Health Consultation'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(lastSession.lastMessageAt || lastSession.createdAt)}</p>
                </div>
                {lastSession.isEmergency && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex-shrink-0">
                    <FaExclamationTriangle className="text-[9px]" /> Emergency
                  </span>
                )}
              </div>
              <button
                onClick={() => onNavigate('chat')}
                className="w-full py-2 text-sm font-medium text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-50 transition-colors"
              >
                View Chat History →
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <FaComments className="text-4xl text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No consultations yet</p>
              <button
                onClick={() => onNavigate('chat')}
                className="mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Start AI Chat
              </button>
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h3>
          {activityItems.length === 0 ? (
            <div className="text-center py-6">
              <FaClock className="text-4xl text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No recent activity</p>
            </div>
          ) : (
            <ol className="relative border-l border-gray-100 ml-2 space-y-4">
              {activityItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={i} className="ml-5">
                    <span className={`absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full ${item.color}`}>
                      <Icon className="text-[9px]" />
                    </span>
                    <p className="text-sm text-gray-700 leading-snug">{item.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(item.time)}</p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'chat',         label: 'New AI Chat',      icon: FaComments,    color: 'bg-blue-500',    hover: 'hover:bg-blue-600' },
          { id: 'reports',      label: 'Upload Report',    icon: FaFileAlt,     color: 'bg-orange-500',  hover: 'hover:bg-orange-600' },
          { id: 'appointments', label: 'Book Appointment', icon: FaCalendarAlt, color: 'bg-violet-500',  hover: 'hover:bg-violet-600' },
          { id: 'emergency',    label: 'Emergency',        icon: FaExclamationTriangle, color: 'bg-red-500', hover: 'hover:bg-red-600' },
        ].map(({ id, label, icon: Icon, color, hover }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`${color} ${hover} text-white rounded-xl p-4 text-center shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
          >
            <Icon className="text-2xl mx-auto mb-2" />
            <p className="text-sm font-medium">{label}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PatientOverview;
