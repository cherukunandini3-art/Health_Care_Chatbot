import React, { useRef } from 'react';
import { FaPaperPlane, FaFileMedical } from 'react-icons/fa';

const ChatInput = ({ value, onChange, onSend, onUpload, isSending }) => {
  const fileInputRef = useRef();

  return (
    <div className="w-full bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 sticky bottom-0 z-20">
      <button
        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-primary-600"
        onClick={() => fileInputRef.current.click()}
        title="Upload Medical Report"
      >
        <FaFileMedical size={20} />
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          ref={fileInputRef}
          onChange={onUpload}
        />
      </button>
      <input
        type="text"
        className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 text-gray-900 shadow-sm"
        placeholder="Type your message..."
        value={value}
        onChange={onChange}
        onKeyDown={e => e.key === 'Enter' && onSend()}
        disabled={isSending}
      />
      <button
        className="ml-2 px-4 py-2 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow transition-colors disabled:opacity-50"
        onClick={onSend}
        disabled={isSending || !value.trim()}
        title="Send"
      >
        <FaPaperPlane size={18} />
      </button>
    </div>
  );
};

export default ChatInput;
