import React, { useState } from 'react';
import { doctorAPI } from '../../services/api';
import { FaNotesMedical, FaRobot, FaCopy, FaCheck, FaTrash } from 'react-icons/fa';

const DoctorSoapNote = ({ patients }) => {
  const [form, setForm] = useState({ patientId: '', patientHistory: '', symptoms: '' });
  const [generating, setGenerating] = useState(false);
  const [soapNote, setSoapNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!form.patientHistory.trim() || !form.symptoms.trim()) {
      setError('Please fill in both patient history and current symptoms.');
      return;
    }
    setError('');
    setGenerating(true);
    setSoapNote('');
    try {
      const res = await doctorAPI.generateSoapNote({
        patientHistory: form.patientHistory,
        symptoms: form.symptoms,
      });
      if (res.data?.data?.soapNote) {
        setSoapNote(res.data.data.soapNote);
      } else {
        setError('No SOAP note returned. Please try again.');
      }
    } catch {
      setError('Failed to generate SOAP note. Please check your connection.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(soapNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setForm({ patientId: '', patientHistory: '', symptoms: '' });
    setSoapNote('');
    setError('');
  };

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <FaNotesMedical className="text-white text-lg" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">AI SOAP Note Generator</h2>
            <p className="text-xs text-gray-400">Powered by OpenAI · Generates structured clinical notes</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Optional patient select */}
          {(patients || []).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Patient (Optional)</label>
              <select
                value={form.patientId}
                onChange={e => {
                  const p = (patients || []).find(pt => String(pt.id) === e.target.value);
                  setForm(f => ({ ...f, patientId: e.target.value }));
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              >
                <option value="">Select a patient…</option>
                {(patients || []).map(p => (
                  <option key={p.id} value={p.id}>{p.fullName || p.username}</option>
                ))}
              </select>
            </div>
          )}

          {/* Patient History */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Patient History <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              value={form.patientHistory}
              onChange={e => setForm(f => ({ ...f, patientHistory: e.target.value }))}
              placeholder="Enter the patient's medical history, past conditions, medications, allergies, surgical history, family history…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
          </div>

          {/* Current Symptoms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Current Symptoms &amp; Complaints <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              value={form.symptoms}
              onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
              placeholder="Describe the current symptoms, chief complaint, onset, duration, severity, associated symptoms…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm shadow-blue-600/25"
            >
              <FaRobot />
              {generating ? 'Generating…' : 'Generate SOAP Note'}
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FaTrash className="text-xs" /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* SOAP Note Output */}
      {(generating || soapNote) && (
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FaRobot className="text-blue-500" /> Generated SOAP Note
            </h3>
            {soapNote && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {copied ? <><FaCheck className="text-green-500" /> Copied!</> : <><FaCopy /> Copy</>}
              </button>
            )}
          </div>

          {generating ? (
            <div className="flex items-center gap-3 py-8 text-blue-500">
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm">AI is generating your SOAP note…</span>
            </div>
          ) : (
            <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-[500px] overflow-y-auto">
              {soapNote}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorSoapNote;
