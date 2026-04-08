import React, { useState } from 'react';
import { doctorAPI } from '../../services/api';
import { FaCalendarAlt, FaCheck, FaCheckDouble, FaTimes, FaStickyNote, FaSync } from 'react-icons/fa';

const STATUS_STYLES = {
  PENDING:   { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Pending' },
  CONFIRMED: { badge: 'bg-blue-100 text-blue-700 border-blue-200',       label: 'Confirmed' },
  COMPLETED: { badge: 'bg-green-100 text-green-700 border-green-200',    label: 'Completed' },
  CANCELLED: { badge: 'bg-gray-100 text-gray-500 border-gray-200',       label: 'Cancelled' },
};

const TABS = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const formatDate = (v) =>
  v ? new Date(v).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const DoctorAppointments = ({ appointments, onRefresh }) => {
  const [tab, setTab] = useState('ALL');
  const [noteModal, setNoteModal] = useState(null); // { appt, noteText }
  const [updating, setUpdating] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = (appointments || []).filter(a => {
    const matchTab = tab === 'ALL' || a.status === tab;
    const q = search.toLowerCase();
    const matchSearch = !q
      || (a.patient?.fullName || '').toLowerCase().includes(q)
      || (a.patient?.username || '').toLowerCase().includes(q)
      || (a.reason || '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const updateStatus = async (appt, status) => {
    setUpdating(appt.id + status);
    try {
      await doctorAPI.updateAppointment(appt.id, { status });
      onRefresh();
    } catch (e) {
      alert('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const saveNote = async () => {
    if (!noteModal) return;
    setUpdating('note');
    try {
      await doctorAPI.updateAppointment(noteModal.appt.id, { notes: noteModal.noteText });
      setNoteModal(null);
      onRefresh();
    } catch (e) {
      alert('Failed to save note');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'ALL' ? `All (${(appointments || []).length})` : `${t} (${(appointments || []).filter(a => a.status === t).length})`}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search patient or reason…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-52"
          />
          <button onClick={onRefresh} className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
            <FaSync className="text-sm" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FaCalendarAlt className="text-4xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Patient', 'Date & Time', 'Reason', 'Status', 'Notes', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(a => {
                  const s = STATUS_STYLES[a.status] || STATUS_STYLES.PENDING;
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{a.patient?.fullName || a.patient?.username || `#${a.patient?.id}`}</p>
                        <p className="text-xs text-gray-400">{a.patient?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(a.appointmentDate)}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{a.reason || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.badge}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate text-xs">{a.notes || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {a.status === 'PENDING' && (
                            <button
                              onClick={() => updateStatus(a, 'CONFIRMED')}
                              disabled={!!updating}
                              title="Confirm"
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                            >
                              <FaCheck className="text-xs" />
                            </button>
                          )}
                          {(a.status === 'CONFIRMED') && (
                            <button
                              onClick={() => updateStatus(a, 'COMPLETED')}
                              disabled={!!updating}
                              title="Mark Completed"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                            >
                              <FaCheckDouble className="text-xs" />
                            </button>
                          )}
                          {(a.status === 'PENDING' || a.status === 'CONFIRMED') && (
                            <button
                              onClick={() => updateStatus(a, 'CANCELLED')}
                              disabled={!!updating}
                              title="Cancel"
                              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          )}
                          <button
                            onClick={() => setNoteModal({ appt: a, noteText: a.notes || '' })}
                            title="Add/Edit Note"
                            className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
                          >
                            <FaStickyNote className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-800 mb-1">Appointment Note</h3>
            <p className="text-xs text-gray-400 mb-4">
              Patient: {noteModal.appt.patient?.fullName || noteModal.appt.patient?.username}
            </p>
            <textarea
              rows={5}
              value={noteModal.noteText}
              onChange={e => setNoteModal(m => ({ ...m, noteText: e.target.value }))}
              placeholder="Enter notes about this appointment…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => setNoteModal(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                disabled={updating === 'note'}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {updating === 'note' ? 'Saving…' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
