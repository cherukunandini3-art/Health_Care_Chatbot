import React, { useState } from 'react';
import { doctorAPI } from '../../services/api';
import { FaUsers, FaUser, FaEnvelope, FaPhone, FaFileAlt, FaTimes, FaSpinner, FaCalendarAlt } from 'react-icons/fa';

const DoctorPatients = ({ patients }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null); // { patient, details, reports, loading }

  const filtered = (patients || []).filter(p => {
    const q = search.toLowerCase();
    return !q
      || (p.fullName || '').toLowerCase().includes(q)
      || (p.username || '').toLowerCase().includes(q)
      || (p.email || '').toLowerCase().includes(q);
  });

  const openPatient = async (patient) => {
    setSelected({ patient, details: null, reports: null, loading: true });
    try {
      const [detailsRes, reportsRes] = await Promise.allSettled([
        doctorAPI.getPatientDetails(patient.id),
        doctorAPI.getPatientReports(patient.id),
      ]);
      setSelected({
        patient,
        details: detailsRes.status === 'fulfilled' ? detailsRes.value.data?.data : null,
        reports: reportsRes.status === 'fulfilled' ? (reportsRes.value.data?.data ?? []) : [],
        loading: false,
      });
    } catch {
      setSelected(s => ({ ...s, loading: false }));
    }
  };

  const profile = selected?.details?.healthProfile;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search patients…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-64"
        />
        <span className="text-sm text-gray-400">{filtered.length} patient{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Patient cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <FaUsers className="text-4xl text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No patients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => openPatient(p)}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md hover:border-blue-200 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {(p.fullName || p.username || '?').charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="font-semibold text-gray-800 truncate">{p.fullName || p.username}</p>
                  <p className="text-xs text-gray-400 truncate">{p.email}</p>
                  {p.phoneNumber && <p className="text-xs text-gray-400">{p.phoneNumber}</p>}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1 text-xs text-blue-600 font-medium">
                <FaCalendarAlt className="text-[11px]" />
                {p.appointmentCount} appointment{p.appointmentCount !== 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Patient Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mt-8 mb-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                  {(selected.patient.fullName || selected.patient.username || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">{selected.patient.fullName || selected.patient.username}</h2>
                  <p className="text-xs text-gray-400">Patient Profile</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <FaTimes />
              </button>
            </div>

            {selected.loading ? (
              <div className="flex items-center justify-center py-16">
                <FaSpinner className="text-3xl text-blue-500 animate-spin" />
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaEnvelope className="text-blue-400 flex-shrink-0" />
                    <span className="truncate">{selected.patient.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaPhone className="text-blue-400 flex-shrink-0" />
                    <span>{selected.patient.phoneNumber || '—'}</span>
                  </div>
                </div>

                {/* Health Profile */}
                {profile ? (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <FaUser className="text-blue-500" /> Health Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        ['Age', profile.age],
                        ['Blood Type', profile.bloodType],
                        ['Weight', profile.weight ? `${profile.weight} kg` : null],
                        ['Height', profile.height ? `${profile.height} cm` : null],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <p className="text-xs text-gray-400 font-medium">{label}</p>
                          <p className="text-gray-700 font-semibold">{val || '—'}</p>
                        </div>
                      ))}
                    </div>
                    {profile.allergies && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 font-medium mb-1">Allergies</p>
                        <p className="text-sm text-gray-700">{profile.allergies}</p>
                      </div>
                    )}
                    {profile.chronicConditions && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-400 font-medium mb-1">Chronic Conditions</p>
                        <p className="text-sm text-gray-700">{profile.chronicConditions}</p>
                      </div>
                    )}
                    {profile.currentMedications && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-400 font-medium mb-1">Current Medications</p>
                        <p className="text-sm text-gray-700">{profile.currentMedications}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No health profile available</p>
                )}

                {/* Reports */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaFileAlt className="text-orange-500" /> Medical Reports
                    <span className="ml-auto text-xs bg-orange-50 text-orange-600 font-semibold px-2 py-0.5 rounded-full">{(selected.reports || []).length}</span>
                  </h3>
                  {(selected.reports || []).length === 0 ? (
                    <p className="text-sm text-gray-400">No reports uploaded</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selected.reports.map(r => (
                        <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                          <FaFileAlt className="text-orange-400 flex-shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-medium text-gray-700 truncate">{r.fileName}</p>
                            <p className="text-xs text-gray-400">
                              {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString() : ''}
                              {r.fileType && ` · ${r.fileType}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatients;
