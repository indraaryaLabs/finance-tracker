import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, User, Bot, Loader2, ArrowRight } from "lucide-react";
import { Transaction, ChatMessage } from "../types";
import { chatWithKala } from "../services/gemini";

interface AIChatPanelProps {
  transactions: Transaction[];
}

export default function AIChatPanel({ transactions }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-1",
      sender: "ai",
      text: "Halo! Saya adalah Kala AI, asisten penasihat keuangan eksklusif Anda. Saya memantau pergerakan transaksi Anda dan siap mereview pola konsumsi serta memberikan resep efisiensi kas. Apa yang ingin Anda konsultasikan hari ini?",
      timestamp: new Date().toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMsg("");
    setLoading(true);

    try {
      const data = await chatWithKala(textToSend, transactions, messages);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        text: "Maaf, sepertinya koneksi asisten terputus sejenak. Silakan coba kirim kembali query keuangan Anda.",
        timestamp: new Date().toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (msg: string) => {
    handleSend(msg);
  };

  const SUGGESTIONS = [
    "Berapa pengeluaran kuliner saya bulan ini?",
    "Review anggaran tabungan ideal saya",
    "Beri taktik hemat untuk menghemat 15%",
    "Berapa sisa dana darurat aman saya?"
  ];

  return (
    <div className="w-full h-[400px] bg-[#FCFAF7] rounded-xl border border-[#e6dfd5]/60 flex flex-col overflow-hidden coffee-card-shadow" id="ai-chat-root">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-[#e6dfd5]/40 flex items-center justify-between bg-[#FAF6F0]/80" id="chat-header">
        <div className="flex items-center gap-2.5 font-sans">
          <div className="w-8 h-8 rounded-lg bg-[#b87352] text-white flex items-center justify-center shadow-sm shadow-[#b87352]/15">
            <Bot size={16} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[#804A30] tracking-wider uppercase block">
              ASISTEN INTERAKTIF
            </span>
            <h4 className="font-display font-semibold text-xs text-[#2d1d14] leading-none mt-1">
              Konsultasi Finansial Kala AI
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#7c9473] animate-pulse" />
          <span className="text-[9px] font-mono font-bold text-[#445D25] bg-[#E2EAD3] px-1.5 py-0.5 rounded border border-[#CBD8B5]/50">AUDIO-READY</span>
        </div>
      </div>

      {/* Messages Box */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4" id="chat-msg-container">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 max-w-[85%] ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
            id={`msg-${msg.id}`}
          >
            {/* Avatar block */}
            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] uppercase font-bold text-white shadow-sm ${
              msg.sender === "user" ? "bg-[#cf8a68]" : "bg-[#b87352]"
            }`}>
              {msg.sender === "user" ? <User size={12} /> : <Sparkles size={12} />}
            </div>

            {/* Bubble body */}
            <div className="space-y-1">
              <div className={`px-4 py-2.5 rounded-xl text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-[#F3E1D3]/70 text-[#2d1d14] border border-[#E8C8B0]/40"
                  : "bg-[#FAF6F0] text-[#2d1d14] border border-[#e6dfd5]/40"
              }`}>
                {msg.text}
              </div>
              <div className={`text-[9px] text-[#695D50]/60 font-mono ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 max-w-[85%] mr-auto" id="msg-loader">
            <div className="w-6 h-6 rounded-md bg-[#b87352]/10 flex items-center justify-center flex-shrink-0 text-[#b87352]">
              <Loader2 size={12} className="animate-spin" />
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-[#FAF6F0]/80 text-[#695D50] text-xs border border-[#e6dfd5]/40 flex items-center gap-1.5 font-mono">
              <Sparkles size={12} className="animate-pulse text-[#b87352]" />
              Kala AI sedang menelaah kas keuangan...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips Column */}
      {messages.length === 1 && (
        <div className="px-5 py-2.5 bg-[#FAF6F0]/30 border-t border-[#e6dfd5]/30 flex items-center gap-2 overflow-x-auto select-none font-sans" id="suggestion-chips-container">
          <span className="text-[9px] font-semibold text-[#804A30] flex-shrink-0 uppercase tracking-widest block">
            Saran Topik:
          </span>
          <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none" id="suggestion-scroll">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                id={`chip-${idx}`}
                onClick={() => handleChipClick(s)}
                className="px-2.5 py-1 text-[10px] font-semibold text-[#804A30] hover:text-white bg-[#F3E1D3]/50 border border-[#E8C8B0]/40 hover:bg-[#b87352] hover:border-[#b87352] rounded-full cursor-pointer transition-all flex-shrink-0"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputMsg);
        }}
        className="px-5 py-3 border-t border-[#e6dfd5]/30 bg-[#FAF6F0]/80 flex items-center gap-2 font-sans"
        id="chat-input-form"
      >
        <input
          id="chat-user-raw-input"
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Tanyakan pola pengeluaran atau ketik saran tabungan..."
          className="flex-1 px-4 py-2 text-xs rounded-lg border border-[#e6dfd5] focus:border-[#b87352] focus:ring-1 focus:ring-[#b87352] outline-none bg-white text-[#2d1d14] shadow-sm"
        />
        <button
          type="submit"
          id="chat-send-submit-btn"
          disabled={!inputMsg.trim() || loading}
          className="p-2 bg-[#b87352] hover:bg-[#cf8a68] disabled:opacity-50 text-white rounded-lg flex items-center justify-center cursor-pointer shadow-md shadow-[#b87352]/10"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
