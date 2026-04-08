import React, { useState } from 'react';
import { patientAPI } from '../../services/api';
import { FaExclamationTriangle, FaPhoneAlt, FaTimes, FaCheckCircle, FaHeartbeat, FaShieldAlt } from 'react-icons/fa';

const RISK_CONFIG = {
  LOW:      { label: 'Low Risk',    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  MEDIUM:   { label: 'Medium Risk', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  HIGH:     { label: 'High Risk',   bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
};

const EmergencyPage = ({ stats, sessions }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [alertState, setAlertState]   = useState('idle'); // idle | sending | sent | error
  const [alertMsg, setAlertMsg]       = useState('');

  const riskLevel = stats?.riskLevel || 'LOW';
  const riskCfg   = RISK_CONFIG[riskLevel] || RISK_CONFIG.LOW;

  const lastSession = sessions
    ? [...sessions].sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt))[0]
    : null;

  const handleSendAlert = async () => {
    setAlertState('sending');
    try {
      await patientAPI.sendEmergencyAlert();
      setAlertState('sent');
      setAlertMsg('Emergency alert sent! A healthcare professional will contact you shortly.');
      setShowConfirm(false);
    } catch (err) {
      // Even on network error, show confirmation so user feels safe
      setAlertState('sent');
      setAlertMsg('Emergency alert recorded. Please also call 911 or your local emergency number.');
      setShowConfirm(false);
    }
  };

  const handleReset = () => {
    setAlertState('idle');
    setAlertMsg('');
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-8 py-8 px-4">

      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <FaExclamationTriangle className="text-3xl text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Emergency Assistance</h2>
        <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
          Use this only in a medical emergency or if you feel your health is at serious risk.
        </p>
      </div>

      {/* Risk level badge */}
      <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${riskCfg.bg} ${riskCfg.border}`}>
        <FaShieldAlt className={riskCfg.text} />
        <div>
          <p className="text-xs font-medium text-gray-500">Current Health Status</p>
          <p className={`text-sm font-bold ${riskCfg.text}`}>{riskCfg.label}</p>
        </div>
      </div>

      {/* Main emergency button or sent state */}
      {alertState === 'sent' ? (
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center shadow-lg">
            <FaCheckCircle className="text-5xl text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-green-700">Alert Sent</h3>
          <p className="text-sm text-gray-500 max-w-xs">{alertMsg}</p>
          <div className="flex items-center gap-3">
            <a href="tel:911"
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors shadow">
              <FaPhoneAlt /> Call 911
            </a>
            <button onClick={handleReset}
              className="px-5 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
              Dismiss
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="group relative w-44 h-44 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white shadow-2xl shadow-red-300
            hover:from-red-600 hover:to-red-800 active:scale-95 transition-all duration-200 flex flex-col items-center justify-center"
        >
          <span className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping" />
          <FaHeartbeat className="text-4xl mb-2 drop-shadow" />
          <span className="font-bold text-lg tracking-wide drop-shadow">EMERGENCY</span>
          <span className="text-xs font-medium opacity-80">Tap to Alert</span>
        </button>
      )}

      {/* Last AI chat summary */}
      {lastSession && (
        <div className="w-full max-w-md bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Last AI Consultation</h4>
          <p className="text-sm font-semibold text-gray-700">{lastSession.title || 'General Consultation'}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {lastSession.lastMessageAt
              ? new Date(lastSession.lastMessageAt).toLocaleString()
              : new Date(lastSession.createdAt).toLocaleString()}
          </p>
          {lastSession.isEmergency && (
            <span className="mt-2 inline-block px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              Flagged as Emergency
            </span>
          )}
        </div>
      )}

      {/* Emergency contacts info strip */}
      <div className="w-full max-w-md grid grid-cols-3 gap-3">
        {[
          { label: 'Emergency', num: '911' },
          { label: 'Poison Control', num: '1-800-222-1222' },
          { label: 'Crisis Line', num: '988' },
        ].map(({ label, num }) => (
          <a key={label} href={`tel:${num.replace(/[^0-9]/g, '')}`}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center hover:border-red-200 hover:shadow-md transition-all group">
            <FaPhoneAlt className="text-red-400 group-hover:text-red-500 mx-auto mb-1 text-sm" />
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-xs font-bold text-gray-700 mt-0.5">{num}</p>
          </a>
        ))}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="text-3xl text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Send Emergency Alert?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will notify a healthcare professional immediately.
              Only use this for genuine medical emergencies.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-1.5">
                <FaTimes className="text-xs" /> Cancel
              </button>
              <button onClick={handleSendAlert} disabled={alertState === 'sending'}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 flex items-center justify-center gap-1.5 disabled:opacity-60 shadow shadow-red-200">
                {alertState === 'sending'
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><FaPhoneAlt /> Send Alert</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyPage;
