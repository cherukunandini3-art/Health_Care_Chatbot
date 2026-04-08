import React, { useState, useEffect } from 'react';
import { patientAPI } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { FaUser, FaSave, FaEdit, FaCheckCircle, FaTimesCircle, FaIdCard, FaNotesMedical } from 'react-icons/fa';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const Field = ({ label, id, children }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</label>
    {children}
  </div>
);

const Input = ({ readOnly, ...props }) => (
  <input
    readOnly={readOnly}
    className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-colors
      ${readOnly ? 'bg-gray-50 border-gray-100 text-gray-500 cursor-default' : 'bg-white border-gray-200 text-gray-800'}`}
    {...props}
  />
);

const Textarea = ({ readOnly, ...props }) => (
  <textarea
    readOnly={readOnly}
    rows={2}
    className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none transition-colors
      ${readOnly ? 'bg-gray-50 border-gray-100 text-gray-500 cursor-default' : 'bg-white border-gray-200 text-gray-800'}`}
    {...props}
  />
);

const PatientProfile = ({ user, profile: initialProfile, onRefresh }) => {
  const { user: authUser } = useAuth();
  const [editing, setEditing]       = useState(false);
  const [saving,  setSaving]        = useState(false);
  const [status,  setStatus]        = useState(null); // { type: 'success'|'error', msg }

  const blankProfile = { age:'', weight:'', height:'', bloodType:'',
    allergies:'', chronicConditions:'', currentMedications:'', emergencyContact:'' };

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email:    user?.email    || '',
    phone:    user?.phoneNumber || '',
    ...(initialProfile ? {
      age:               initialProfile.age               || '',
      weight:            initialProfile.weight            || '',
      height:            initialProfile.height            || '',
      bloodType:         initialProfile.bloodType         || '',
      allergies:         initialProfile.allergies         || '',
      chronicConditions: initialProfile.chronicConditions || '',
      currentMedications:initialProfile.currentMedications|| '',
      emergencyContact:  initialProfile.emergencyContact  || '',
    } : blankProfile),
  });

  useEffect(() => {
    setForm({
      fullName: user?.fullName || '',
      email:    user?.email    || '',
      phone:    user?.phoneNumber || '',
      age:               initialProfile?.age               || '',
      weight:            initialProfile?.weight            || '',
      height:            initialProfile?.height            || '',
      bloodType:         initialProfile?.bloodType         || '',
      allergies:         initialProfile?.allergies         || '',
      chronicConditions: initialProfile?.chronicConditions || '',
      currentMedications:initialProfile?.currentMedications|| '',
      emergencyContact:  initialProfile?.emergencyContact  || '',
    });
  }, [user, initialProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await patientAPI.updateProfile({
        age:               form.age,
        weight:            form.weight,
        height:            form.height,
        bloodType:         form.bloodType,
        allergies:         form.allergies,
        chronicConditions: form.chronicConditions,
        currentMedications:form.currentMedications,
        emergencyContact:  form.emergencyContact,
      });
      setStatus({ type: 'success', msg: 'Health profile updated successfully!' });
      setEditing(false);
      onRefresh?.();
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setStatus(null);
    setForm({
      fullName: user?.fullName || '',
      email:    user?.email    || '',
      phone:    user?.phoneNumber || '',
      age:               initialProfile?.age               || '',
      weight:            initialProfile?.weight            || '',
      height:            initialProfile?.height            || '',
      bloodType:         initialProfile?.bloodType         || '',
      allergies:         initialProfile?.allergies         || '',
      chronicConditions: initialProfile?.chronicConditions || '',
      currentMedications:initialProfile?.currentMedications|| '',
      emergencyContact:  initialProfile?.emergencyContact  || '',
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold">
          {(user?.fullName || user?.username || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold">{user?.fullName || user?.username}</h2>
          <p className="text-sm text-white/80">{user?.email}</p>
          <p className="text-xs text-white/60 mt-0.5">Patient Portal</p>
        </div>
        <div className="ml-auto">
          {!editing ? (
            <button onClick={() => { setEditing(true); setStatus(null); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors">
              <FaEdit /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-xl transition-colors">
                <FaTimesCircle className="text-xs" /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-white text-emerald-600 text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-60">
                {saving
                  ? <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  : <FaSave className="text-xs" />}
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status banner */}
      {status && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium
          ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {status.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
          {status.msg}
        </div>
      )}

      {/* Personal info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-5 pb-3 border-b border-gray-50">
          <FaIdCard className="text-blue-500" /> Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Full Name" id="prof-fullname">
            <Input id="prof-fullname" name="fullName" value={form.fullName} readOnly />
          </Field>
          <Field label="Username" id="prof-username">
            <Input id="prof-username" value={user?.username || ''} readOnly />
          </Field>
          <Field label="Email Address" id="prof-email">
            <Input id="prof-email" name="email" value={form.email} readOnly />
          </Field>
          <Field label="Phone Number" id="prof-phone">
            <Input id="prof-phone" name="phone" value={form.phone} readOnly />
          </Field>
        </div>
        <p className="text-xs text-gray-300 mt-4">* Personal info can only be changed by an administrator.</p>
      </div>

      {/* Health profile */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-5 pb-3 border-b border-gray-50">
          <FaNotesMedical className="text-emerald-500" /> Health Profile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Age" id="prof-age">
            <Input id="prof-age" name="age" type="number" min="0" max="130" value={form.age}
              onChange={handleChange} readOnly={!editing} placeholder="Years" />
          </Field>
          <Field label="Weight" id="prof-weight">
            <Input id="prof-weight" name="weight" type="number" min="0" value={form.weight}
              onChange={handleChange} readOnly={!editing} placeholder="kg" />
          </Field>
          <Field label="Height" id="prof-height">
            <Input id="prof-height" name="height" type="number" min="0" value={form.height}
              onChange={handleChange} readOnly={!editing} placeholder="cm" />
          </Field>
          <Field label="Blood Type" id="prof-bloodtype">
            {editing ? (
              <select id="prof-bloodtype" name="bloodType" value={form.bloodType} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
                <option value="">Select…</option>
                {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            ) : (
              <Input id="prof-bloodtype" value={form.bloodType} readOnly placeholder="Not set" />
            )}
          </Field>
          <Field label="Emergency Contact" id="prof-emergency">
            <Input id="prof-emergency" name="emergencyContact" value={form.emergencyContact}
              onChange={handleChange} readOnly={!editing} placeholder="Name & phone" />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <Field label="Known Allergies" id="prof-allergies">
            <Textarea id="prof-allergies" name="allergies" value={form.allergies}
              onChange={handleChange} readOnly={!editing} placeholder="e.g. Penicillin, Peanuts…" />
          </Field>
          <Field label="Chronic Conditions" id="prof-chronic">
            <Textarea id="prof-chronic" name="chronicConditions" value={form.chronicConditions}
              onChange={handleChange} readOnly={!editing} placeholder="e.g. Type 2 Diabetes, Hypertension…" />
          </Field>
          <Field label="Current Medications" id="prof-meds">
            <Textarea id="prof-meds" name="currentMedications" value={form.currentMedications}
              onChange={handleChange} readOnly={!editing} placeholder="e.g. Metformin 500mg, Lisinopril 10mg…" />
          </Field>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
