import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

const ChatPage = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Load chat sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load messages when session changes
  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession.id);
    }
  }, [currentSession]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const response = await chatAPI.getSessions();
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadMessages = async (sessionId) => {
    try {
      const response = await chatAPI.getSessionMessages(sessionId);
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setLoading(true);

    // Add user message to UI immediately
    const tempUserMessage = {
      id: Date.now(),
      content: userMessage,
      role: 'USER',
      createdAt: new Date().toISOString(),
    };
    setMessages([...messages, tempUserMessage]);

    try {
      const response = await chatAPI.sendMessage({
        sessionId: currentSession?.id,
        message: userMessage,
      });

      if (response.data) {
        // If new session was created
        if (!currentSession || response.data.sessionId !== currentSession.id) {
          await loadSessions();
          const newSession = { id: response.data.sessionId };
          setCurrentSession(newSession);
        }

        // Add assistant message
        const assistantMessage = {
          id: response.data.messageId,
          content: response.data.response,
          role: 'ASSISTANT',
          createdAt: response.data.timestamp,
          structuredResponse: response.data.structuredResponse,
          isEmergency: response.data.isEmergency,
        };

        setMessages((prev) => [...prev.slice(0, -1), tempUserMessage, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    setCurrentSession(null);
    setMessages([]);
  };

  const handleSelectSession = (session) => {
    setCurrentSession(session);
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await chatAPI.deleteSession(sessionId);
      loadSessions();
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleRegenerateResponse = async () => {
    if (!currentSession || loading) return;

    setLoading(true);
    try {
      // Remove last assistant message
      const filteredMessages = messages.slice(0, -1);
      setMessages(filteredMessages);

      const response = await chatAPI.regenerateResponse(currentSession.id);
      
      if (response.data) {
        const assistantMessage = {
          id: response.data.messageId,
          content: response.data.response,
          role: 'ASSISTANT',
          createdAt: response.data.timestamp,
          structuredResponse: response.data.structuredResponse,
          isEmergency: response.data.isEmergency,
        };
        
        setMessages([...filteredMessages, assistantMessage]);
      }
    } catch (error) {
      console.error('Error regenerating response:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        <ChatWindow messages={messages} isTyping={loading} />
        <ChatInput
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          onSend={handleSendMessage}
          onUpload={() => {}} // TODO: implement file upload logic
          isSending={loading}
        />
      </div>
    </div>
  );
};

export default ChatPage;
