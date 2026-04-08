import React from 'react';
import {
  FaUsers, FaUserInjured, FaUserMd, FaComments,
  FaFileAlt, FaCalendarAlt, FaExclamationTriangle, FaClock,
} from 'react-icons/fa';

const CARDS = [
  {
    key: 'totalUsers',
    label: 'Total Users',
    icon: FaUsers,
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
  },
  {
    key: 'totalPatients',
    label: 'Patients',
    icon: FaUserInjured,
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
  },
  {
    key: 'totalDoctors',
    label: 'Doctors',
    icon: FaUserMd,
    gradient: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    border: 'border-violet-100',
  },
  {
    key: 'totalChatSessions',
    label: 'Chat Sessions',
    icon: FaComments,
    gradient: 'from-sky-500 to-sky-600',
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    border: 'border-sky-100',
  },
  {
    key: 'totalReports',
    label: 'Reports Uploaded',
    icon: FaFileAlt,
    gradient: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-100',
  },
  {
    key: 'totalAppointments',
    label: 'Appointments',
    icon: FaCalendarAlt,
    gradient: 'from-pink-500 to-pink-600',
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    border: 'border-pink-100',
  },
  {
    key: 'emergencySessions',
    label: 'Emergencies',
    icon: FaExclamationTriangle,
    gradient: 'from-red-500 to-red-600',
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-100',
  },
  {
    key: 'pendingAppointments',
    label: 'Pending Appts',
    icon: FaClock,
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-100',
  },
];

const OverviewCards = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
            <div className="h-10 w-10 bg-gray-100 rounded-lg mb-3" />
            <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
            <div className="h-7 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, icon: Icon, gradient, bg, text, border }) => {
        const value = stats[key] ?? 0;
        return (
          <div
            key={key}
            className={`group bg-white rounded-xl p-5 border ${border} shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-default`}
          >
            <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} shadow-sm mb-3 group-hover:scale-110 transition-transform duration-200`}>
              <Icon className="text-white text-lg" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-3xl font-bold ${text}`}>{value.toLocaleString()}</p>
          </div>
        );
      })}
    </div>
  );
};

export default OverviewCards;
