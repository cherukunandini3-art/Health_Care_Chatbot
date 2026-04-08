import React, { useState } from 'react';
import { adminAPI } from '../../services/api';
import {
  FaExclamationTriangle, FaEye, FaFlag, FaTimes,
  FaSearch, FaComments, FaCheckCircle, FaTimesCircle,
} from 'react-icons/fa';

const SeverityBadge = ({ isEmergency, isActive }) => {
  if (isEmergency) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
        <FaExclamationTriangle className="text-[10px]" />
        Emergency
      </span>
    );
  }
  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        <FaTimesCircle className="text-[10px]" />
        Closed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
      <FaCheckCircle className="text-[10px]" />
      Active
    </span>
  );
};

const formatDate = (val) => {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const ChatMonitor = ({ sessions, onRefresh }) => {
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('ALL');
  const [viewSession, setViewSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const filtered = sessions.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.username?.toLowerCase().includes(q) || s.title?.toLowerCase().includes(q);
    const matchFilter =
      filter === 'ALL'       ? true :
      filter === 'EMERGENCY' ? s.isEmergency :
      filter === 'ACTIVE'    ? s.isActive && !s.isEmergency :
      filter === 'CLOSED'    ? !s.isActive : true;
    return matchSearch && matchFilter;
  });

  const handleView = async (session) => {
    setViewSession(session);
    setLoadingMessages(true);
    try {
      const res = await adminAPI.getSessionMessages(session.id);
      if (res.data.success) setMessages(res.data.data);
      else setMessages([]);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
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
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user or session title…"
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="ALL">All Sessions</option>
          <option value="EMERGENCY">Emergency Only</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
        </select>
        <span className="text-xs text-gray-400">{filtered.length} sessions</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <FaComments className="text-5xl text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No chat sessions found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(s => (
            <div
              key={s.id}
              className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow ${
                s.isEmergency ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
              }`}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                s.isEmergency ? 'bg-red-100' : 'bg-blue-50'
              }`}>
                {s.isEmergency
                  ? <FaExclamationTriangle className="text-red-500" />
                  : <FaComments className="text-blue-500" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm truncate">{s.title || 'Untitled Session'}</span>
                  <SeverityBadge isEmergency={s.isEmergency} isActive={s.isActive} />
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                  <span className="font-medium text-gray-600">@{s.username}</span>
                  <span>·</span>
                  <span>{formatDate(s.lastMessageAt || s.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleView(s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <FaEye />
                  View
                </button>
                <button
                  title="Flag inappropriate"
                  className="p-1.5 text-orange-400 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <FaFlag />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat View Modal */}
      {viewSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  {viewSession.isEmergency && <FaExclamationTriangle className="text-red-500 text-sm" />}
                  {viewSession.title || 'Chat Session'}
                </h3>
                <p className="text-xs text-gray-400">User: @{viewSession.username}</p>
              </div>
              <button onClick={() => setViewSession(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <FaTimes className="text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-gray-400 py-10">No messages in this session</p>
              ) : messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'USER' || msg.senderType === 'USER' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.role === 'USER' || msg.senderType === 'USER'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    <p className="leading-relaxed">{msg.content}</p>
                    {msg.createdAt && (
                      <p className={`text-[10px] mt-1 ${
                        msg.role === 'USER' || msg.senderType === 'USER' ? 'text-blue-200' : 'text-gray-400'
                      }`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMonitor;
