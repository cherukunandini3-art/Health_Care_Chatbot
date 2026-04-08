import React, { useState, useRef } from 'react';
import { reportAPI } from '../../services/api';
import {
  FaUpload, FaFileAlt, FaTrash, FaEye, FaTimes,
  FaExclamationTriangle, FaCheckCircle, FaChartLine,
} from 'react-icons/fa';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// Reference ranges for common lab tests
const REFERENCE_RANGES = {
  hemoglobin:     { unit: 'g/dL',  low: 12.0, high: 17.5 },
  hgb:            { unit: 'g/dL',  low: 12.0, high: 17.5 },
  hb:             { unit: 'g/dL',  low: 12.0, high: 17.5 },
  wbc:            { unit: '/µL',   low: 4000,  high: 11000 },
  'wbc count':    { unit: '/µL',   low: 4000,  high: 11000 },
  platelets:      { unit: '/µL',   low: 150000,high: 400000 },
  glucose:        { unit: 'mg/dL', low: 70,    high: 100 },
  'blood glucose':{ unit: 'mg/dL', low: 70,    high: 100 },
  'fasting glucose': { unit: 'mg/dL', low: 70, high: 100 },
  creatinine:     { unit: 'mg/dL', low: 0.6,   high: 1.2 },
  cholesterol:    { unit: 'mg/dL', low: 0,     high: 200 },
  'total cholesterol': { unit: 'mg/dL', low: 0, high: 200 },
  sodium:         { unit: 'mEq/L', low: 136,   high: 145 },
  potassium:      { unit: 'mEq/L', low: 3.5,   high: 5.0 },
  bilirubin:      { unit: 'mg/dL', low: 0.2,   high: 1.2 },
  'total bilirubin': { unit: 'mg/dL', low: 0.2, high: 1.2 },
  alt:            { unit: 'U/L',   low: 7,     high: 56 },
  ast:            { unit: 'U/L',   low: 10,    high: 40 },
  tsh:            { unit: 'mIU/L', low: 0.4,   high: 4.0 },
  urea:           { unit: 'mg/dL', low: 15,    high: 45 },
  'blood urea':   { unit: 'mg/dL', low: 15,    high: 45 },
  hba1c:          { unit: '%',     low: 4.0,   high: 5.6 },
  'hba1c':        { unit: '%',     low: 4.0,   high: 5.6 },
};

const parseTestValues = (extractedText = '') => {
  if (!extractedText || extractedText.trim().length < 10) return [];

  const lines = extractedText.split('\n');
  const results = [];

  // Pattern: "TestName : 12.5 g/dL" or "TestName 12.5 H" or "TestName: 12.5 (ref 10-20)"
  const valuePattern = /([A-Za-z][A-Za-z0-9 /().%'-]{2,35}?)\s*[:\-]?\s*([\d.]+)\s*([A-Za-z/%µ*]+)?\s*(H|L|HIGH|LOW|NORMAL|ABNORMAL|\(H\)|\(L\))?\s*(?:[\[\(]?([\d.]+)\s*[-–]\s*([\d.]+)[\]\)]?)?/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 4) continue;

    const match = trimmed.match(valuePattern);
    if (!match) continue;

    const rawName = match[1].trim().toLowerCase().replace(/\s+/g, ' ');
    const rawValue = parseFloat(match[2]);
    if (isNaN(rawValue)) continue;

    // Try to find reference range from our table or from the line itself
    const ref = REFERENCE_RANGES[rawName];
    const unit = match[3] || (ref ? ref.unit : '');
    const refLow  = match[5] ? parseFloat(match[5]) : (ref ? ref.low  : null);
    const refHigh = match[6] ? parseFloat(match[6]) : (ref ? ref.high : null);

    // Determine status
    let status = 'NORMAL';
    const flagRaw = (match[4] || '').toUpperCase();
    if (flagRaw === 'H' || flagRaw === 'HIGH' || flagRaw === '(H)') {
      status = 'HIGH';
    } else if (flagRaw === 'L' || flagRaw === 'LOW' || flagRaw === '(L)') {
      status = 'LOW';
    } else if (refLow !== null && refHigh !== null) {
      if (rawValue > refHigh) status = 'HIGH';
      else if (rawValue < refLow) status = 'LOW';
    }

    // Only include if we have at least a name + numeric value
    const displayName = match[1].trim();
    // Skip lines that look like page numbers or dates
    if (/^\d+$/.test(displayName) || displayName.length < 3) continue;

    results.push({
      test:   displayName,
      result: String(rawValue),
      unit:   unit || '',
      low:    refLow  !== null ? String(refLow)  : '—',
      high:   refHigh !== null ? String(refHigh) : '—',
      status,
    });
  }

  return results;
};

const StatusCell = ({ status }) => {
  if (status === 'HIGH') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
      <FaExclamationTriangle className="text-[9px]" /> High
    </span>
  );
  if (status === 'LOW') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
      <FaExclamationTriangle className="text-[9px]" /> Low
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
      <FaCheckCircle className="text-[9px]" /> Normal
    </span>
  );
};

const TREND_DATA = [
  { date: 'Jan', glucose: 115, cholesterol: 198, hemoglobin: 12.1 },
  { date: 'Feb', glucose: 120, cholesterol: 205, hemoglobin: 11.8 },
  { date: 'Mar', glucose: 118, cholesterol: 210, hemoglobin: 11.5 },
  { date: 'Apr', glucose: 126, cholesterol: 215, hemoglobin: 11.2 },
];

const PatientReports = ({ reports, onRefresh }) => {
  const [uploading, setUploading]     = useState(false);
  const [viewReport, setViewReport]   = useState(null);
  const [showTrend, setShowTrend]     = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setUploadError('Only PDF, PNG, JPG files are allowed.');
      return;
    }
    setUploadError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await reportAPI.uploadReport(formData);
      onRefresh?.();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (reportId) => {
    try {
      await reportAPI.deleteReport(reportId);
      onRefresh?.();
    } catch { /* ignore */ }
  };

  const formatDate = (v) => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <div className="bg-white rounded-xl border border-dashed border-gray-300 shadow-sm p-8 text-center hover:border-blue-400 transition-colors">
        <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
          <FaUpload className="text-blue-500 text-xl" />
        </div>
        <h3 className="font-semibold text-gray-700 mb-1">Upload Medical Report</h3>
        <p className="text-xs text-gray-400 mb-4">PDF, PNG, JPG up to 10MB — AI will extract and explain your values</p>
        {uploadError && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{uploadError}</p>
        )}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
        >
          {uploading ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
          ) : (
            <><FaUpload /> Choose File</>
          )}
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleUpload} className="hidden" />
      </div>

      {/* Reports List */}
      {reports && reports.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Your Reports ({reports.length})</h3>
            <button
              onClick={() => setShowTrend(!showTrend)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
            >
              <FaChartLine /> {showTrend ? 'Hide' : 'Show'} Trends
            </button>
          </div>

          {/* Trend chart */}
          {showTrend && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Lab Value Trends</h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={TREND_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-600">{v}</span>} />
                  <Line type="monotone" dataKey="glucose"     stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Glucose" />
                  <Line type="monotone" dataKey="cholesterol" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Cholesterol" />
                  <Line type="monotone" dataKey="hemoglobin"  stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Hemoglobin" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {reports.map(report => (
            <div key={report.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <FaFileAlt className="text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{report.fileName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Uploaded {formatDate(report.uploadedAt)} · {report.fileType || 'Document'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setViewReport(report)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <FaEye /> View
                </button>
                <button
                  onClick={() => handleDelete(report.id)}
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FaTrash className="text-xs" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {reports && reports.length === 0 && (
        <div className="text-center py-8 text-gray-300">
          <FaFileAlt className="text-5xl mx-auto mb-2" />
          <p className="text-sm text-gray-400">No reports uploaded yet</p>
        </div>
      )}

      {/* View Report Modal */}
      {viewReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <FaFileAlt className="text-orange-500" />
                <div>
                  <h3 className="font-bold text-gray-800">{viewReport.fileName}</h3>
                  <p className="text-xs text-gray-400">AI Analysis Report</p>
                </div>
              </div>
              <button onClick={() => setViewReport(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <FaTimes className="text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Test values table */}
              {(() => {
                const rows = parseTestValues(viewReport.extractedText);
                return rows.length > 0 ? (
                  <>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Extracted Test Values</h4>
                    <div className="overflow-x-auto rounded-xl border border-gray-100 mb-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            {['Test Name', 'Result', 'Normal Range', 'Status'].map(h => (
                              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {rows.map((row, i) => (
                            <tr key={i} className={`hover:bg-gray-50/70 ${row.status !== 'NORMAL' ? 'bg-red-50/30' : ''}`}>
                              <td className="px-4 py-2.5 font-medium text-gray-800">{row.test}</td>
                              <td className={`px-4 py-2.5 font-bold ${row.status === 'HIGH' || row.status === 'LOW' ? 'text-red-600' : 'text-gray-600'}`}>
                                {row.result} <span className="font-normal text-gray-400 text-xs">{row.unit}</span>
                              </td>
                              <td className="px-4 py-2.5 text-gray-500 text-xs">{row.low} – {row.high} {row.unit}</td>
                              <td className="px-4 py-2.5"><StatusCell status={row.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : viewReport.extractedText ? (
                  <>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Extracted Text</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap mb-6 max-h-48 overflow-y-auto font-mono">
                      {viewReport.extractedText}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 mb-6">No text could be extracted from this report.</p>
                );
              })()}

              {/* AI Explanation */}
              {viewReport.aiExplanation && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">AI Explanation</h4>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {viewReport.aiExplanation}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientReports;
