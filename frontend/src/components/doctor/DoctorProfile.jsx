import React from 'react';
import { FaUser, FaEnvelope, FaPhone, FaIdBadge, FaCalendarAlt, FaCheckCircle, FaClock, FaUsers } from 'react-icons/fa';

const DoctorProfile = ({ user, stats }) => (
  <div className="max-w-xl space-y-5">
    {/* Profile card */}
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {(user?.fullName || user?.username || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{user?.fullName || user?.username}</h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mt-1">
            <FaIdBadge className="text-[10px]" /> Doctor
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { icon: FaUser,    label: 'Username',      value: user?.username },
          { icon: FaEnvelope, label: 'Email',        value: user?.email },
          { icon: FaPhone,   label: 'Phone Number',  value: user?.phoneNumber },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <Icon className="text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className="text-sm text-gray-700 font-semibold">{value || '—'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Stats summary */}
    {stats && (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4">Activity Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: FaCalendarAlt, label: 'Total Appointments', value: stats.totalAppointments, color: 'text-blue-500' },
            { icon: FaUsers,       label: 'Unique Patients',    value: stats.totalPatients,      color: 'text-indigo-500' },
            { icon: FaClock,       label: 'Pending',            value: stats.pending,            color: 'text-yellow-500' },
            { icon: FaCheckCircle, label: 'Completed',          value: stats.completed,          color: 'text-emerald-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
              <Icon className={`text-xl mx-auto mb-2 ${color}`} />
              <p className="text-2xl font-bold text-gray-800">{value ?? 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default DoctorProfile;
