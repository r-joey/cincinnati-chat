import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Bot, User, Loader2 } from 'lucide-react';
import ContactForm from '../components/ContactForm';
import ChatMessage from '../components/ChatMessage';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Chat() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [lastUnansweredQuestion, setLastUnansweredQuestion] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    createSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function createSession() {
    try {
      const res = await fetch(`${API_BASE}/api/chat/sessions`, { method: 'POST' });
      const data = await res.json();
      setSessionId(data.session.id);
      setMessages([
        {
          role: 'assistant',
          content:
            "Welcome to Cincinnati Hotel! I'm your virtual assistant. Feel free to ask me anything about our hotel — rooms, facilities, dining, prices, and more. How can I help you today?",
        },
      ]);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading || !sessionId) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMessage }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.answer, isUnanswered: data.isUnanswered },
        ]);

        if (data.isUnanswered) {
          setLastUnansweredQuestion(userMessage);
          setShowContactForm(true);
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleContactSubmit(contactData) {
    try {
      await fetch(`${API_BASE}/api/chat/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ...contactData,
          unansweredQuestion: lastUnansweredQuestion,
        }),
      });
      setShowContactForm(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Thank you! Your contact details have been submitted. A customer service representative will get back to you soon. Is there anything else I can help you with?",
        },
      ]);
    } catch (err) {
      console.error('Failed to submit contact:', err);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800">Cincinnati Hotel</h1>
            <p className="text-xs text-emerald-600">Online</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <ContactForm
          onSubmit={handleContactSubmit}
          onClose={() => setShowContactForm(false)}
        />
      )}

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="bg-white border-t border-slate-200 p-4 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about our hotel..."
          className="flex-1 px-4 py-3 bg-slate-100 rounded-xl border-none outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
