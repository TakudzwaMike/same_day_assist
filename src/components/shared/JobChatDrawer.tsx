import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Image, X, Shield, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface JobChatDrawerProps {
  jobId: string;
  onClose: () => void;
}

export function JobChatDrawer({ jobId, onClose }: JobChatDrawerProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const data = await api.getJobMessages(jobId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load chat messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000); // 4-second polling backup
    return () => clearInterval(interval);
  }, [jobId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() && !attachmentUrl) return;

    setSending(true);
    try {
      const sent = await api.sendJobMessage(jobId, newMessageText, attachmentUrl || undefined);
      setMessages(prev => [...prev, sent]);
      setNewMessageText('');
      setAttachmentUrl('');
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[520px] animate-fadeIn text-slate-100">
      {/* DRAWER HEADER */}
      <div className="bg-navy px-5 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-red/10 border border-red/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-red" />
          </div>
          <div>
            <h3 className="text-xs font-brand-header uppercase tracking-wider text-white">
              Dispatch Communications
            </h3>
            <p className="text-[9.5px] font-mono text-red font-bold uppercase tracking-widest">
              Live Encrypted Channel
            </p>
          </div>
        </div>

        <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* MESSAGES LIST */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/60 font-sans">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-red" />
            <span>Connecting Direct Channel...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs font-mono">
            No direct messages exchanged yet. Send a message to coordinate dispatch details.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <span className="text-[9px] font-mono text-slate-500 px-1">
                  {msg.senderName || msg.senderRole} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div
                  className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-red text-white rounded-br-none shadow-sm'
                      : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                  }`}
                >
                  {msg.text}
                  {msg.attachmentUrl && (
                    <img
                      src={msg.attachmentUrl}
                      alt="Attachment"
                      className="mt-2 rounded-xl border border-slate-700 max-h-36 object-cover w-full"
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT FORM */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
        {attachmentUrl && (
          <div className="bg-slate-950 p-2 rounded-xl flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Attachment attached</span>
            <button type="button" onClick={() => setAttachmentUrl('')} className="text-red font-bold">Remove</button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const url = prompt('Enter image URL attachment:');
              if (url) setAttachmentUrl(url);
            }}
            className="p-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
            title="Attach Live Photo"
          >
            <Image className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder="Type message to responder..."
            value={newMessageText}
            onChange={e => setNewMessageText(e.target.value)}
            className="flex-1 text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-red font-sans"
          />

          <button
            type="submit"
            disabled={sending}
            className="p-2.5 bg-red text-white rounded-xl hover:bg-red/90 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
