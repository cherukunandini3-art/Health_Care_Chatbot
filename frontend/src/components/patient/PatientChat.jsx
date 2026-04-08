import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatAPI, reportAPI } from '../../services/api';
import {
  FaPaperPlane, FaPlus, FaTrash, FaRobot, FaUser,
  FaExclamationTriangle, FaComments, FaDownload, FaSearch,
  FaTimes, FaTag, FaMapMarkerAlt, FaHospital, FaUserMd,
  FaStethoscope, FaLocationArrow, FaMicrophone, FaMicrophoneSlash,
  FaVolumeUp,
} from 'react-icons/fa';

/* ─── Web Speech helpers ─── */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

/** Start mic; calls onResult(text) when speech detected, onEnd() always */
const startListening = (onResult, onEnd, lang = 'en-IN') => {
  if (!SpeechRecognition) {
    alert('Speech recognition not supported in this browser. Try Chrome or Edge.');
    onEnd();
    return null;
  }
  const rec = new SpeechRecognition();
  rec.lang = lang;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = e => onResult(e.results[0][0].transcript);
  rec.onerror  = () => onEnd();
  rec.onend    = () => onEnd();
  rec.start();
  return rec;
};

/** Speak text aloud using browser TTS; call again on same text to stop */
let _activeSpeech = null;
const speak = (text, lang = 'en-IN') => {
  if (!window.speechSynthesis) return;
  if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); if (_activeSpeech === text) { _activeSpeech = null; return; } }
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  utt.rate = 0.92;
  _activeSpeech = text;
  utt.onend = () => { _activeSpeech = null; };
  window.speechSynthesis.speak(utt);
};

/** Reusable speaker button */
const SpeakBtn = ({ text, lang = 'en-IN', className = '' }) => (
  <button
    onClick={e => { e.stopPropagation(); speak(text, lang); }}
    title="Read aloud"
    className={`p-1 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors flex-shrink-0 ${className}`}
  >
    <FaVolumeUp className="text-xs" />
  </button>
);

const CATEGORIES = ['All', 'General', 'Emergency', 'Mental Health', 'Report Analysis'];

const CAT_COLORS = {
  General:         'bg-blue-100 text-blue-700',
  Emergency:       'bg-red-100 text-red-700',
  'Mental Health': 'bg-violet-100 text-violet-700',
  'Report Analysis':'bg-orange-100 text-orange-700',
};

const detectCategory = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('emergency') || t.includes('urgent') || t.includes('severe')) return 'Emergency';
  if (t.includes('mental') || t.includes('anxiety') || t.includes('stress') || t.includes('depress')) return 'Mental Health';
  if (t.includes('report') || t.includes('lab') || t.includes('blood') || t.includes('test')) return 'Report Analysis';
  return 'General';
};

/* ─────────── Location Panel ─────────── */
const LocationPanel = ({ userLocation, locationError }) => {
  const [locInput, setLocInput]         = useState('');
  const [locResult, setLocResult]       = useState(null);
  const [locSending, setLocSending]     = useState(false);
  const [locHistory, setLocHistory]     = useState([]);
  const [locListening, setLocListening] = useState(false);
  const locRecRef = useRef(null);
  const bottomRef = useRef(null);

  const handleLocMic = () => {
    if (locListening) { locRecRef.current?.stop(); setLocListening(false); return; }
    setLocListening(true);
    locRecRef.current = startListening(
      text => setLocInput(prev => (prev + ' ' + text).trim()),
      () => setLocListening(false),
      'en-IN'
    );
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [locHistory]);

  const handleLocSend = async () => {
    const msg = locInput.trim();
    if (!msg || locSending) return;

    // If location not yet available, use Hyderabad center as fallback
    const location = userLocation || { lat: 17.385044, lon: 78.486671 };

    setLocInput('');
    setLocSending(true);
    const entry = { id: Date.now(), question: msg, result: null, error: null };
    setLocHistory(prev => [...prev, entry]);

    try {
      const res = await chatAPI.locationChat({
        message: msg,
        latitude: location.lat,
        longitude: location.lon,
      });
      const data = res.data?.data ?? res.data;
      setLocHistory(prev => prev.map(e => e.id === entry.id ? { ...e, result: data } : e));
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to get location response.';
      setLocHistory(prev => prev.map(e => e.id === entry.id ? { ...e, error: errMsg } : e));
    } finally {
      setLocSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Location status banner */}
      <div className={`px-4 py-2 text-xs flex items-center gap-2 flex-shrink-0 ${
        locationError
          ? 'bg-red-50 text-red-600'
          : userLocation
          ? 'bg-green-50 text-green-700'
          : 'bg-yellow-50 text-yellow-700'
      }`}>
        <FaLocationArrow className="flex-shrink-0" />
        {locationError
          ? `Using default location (Hyderabad). Enable GPS for precise results.`
          : userLocation
          ? `Location detected (${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)})`
          : 'Waiting for location access... (will use Hyderabad as default)'}
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {locHistory.length === 0 && (
          <div className="text-center py-16">
            <FaStethoscope className="text-5xl text-blue-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">Location-Aware Health Assistant</p>
            <p className="text-gray-400 text-xs mt-1 max-w-xs mx-auto">
              Describe your symptoms and get AI advice + nearby doctors and hospitals based on your current location.
            </p>
          </div>
        )}

        {locHistory.map(entry => (
          <div key={entry.id} className="space-y-3">
            {/* User question */}
            <div className="flex justify-end">
              <div className="max-w-[70%] bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-br-sm text-sm">
                {entry.question}
              </div>
            </div>

            {/* Loading */}
            {!entry.result && !entry.error && (
              <div className="flex items-end gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FaRobot className="text-blue-500 text-sm" />
                </div>
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {entry.error && (
              <div className="flex items-end gap-2.5">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <FaRobot className="text-red-500 text-sm" />
                </div>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl rounded-bl-sm text-sm">
                  {entry.error}
                </div>
              </div>
            )}

            {/* Result */}
            {entry.result && (
              <div className="space-y-3">
                {/* AI suggestion bubble */}
                <div className="flex items-end gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FaRobot className="text-blue-500 text-sm" />
                  </div>
                  <div className="max-w-[75%] space-y-2">
                    {/* English */}
                    <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">English</p>
                        <SpeakBtn text={entry.result.aiSuggestionEnglish || entry.result.aiSuggestion || ''} lang="en-IN" />
                      </div>
                      {entry.result.aiSuggestionEnglish || entry.result.aiSuggestion || 'No suggestion available.'}
                    </div>
                    {/* Telugu */}
                    {entry.result.aiSuggestionTelugu && (
                      <div className="bg-orange-50 border border-orange-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wide">తెలుగు</p>
                          <SpeakBtn text={entry.result.aiSuggestionTelugu} lang="te-IN" />
                        </div>
                        {entry.result.aiSuggestionTelugu}
                      </div>
                    )}
                  </div>
                </div>

                {/* Doctor cards */}
                {entry.result.recommendedDoctors?.length > 0 && (
                  <div className="ml-10">
                    <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                      <FaUserMd className="text-blue-400" /> Nearby Doctors (within 120 km)
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {entry.result.recommendedDoctors.map((d, i) => (
                        <div key={i} className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <FaUserMd className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{d.name}</p>
                            <p className="text-xs text-blue-600">{d.specialization}</p>
                          </div>
                          <span className="flex-shrink-0 text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                            {d.distance}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hospital cards */}
                {entry.result.nearbyHospitals?.length > 0 && (
                  <div className="ml-10">
                    <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                      <FaHospital className="text-green-500" /> Nearby Hospitals (1-30 km)
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {entry.result.nearbyHospitals.map((h, i) => (
                        <a
                          key={i}
                          href={`https://www.openstreetmap.org/?mlat=${h.latitude}&mlon=${h.longitude}&zoom=15`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5 hover:bg-green-100 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <FaHospital className="text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{h.name || 'Hospital'}</p>
                            <p className="text-xs text-gray-500">{h.distance || 'Nearby'} • Tap to view on map</p>
                          </div>
                          <FaMapMarkerAlt className="text-green-500 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 p-4 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={locInput}
            onChange={e => setLocInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleLocSend(); } }}
            placeholder={locListening ? "Listening..." : "Describe symptoms or tap mic to speak... (Enter to send)"}
            rows={2}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
          />
          <button
            onClick={handleLocMic}
            title={locListening ? "Stop listening" : "Speak your symptoms"}
            className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${locListening ? "bg-red-500 text-white animate-pulse hover:bg-red-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            {locListening ? <FaMicrophoneSlash className="text-sm" /> : <FaMicrophone className="text-sm" />}
          </button>
          <button
            onClick={handleLocSend}
            disabled={!locInput.trim() || locSending}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaPaperPlane className="text-sm" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          Results are fetched from nearby hospitals in the 1-30 km range from your GPS location - not a substitute for emergency services.
        </p>
      </div>
    </div>
  );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const PatientChat = () => {
  const [sessions, setSessions]         = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sendingMsg, setSendingMsg]     = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch]             = useState('');
  const [newTitle, setNewTitle]         = useState('');
  const [showNew, setShowNew]           = useState(false);

  // Location mode
  const [chatMode, setChatMode]         = useState('session'); // 'session' | 'location'
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const [sessionListening, setSessionListening] = useState(false);
  const sessionRecRef = useRef(null);

  const handleSessionMic = () => {
    if (sessionListening) {
      sessionRecRef.current?.stop();
      setSessionListening(false);
      return;
    }
    sessionRecRef.current = startListening(
      (transcript) => setInput(prev => prev ? prev + ' ' + transcript : transcript),
      () => setSessionListening(false),
      'en-IN'
    );
    if (sessionRecRef.current) setSessionListening(true);
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Acquire geolocation once on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => setLocationError(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await chatAPI.getSessions();
      if (res.data.success) setSessions(res.data.data || []);
    } catch { setSessions([]); }
    finally { setSessionsLoading(false); }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const loadMessages = async (sessionId) => {
    setLoading(true);
    try {
      const res = await chatAPI.getSessionMessages(sessionId);
      if (res.data.success) setMessages(res.data.data || []);
    } catch { setMessages([]); }
    finally { setLoading(false); }
  };

  const handleSelectSession = (s) => {
    setActiveSession(s);
    loadMessages(s.id);
  };

  const handleNewSession = async (e) => {
    e.preventDefault();
    const title = newTitle.trim() || 'New Consultation';
    try {
      const res = await chatAPI.createSession(title);
      const session = res.data?.data ?? res.data;
      setShowNew(false);
      setNewTitle('');
      await loadSessions();
      if (session?.id) handleSelectSession(session);
    } catch (err) {
      console.error('Create session failed:', err);
      alert('Failed to create session. Make sure you are logged in as a patient.');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeSession || sendingMsg) return;
    const text = input.trim();
    setInput('');
    setSendingMsg(true);
    const tempMsg = { id: Date.now(), content: text, role: 'USER', senderType: 'USER', createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    try {
      const res = await chatAPI.sendMessage({ sessionId: activeSession.id, message: text });
      if (res.data) {
        const aiMsg = {
          id: Date.now() + 1,
          content: res.data.response || res.data.message || 'Response received.',
          contentTelugu: res.data.responseTelugu || null,
          role: 'ASSISTANT',
          senderType: 'ASSISTANT',
          createdAt: new Date().toISOString(),
          isEmergency: res.data.isEmergency,
        };
        setMessages(prev => [...prev, aiMsg]);
        if (res.data.isEmergency) {
          setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, isEmergency: true } : s));
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        content: 'Sorry, something went wrong. Please try again.',
        role: 'ASSISTANT', senderType: 'ASSISTANT',
        createdAt: new Date().toISOString(), isError: true,
      }]);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    try {
      await chatAPI.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSession?.id === sessionId) { setActiveSession(null); setMessages([]); }
    } catch { /* ignore */ }
  };

  const handleDownloadPDF = () => {
    const lines = messages.map(m => `[${m.role === 'USER' || m.senderType === 'USER' ? 'You' : 'AI'}] ${m.content}`).join('\n\n');
    const blob = new Blob([`Chat: ${activeSession?.title || 'Session'}\n\n${lines}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `chat-${activeSession?.id}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSessions = sessions.filter(s => {
    const cat = detectCategory(s.title);
    const matchCat = categoryFilter === 'All' || (categoryFilter === 'Emergency' ? s.isEmergency : cat === categoryFilter);
    const matchSearch = !search || s.title?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex h-full bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
      {/* Session list (hidden in location mode) */}
      {chatMode === 'session' && (
        <div className="w-72 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Conversations</h3>
              <button
                onClick={() => setShowNew(true)}
                className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <FaPlus className="text-xs" />
              </button>
            </div>

            {/* New session form */}
            {showNew && (
              <form onSubmit={handleNewSession} className="mb-3">
                <input
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Session title (optional)"
                  className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 mb-2"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNew(false); setNewTitle(''); }}
                    className="flex-1 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {/* Search */}
            <div className="relative mb-2">
              <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search chatsâ€¦"
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            {/* Category filter */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategoryFilter(c)}
                  className={`flex-shrink-0 px-2 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    categoryFilter === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto">
            {sessionsLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-6 text-center">
                <FaComments className="text-4xl text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No conversations</p>
              </div>
            ) : filteredSessions.map(s => {
              const cat = detectCategory(s.title);
              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectSession(s)}
                  className={`group flex items-start gap-2.5 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                    activeSession?.id === s.id ? 'bg-blue-50 border-blue-100' : 'hover:bg-gray-50'
                  } ${s.isEmergency ? 'border-l-2 border-l-red-400' : ''}`}
                >
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5 ${s.isEmergency ? 'bg-red-100' : 'bg-blue-50'}`}>
                    {s.isEmergency ? <FaExclamationTriangle className="text-red-500 text-sm" /> : <FaRobot className="text-blue-500 text-sm" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.title || 'Consultation'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CAT_COLORS[s.isEmergency ? 'Emergency' : cat] || 'bg-gray-100 text-gray-500'}`}>
                        {s.isEmergency ? 'Emergency' : cat}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={e => handleDeleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mode toggle tabs */}
        <div className="bg-white border-b border-gray-100 flex flex-shrink-0">
          <button
            onClick={() => setChatMode('session')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              chatMode === 'session'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaComments className="text-sm" /> AI Chat
          </button>
          <button
            onClick={() => setChatMode('location')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              chatMode === 'location'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaMapMarkerAlt className="text-sm" />
            Find Nearby Doctors
            {userLocation && <span className="w-2 h-2 bg-green-500 rounded-full" />}
          </button>
        </div>

        {/* Location mode */}
        {chatMode === 'location' && (
          <LocationPanel userLocation={userLocation} locationError={locationError} />
        )}

        {/* Session mode */}
        {chatMode === 'session' && (
          <>
            {activeSession ? (
              <>
                {/* Chat header */}
                <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeSession.isEmergency ? 'bg-red-100' : 'bg-blue-50'}`}>
                      {activeSession.isEmergency ? <FaExclamationTriangle className="text-red-500" /> : <FaRobot className="text-blue-500" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{activeSession.title || 'AI Consultation'}</p>
                      {activeSession.isEmergency && (
                        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                          <FaExclamationTriangle className="text-[10px]" /> Emergency Session
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FaDownload /> Export
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <FaRobot className="text-5xl text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">Start the conversation</p>
                      <p className="text-gray-300 text-xs mt-1">Describe your symptoms or ask a health question</p>
                    </div>
                  ) : messages.map((msg, i) => {
                    const isUser = msg.role === 'USER' || msg.senderType === 'USER';
                    return (
                      <div key={msg.id || i} className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        {!isUser && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.isEmergency ? 'bg-red-100' : 'bg-blue-100'}`}>
                            <FaRobot className={`text-sm ${msg.isEmergency ? 'text-red-500' : 'text-blue-500'}`} />
                          </div>
                        )}
                        <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : msg.isEmergency
                            ? 'bg-red-50 border border-red-200 text-red-900 rounded-bl-sm'
                            : msg.isError
                            ? 'bg-red-50 border border-red-200 text-red-700 rounded-bl-sm'
                            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                        }`}>
                          {msg.isEmergency && !isUser && (
                            <p className="text-xs font-bold text-red-600 mb-1.5 flex items-center gap-1">
                              <FaExclamationTriangle /> Emergency Alert
                            </p>
                          )}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          {!isUser && msg.contentTelugu && (
                            <div className="mt-2 pt-2 border-t border-orange-100 bg-orange-50 rounded-xl px-3 py-2">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wide">తెలుగు</p>
                                <SpeakBtn text={msg.contentTelugu} lang="te-IN" />
                              </div>
                              <p className="text-sm text-orange-800 whitespace-pre-wrap">{msg.contentTelugu}</p>
                            </div>
                          )}
                          <div className={`flex items-center justify-between mt-1 ${isUser ? '' : ''}`}>
                            <p className={`text-[10px] ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {!isUser && <SpeakBtn text={msg.content} lang="en-IN" className="ml-2" />}
                          </div>
                        </div>
                        {isUser && (
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <FaUser className="text-white text-xs" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {sendingMsg && (
                    <div className="flex items-end gap-2.5 justify-start">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FaRobot className="text-blue-500 text-sm" />
                      </div>
                      <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                        <div className="flex gap-1 items-center">
                          <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="bg-white border-t border-gray-100 p-4 flex-shrink-0">
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={sessionListening ? 'Listening...' : 'Describe your symptoms or ask a health question... (Enter to send)'}
                      rows={2}
                      className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                    />
                    <button
                      onClick={handleSessionMic}
                      title={sessionListening ? 'Stop listening' : 'Speak your question'}
                      className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${sessionListening ? 'bg-red-500 text-white animate-pulse hover:bg-red-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {sessionListening ? <FaMicrophoneSlash className="text-sm" /> : <FaMicrophone className="text-sm" />}
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || !activeSession || sendingMsg}
                      className="flex-shrink-0 w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FaPaperPlane className="text-sm" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <FaRobot className="text-5xl text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No session selected</p>
                  <p className="text-gray-300 text-sm mt-1">Create or select a session from the sidebar</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PatientChat;