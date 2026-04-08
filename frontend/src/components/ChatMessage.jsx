import React from 'react';
import ReactMarkdown from 'react-markdown';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'USER';
  const isEmergency = message.isEmergency;

  return (
    <div className={`message-bubble ${isUser ? 'message-user' : 'message-assistant'}`}>
      {/* Role Badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-600">
          {isUser ? 'You' : 'AI Assistant'}
        </span>
        {isEmergency && (
          <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">
            🚨 EMERGENCY
          </span>
        )}
      </div>

      {/* Message Content */}
      {isEmergency ? (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      )}

      {/* Structured Response for AI messages */}
      {!isUser && message.structuredResponse && !isEmergency && (
        <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
          {message.structuredResponse.symptomSummary && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">📋 Symptom Summary:</h4>
              <p className="text-sm text-gray-600">{message.structuredResponse.symptomSummary}</p>
            </div>
          )}

          {message.structuredResponse.possibleCauses && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">🔍 Possible Causes:</h4>
              <p className="text-sm text-gray-600">{message.structuredResponse.possibleCauses}</p>
            </div>
          )}

          {message.structuredResponse.severityLevel && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">⚠️ Severity Level:</h4>
              <p className={`text-sm font-medium ${
                message.structuredResponse.severityLevel.toLowerCase().includes('high') 
                  ? 'text-red-600' 
                  : message.structuredResponse.severityLevel.toLowerCase().includes('moderate')
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}>
                {message.structuredResponse.severityLevel}
              </p>
            </div>
          )}

          {message.structuredResponse.recommendedAction && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">💡 Recommended Action:</h4>
              <p className="text-sm text-gray-600">{message.structuredResponse.recommendedAction}</p>
            </div>
          )}

          {message.structuredResponse.disclaimer && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-xs text-yellow-800">
                <strong>⚕️ Disclaimer:</strong> {message.structuredResponse.disclaimer}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Timestamp */}
      <div className="mt-3 text-xs text-gray-400">
        {new Date(message.createdAt).toLocaleString()}
      </div>
    </div>
  );
};

export default ChatMessage;
