import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Image, Shield, User, Clock, CheckCircle2, PhoneCall, Radio } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppState } from '../../contexts/AppStateContext';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  attachmentUrl?: string;
  timestamp: string;
  channel: 'CLIENT' | 'ADMIN';
}

export function ContractorChatCenter() {
  const { user } = useAuth();
  const { state } = useAppState();

  const [activeChannel, setActiveChannel] = useState<'CLIENT' | 'ADMIN'>('CLIENT');
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);

  // Active client details
  const activeJob = state.jobs.find(j => j.status !== 'Closed');
  const clientName = (activeJob as any)?.customer?.name || 'Bright (Sandton Core Client)';
  const clientPhone = (activeJob as any)?.customer?.phone || '+27 82 555 7777';

  // Seeded communications log for Contractor
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      senderId: 'admin-01',
      senderName: 'Operations Control Room',
      senderRole: 'Administrator',
      text: 'Dispatch Alert: Priority CCTV & Security Assist callout received for Sandton premises. Confirm cruiser deployment.',
      timestamp: '11:15 AM',
      channel: 'ADMIN',
    },
    {
      id: 'msg-2',
      senderId: user?.id || 'con-001',
      senderName: user?.name || 'Sipho Ndlovu (Apex CCTV)',
      senderRole: 'Contractor',
      text: 'Acknowledge Control Room. Cruiser unit en route with high-definition IP camera replacement modules and signal testers.',
      timestamp: '11:17 AM',
      channel: 'ADMIN',
    },
    {
      id: 'msg-3',
      senderId: 'cust-101',
      senderName: clientName,
      senderRole: 'Customer',
      text: 'Hi Sipho, our front entrance CCTV night-vision sensor is flagging offline on the mobile app. Gate code is #4920.',
      timestamp: '11:22 AM',
      channel: 'CLIENT',
    },
    {
      id: 'msg-4',
      senderId: user?.id || 'con-001',
      senderName: user?.name || 'Sipho Ndlovu (Apex CCTV)',
      senderRole: 'Contractor',
      text: 'Copy that. I am 3 minutes away from Sandton Boulevard. Will run diagnostic check on the NVR switch upon arrival.',
      timestamp: '11:25 AM',
      channel: 'CLIENT',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachment) return;

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: user?.id || 'con-001',
      senderName: user?.name || 'Sipho Ndlovu (Apex CCTV)',
      senderRole: 'Contractor',
      text: inputText.trim(),
      attachmentUrl: attachment || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: activeChannel,
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setAttachment(null);
  };

  const handleQuickPreset = (presetText: string) => {
    setInputText(presetText);
  };

  const filteredMessages = messages.filter(m => m.channel === activeChannel);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[640px] text-zinc-100 animate-fadeIn">
      {/* HEADER BANNER */}
      <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600/20 border border-red-500/30 rounded-2xl text-red-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black italic tracking-wide uppercase text-white font-brand-header">
              Dispatch Communications & Live Chat Hub
            </h2>
            <p className="text-[10px] font-mono text-zinc-400">
              Encrypted Operational Radio & Direct Client Messaging Channel
            </p>
          </div>
        </div>

        {/* CHANNEL SWITCHER BUTTONS */}
        <div className="flex items-center bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveChannel('CLIENT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeChannel === 'CLIENT'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Chat With Client ({clientName.split(' ')[0]})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChannel('ADMIN')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeChannel === 'ADMIN'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Chat With Control Room (Admin)</span>
          </button>
        </div>
      </div>

      {/* CHANNEL SUB-HEADER INFO BAR */}
      <div className="bg-zinc-950/80 px-6 py-2.5 border-b border-zinc-800/80 flex items-center justify-between text-xs font-mono">
        {activeChannel === 'CLIENT' ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-zinc-300 font-bold">Active Customer: {clientName}</span>
              <span className="text-zinc-500">• {clientPhone}</span>
            </div>
            <a 
              href={`tel:${clientPhone}`} 
              className="text-[10px] bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1"
            >
              <PhoneCall className="w-3 h-3" /> Voice Call Client
            </a>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-zinc-300 font-bold">Operations Hub: Sandton Control Room</span>
              <span className="text-zinc-500">• SLA SLA-15 MIN EMERGENCY</span>
            </div>
            <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-bold">
              Channel: #OPS-DISPATCH-01
            </span>
          </div>
        )}
      </div>

      {/* MESSAGES SCROLL AREA */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-zinc-950/40">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs font-mono">
            No active communications in this channel yet. Type a message below to start chatting.
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.senderId === (user?.id || 'con-001');
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-2 text-[9.5px] font-mono text-zinc-400 px-1">
                  <span className="font-bold">{msg.senderName}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-red-600 text-white rounded-br-none shadow-lg'
                      : 'bg-zinc-800 text-zinc-100 rounded-bl-none border border-zinc-700'
                  }`}
                >
                  {msg.text}
                  {msg.attachmentUrl && (
                    <img
                      src={msg.attachmentUrl}
                      alt="Dispatch Attachment"
                      className="mt-2 rounded-xl border border-zinc-700 max-h-48 object-cover w-full"
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* QUICK PRESET BUTTONS */}
      <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800/80 flex items-center gap-2 overflow-x-auto text-[10px] font-mono">
        <span className="text-zinc-500 shrink-0 uppercase font-bold">Quick Presets:</span>
        <button
          type="button"
          onClick={() => handleQuickPreset('Cruiser unit in transit — ETA 5 mins to address.')}
          className="px-2.5 py-1 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 rounded-lg shrink-0 cursor-pointer"
        >
          ⏱️ En Route (ETA 5m)
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset('Arrived on site. Commencing CCTV & security audit.')}
          className="px-2.5 py-1 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 rounded-lg shrink-0 cursor-pointer"
        >
          📍 Arrived On Site
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset('CCTV system repairs completed and verified operational.')}
          className="px-2.5 py-1 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 rounded-lg shrink-0 cursor-pointer"
        >
          ✅ Work Complete
        </button>
      </div>

      {/* INPUT FORM */}
      <form onSubmit={handleSendMessage} className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            const url = prompt('Enter photo URL (e.g. CCTV equipment inspection photo):');
            if (url) setAttachment(url);
          }}
          className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl cursor-pointer transition-all"
          title="Attach Field Inspection Image"
        >
          <Image className="w-4 h-4" />
        </button>

        <input
          type="text"
          placeholder={
            activeChannel === 'CLIENT'
              ? `Message ${clientName}...`
              : 'Message Operations Control Room Dispatcher...'
          }
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          className="flex-1 text-xs p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-sans"
        />

        <button
          type="submit"
          className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-2 uppercase tracking-wider"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
