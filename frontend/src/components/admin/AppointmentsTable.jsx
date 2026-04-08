import React, { useState } from 'react';
import { adminAPI } from '../../services/api';
import {
  FaSearch, FaCalendarAlt, FaCheck, FaTimes,
  FaChevronLeft, FaChevronRight, FaClock,
} from 'react-icons/fa';

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   bg: 'bg-amber-100',   text: 'text-amber-700',   icon: FaClock },
  CONFIRMED: { label: 'Confirmed', bg: 'bg-blue-100',    text: 'text-blue-700',    icon: FaCheck },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: FaCheck },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-100',     text: 'text-red-700',     icon: FaTimes },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-600', icon: null };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {Icon && <Icon className="text-[10px]" />}
      {cfg.label}
    </span>
  );
};

const PAGE_SIZE = 10;

const formatDate = (val) => {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const AppointmentsTable = ({ appointments, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  const filtered = appointments.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.patientName?.toLowerCase().includes(q) ||
      a.doctorName?.toLowerCase().includes(q) ||
      a.patient?.fullName?.toLowerCase().includes(q) ||
      a.doctor?.fullName?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleAction = async (id, action) => {
    setActionLoading(id + '-' + action);
    try {
      await adminAPI.updateAppointmentStatus(id, action);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search patient or doctor…"
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Patient', 'Doctor', 'Date & Time', 'Reason', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <FaCalendarAlt className="text-4xl text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400">No appointments found</p>
                  </td>
                </tr>
              ) : pageData.map(appt => {
                const patientName = appt.patient?.fullName || appt.patientName || '—';
                const doctorName  = appt.doctor?.fullName  || appt.doctorName  || 'TBD';
                return (
                  <tr key={appt.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {patientName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 truncate max-w-[120px]">{patientName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {doctorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[120px]">{doctorName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{formatDate(appt.appointmentDate)}</td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-[180px]">
                      <p className="truncate text-xs">{appt.reason || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      {appt.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAction(appt.id, 'CONFIRMED')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoading === appt.id + '-CONFIRMED'
                              ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <FaCheck className="text-[10px]" />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(appt.id, 'CANCELLED')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoading === appt.id + '-CANCELLED'
                              ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <FaTimes className="text-[10px]" />}
                            Reject
                          </button>
                        </div>
                      )}
                      {appt.status !== 'PENDING' && (
                        <span className="text-xs text-gray-300 italic">No actions</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
          <p className="text-xs text-gray-400">
            {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors">
              <FaChevronLeft className="text-xs text-gray-500" />
            </button>
            <span className="text-xs text-gray-500">{currentPage} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors">
              <FaChevronRight className="text-xs text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsTable;
