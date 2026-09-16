"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuthUser } from "../context/UserContext";
import {
  Send,
  Bot,
  User,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
  Clock,
  X,
  MessageSquare,
  Minus,
  Maximize2,
} from "lucide-react";

interface Citation {
  chunk_id: string;
  doc_id: string;
  title: string;
  section_heading?: string;
  version_label: string;
  snippet: string;
}

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  outcome?: "answered" | "declined" | "escalated" | "redirected";
  citations?: Citation[];
  escalation_token?: string | null;
  escalation_summary?: string | null;
  confirmed_ticket?: string | null;
  latency_ms?: number;
}

const SAMPLE_QUERIES = [
  { label: "Remote Allowance", query: "What is the remote-work equipment allowance?" },
  { label: "Sick Leave Days", query: "How many sick-leave days do I get in India?" },
  { label: "Mumbai Per Diem", query: "What is the maximum daily per-diem allowance for travel to Mumbai?" },
  { label: "Disciplinary Policy", query: "What are the progressive steps in the internal disciplinary procedure POL-HR-010?" },
  { label: "Severance Advice", query: "Should I accept this severance package HR offered me?" },
];

interface FloatingChatbotProps {
  onOpenPolicy?: (docId: string) => void;
  externalQuery?: string | null;
  onClearExternalQuery?: () => void;
}

export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({
  onOpenPolicy,
  externalQuery,
  onClearExternalQuery,
}) => {
  const { profile, getAuthHeaders } = useAuthUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});
  const [confirmingEscalation, setConfirmingEscalation] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalQuery) {
      setIsOpen(true);
      handleSend(externalQuery);
      if (onClearExternalQuery) onClearExternalQuery();
    }
  }, [externalQuery]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  const handleReset = () => {
    setMessages([]);
    setConversationId(null);
  };

  const handleSend = async (userQuery?: string) => {
    const textToSend = userQuery || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: MessageItem = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userQuery) setInput("");
    setLoading(true);

    try {
      const resp = await fetch("/api/ask", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: textToSend,
          conversation_id: conversationId || undefined,
        }),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => null);
        throw new Error(errJson?.detail || errJson?.error || `Server responded with status ${resp.status}`);
      }

      const data = await resp.json();
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      const botMsg: MessageItem = {
        id: data.message_id || Date.now().toString(),
        role: "assistant",
        content: data.answer,
        outcome: data.outcome,
        citations: data.citations || [],
        escalation_token: data.escalation_token,
        escalation_summary: data.escalation_summary,
        latency_ms: data.latency_ms,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `⚠️ Failed to get a response: ${err.message}. Please ensure the backend service is running.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEscalation = async (msgId: string, token: string) => {
    setConfirmingEscalation((prev) => ({ ...prev, [msgId]: true }));
    try {
      const resp = await fetch("/api/escalate/confirm", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          confirmation_token: token,
          employee_notes: "Submitted via DSS Ask Policy floating chat interface",
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, confirmed_ticket: data.jira_issue_key || "HRSD-1" } : m
          )
        );
      } else {
        const err = await resp.json();
        alert(`Failed to confirm escalation: ${err.detail || "Server error"}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setConfirmingEscalation((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const toggleCitations = (id: string) => {
    setExpandedCitations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Drawer/Window */}
      {isOpen && (
        <div className="w-[380px] sm:w-[440px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block leading-tight">Ask Policy AI</span>
                <span className="text-[10px] text-slate-400">DSS Logistics Policy Assistant</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={handleReset}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
                  title="New Conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
                title="Close Window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pending Approval Notice if applicable */}
          {profile?.status === "pending_approval" && (
            <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2 text-[11px] text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Your account is awaiting HR verification. AI queries are restricted.</span>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                  <Bot className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">How can I help you today?</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mb-4">
                  Ask questions about leave policies, travel expenses, IT allowances, or benefits.
                </p>

                <div className="w-full space-y-1.5 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Suggested Questions:
                  </span>
                  {SAMPLE_QUERIES.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q.query)}
                      className="w-full text-left text-xs bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 text-slate-700 px-3 py-1.5 rounded-xl transition flex items-center gap-2 shadow-xs"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{q.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex-shrink-0 flex items-center justify-center mt-1 text-xs">
                      <Bot className="w-3 h-3" />
                    </div>
                  )}

                  <div className={`max-w-[85%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        m.role === "user"
                          ? "bg-emerald-600 text-white rounded-br-none shadow-xs"
                          : m.outcome === "declined"
                          ? "bg-rose-50 border border-rose-200 text-rose-900 rounded-bl-none"
                          : m.outcome === "escalated"
                          ? "bg-amber-50 border border-amber-200 text-amber-950 rounded-bl-none"
                          : "bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-xs"
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.content}</p>

                      {m.latency_ms && (
                        <div className="mt-1.5 text-[9px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{m.latency_ms}ms</span>
                        </div>
                      )}
                    </div>

                    {/* Escalation Card */}
                    {m.escalation_token && (
                      <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-bold text-amber-900 block text-[11px]">
                              HR Escalation Recommended
                            </span>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                              {m.escalation_summary}
                            </p>

                            {m.confirmed_ticket ? (
                              <a
                                href={`https://fde-dss-logistics.atlassian.net/browse/${m.confirmed_ticket}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 flex items-center justify-between gap-1 text-[11px] text-emerald-800 hover:text-emerald-950 font-bold bg-emerald-100/70 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-300 transition"
                              >
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Ticket filed in Jira: <strong>{m.confirmed_ticket}</strong></span>
                                </div>
                                <ExternalLink className="w-3 h-3 text-emerald-700" />
                              </a>
                            ) : (
                              <button
                                onClick={() => handleConfirmEscalation(m.id, m.escalation_token!)}
                                disabled={confirmingEscalation[m.id]}
                                className="mt-2 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm transition flex items-center gap-1 disabled:opacity-50"
                              >
                                <span>{confirmingEscalation[m.id] ? "Filing..." : "Confirm Escalation to Jira"}</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Citations */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-1.5">
                        <button
                          onClick={() => toggleCitations(m.id)}
                          className="text-[10px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded-md"
                        >
                          <BookOpen className="w-3 h-3 text-emerald-600" />
                          <span>{m.citations.length} Policy Citations</span>
                          {expandedCitations[m.id] ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>

                        {expandedCitations[m.id] && (
                          <div className="mt-1 space-y-1 pl-1 border-l-2 border-emerald-500">
                            {m.citations.map((c, idx) => (
                              <div
                                key={idx}
                                className="bg-white border border-slate-200 rounded-md p-2 text-[10px] space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-emerald-800">
                                    {c.doc_id} (v{c.version_label})
                                  </span>
                                  {onOpenPolicy && (
                                    <button
                                      onClick={() => onOpenPolicy(c.doc_id)}
                                      className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-0.5 underline"
                                    >
                                      <span>Read Doc</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-slate-600 italic">
                                  "{c.snippet}"
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {m.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex-shrink-0 flex items-center justify-center mt-1 text-xs">
                      <User className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex gap-2 justify-start items-center text-slate-500 text-xs pl-2">
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span className="text-[11px]">Searching policies & synthesizing answer...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-2.5 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-1.5"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a policy question..."
                disabled={loading || profile?.status === "pending_approval"}
                className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || profile?.status === "pending_approval"}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition font-semibold text-xs group"
      >
        <div className="relative">
          <MessageSquare className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        </div>
        <span>Ask Policy AI</span>
        <Sparkles className="w-3.5 h-3.5 text-emerald-200 group-hover:rotate-12 transition" />
      </button>
    </div>
  );
};
