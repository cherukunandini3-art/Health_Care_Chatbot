import React, { useState, useEffect } from 'react';
import { patientAPI } from '../../services/api';
import {
  FaCalendarPlus, FaCalendarAlt, FaTimes, FaCheck,
  FaClock, FaUserMd, FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   bg: 'bg-amber-100',   text: 'text-amber-700' },
  CONFIRMED: { label: 'Confirmed', bg: 'bg-blue-100',    text: 'text-blue-700' },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-100',     text: 'text-red-700' },
};

const TIME_SLOTS = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM'];

const PAGE_SIZE = 6;

const formatDate = (v) => v ? new Date(v).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const PatientAppointments = ({ appointments, doctors, onRefresh }) => {
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState({ doctorId: '', date: '', time: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg]       = useState(null);
  const [page, setPage]             = useState(1);
  const [cancelling, setCancelling] = useState(null);

  const availableDoctors = (doctors || []).filter(d => d.roles?.includes('ROLE_DOCTOR'));

  const totalPages = Math.max(1, Math.ceil((appointments?.length || 0) / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageData = (appointments || []).slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.doctorId || !form.date || !form.time) {
      setFormMsg({ type: 'error', text: 'Please fill all required fields.' });
      return;
    }
    setSubmitting(true);
    setFormMsg(null);
    try {
      const dateTime = `${form.date}T${convertTo24(form.time)}:00`;
      await patientAPI.bookAppointment({ doctorId: form.doctorId, appointmentDate: dateTime, reason: form.reason });
      setFormMsg({ type: 'success', text: 'Appointment booked successfully!' });
      setForm({ doctorId: '', date: '', time: '', reason: '' });
      onRefresh?.();
      setTimeout(() => { setShowForm(false); setFormMsg(null); }, 1500);
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.message || 'Booking failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    setCancelling(appointmentId);
    try {
      await patientAPI.cancelAppointment(appointmentId);
      onRefresh?.();
    } catch { /* ignore */ }
    finally { setCancelling(null); }
  };

  const convertTo24 = (t12) => {
    const [time, meridian] = t12.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (meridian === 'PM' && h !== 12) h += 12;
    if (meridian === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Your Appointments ({appointments?.length || 0})</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <FaCalendarPlus /> Book Appointment
        </button>
      </div>

      {/* Appointments list */}
      {pageData.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <FaCalendarAlt className="text-5xl text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No appointments yet</p>
          <button onClick={() => setShowForm(true)}
            className="mt-3 px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-colors">
            Book your first appointment
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {pageData.map(appt => {
            const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.PENDING;
            const isPending = appt.status === 'PENDING';
            return (
              <div key={appt.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <FaUserMd className="text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800">Dr. {appt.doctor?.fullName || 'Doctor'}</p>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1"><FaCalendarAlt className="text-[10px]" />{formatDate(appt.appointmentDate)}</span>
                    {appt.reason && <span className="truncate max-w-[200px]">· {appt.reason}</span>}
                  </div>
                </div>
                {isPending && (
                  <button
                    onClick={() => handleCancel(appt.id)}
                    disabled={cancelling === appt.id}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {cancelling === appt.id
                      ? <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <FaTimes className="text-[10px]" />}
                    Cancel
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40">
            <FaChevronLeft className="text-xs text-gray-500" />
          </button>
          <span className="text-xs text-gray-500">{currentPage} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40">
            <FaChevronRight className="text-xs text-gray-500" />
          </button>
        </div>
      )}

      {/* Book Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FaCalendarPlus className="text-emerald-500" />
                Book Appointment
              </h3>
              <button onClick={() => { setShowForm(false); setFormMsg(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <FaTimes className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Doctor */}
              <div>
                <label htmlFor="appt-doctor" className="block text-xs font-medium text-gray-600 mb-1">Select Doctor *</label>
                <select id="appt-doctor" required value={form.doctorId} onChange={e => setForm(p => ({ ...p, doctorId: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300">
                  <option value="">Choose a doctor…</option>
                  {availableDoctors.map(d => (
                    <option key={d.id} value={d.id}>{d.fullName || d.username}</option>
                  ))}
                </select>
                {availableDoctors.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No doctors available — the admin needs to add doctors first.</p>
                )}
              </div>
              {/* Date */}
              <div>
                <label htmlFor="appt-date" className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                <input id="appt-date" type="date" required min={today} value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              {/* Time slot */}
              <div>
                <p className="block text-xs font-medium text-gray-600 mb-1">Time Slot *</p>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map(t => (
                    <button type="button" key={t} onClick={() => setForm(p => ({ ...p, time: t }))}
                      className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        form.time === t ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 hover:bg-gray-50'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {/* Reason */}
              <div>
                <label htmlFor="appt-reason" className="block text-xs font-medium text-gray-600 mb-1">Reason (optional)</label>
                <textarea id="appt-reason" rows={2} value={form.reason}
                  onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                  placeholder="Describe your symptoms or reason for visit…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
              </div>

              {formMsg && (
                <p className={`text-xs px-3 py-2 rounded-lg ${formMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {formMsg.text}
                </p>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); setFormMsg(null); }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaCheck />}
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
