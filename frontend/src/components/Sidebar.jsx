import React from 'react';
import { FaPlus, FaComments, FaTrash, FaBars, FaTimes } from 'react-icons/fa';

const Sidebar = ({ 
  sessions, 
  currentSession, 
  onSelectSession, 
  onNewChat, 
  onDeleteSession,
  isOpen,
  onToggle 
}) => {
  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="md:hidden fixed top-20 left-4 z-50 bg-primary-600 text-white p-3 rounded-full shadow-lg"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative z-40 w-72 bg-gray-900 text-white h-full transition-transform duration-300 ease-in-out flex flex-col`}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={onNewChat}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <FaPlus />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs uppercase text-gray-400 font-semibold mb-3">Chat History</h3>
          
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No chat history yet</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                    currentSession?.id === session.id
                      ? 'bg-gray-700'
                      : 'hover:bg-gray-800'
                  }`}
                  onClick={() => onSelectSession(session)}
                >
                  <FaComments className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{session.title}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {session.isEmergency && (
                    <span className="text-xs bg-red-600 px-2 py-1 rounded">Emergency</span>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-opacity"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            Healthcare Chat Assistant v1.0
          </p>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default Sidebar;
