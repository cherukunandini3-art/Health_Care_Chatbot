import React from 'react';
import ChatMessage from './ChatMessage';

const ChatWindow = ({ messages, isTyping }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex flex-col items-center py-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI Healthcare Assistant</h1>
          <div className="mt-2 w-full flex justify-center">
            <span className="bg-yellow-100 text-yellow-800 text-xs px-4 py-1 rounded-full font-medium border border-yellow-300">
              ⚠️ Medical Disclaimer: This assistant does not provide medical advice. Always consult a healthcare professional.
            </span>
          </div>
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4 items-center bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className="w-full flex justify-center">
            <div className="max-w-[70%] w-full">
              <ChatMessage message={msg} />
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="w-full flex justify-start">
            <div className="max-w-[70%] w-full">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></span>
                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></span>
                <span className="text-xs text-gray-400 ml-2">AI is typing...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
