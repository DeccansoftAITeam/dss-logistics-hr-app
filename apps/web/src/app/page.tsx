"use client";

import React, { useState, useEffect } from "react";
import { useAuthUser } from "../context/UserContext";
import { FloatingChatbot } from "../components/FloatingChatbot";
import {
  BookOpen,
  Search,
  Calendar,
  DollarSign,
  Laptop,
  HelpCircle,
  FileText,
  Clock,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  X,
  Bot,
  Loader2,
} from "lucide-react";

interface PolicyItem {
  doc_id: string;
  title: string;
  category: string;
  region_scope: string | null;
  version_label: string;
  effective_date: string;
  status: string;
  audiences: string[];
  summary: string;
}

interface PolicyDetail extends PolicyItem {
  extracted_text?: string;
  sections?: Array<{
    ordinal: number;
    heading_path: string;
    text_content: string;
  }>;
}

export default function IntranetPortalPage() {
  const { profile, loading: userLoading } = useAuthUser();
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [chatbotQuery, setChatbotQuery] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await fetch("/api/policies");
        if (res.ok) {
          setPolicies(await res.json());
        }
      } catch (e) {
        console.error("Failed to load policies:", e);
      } finally {
        setLoadingPolicies(false);
      }
    };
    fetchPolicies();
  }, [profile]);

  const handleOpenPolicy = async (docId: string) => {
    setLoadingDocId(docId);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/policies/${docId}`);
      if (res.ok) {
        setSelectedPolicy(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
      setLoadingDocId(null);
    }
  };

  const filteredPolicies = policies.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.doc_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.summary.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCategory === "all") return matchesSearch;
    return matchesSearch && p.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const categories = [
    { id: "all", label: "All Policies" },
    { id: "leave", label: "Leave & Attendance" },
    { id: "remote", label: "Remote Work & IT" },
    { id: "travel", label: "Travel & Expense" },
    { id: "conduct", label: "Conduct & Ethics" },
    { id: "operations", label: "Operations & HR" },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
            <span>Official Policy Portal</span>
            <span>·</span>
            <span>DSS Logistics Pvt Ltd</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {profile ? `Welcome, ${profile.fullName || profile.email}` : "Welcome to DSS Logistics Intranet"}
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Access current corporate guidelines, regional addenda, travel allowances, and IT equipment rules. Ask our floating AI assistant anytime for instant answers.
          </p>

          {userLoading ? (
            <div className="flex items-center gap-3 mt-4">
              <div className="h-6 w-24 bg-white/20 rounded-full animate-pulse" />
              <div className="h-6 w-44 bg-white/20 rounded-full animate-pulse" />
            </div>
          ) : profile ? (
            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
              <span className="bg-white/10 px-3 py-1 rounded-full font-medium text-slate-200">
                Role: <strong className="text-white">{profile.role}</strong>
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full font-medium text-slate-200">
                Email: <strong className="text-white">{profile.email}</strong>
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Pending Approval Notice */}
      {profile?.status === "pending_approval" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs flex items-start gap-3.5">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">Account Pending HR Approval</h3>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Your login (<code>{profile.email}</code>) is currently waiting for authorization by the HR Operations Administrator. You will receive policy access once verified.
            </p>
          </div>
        </div>
      )}

      {/* Static Intranet Highlights (Real-world Company Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Holiday Calendar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Holiday Calendar 2026</h3>
          <p className="text-sm font-bold text-slate-900 mt-1">India & US Schedules</p>
          <span className="text-xs text-slate-500 mt-1 block">
            10 Mandatory Public Holidays · CAL-2026
          </span>
          <button
            onClick={() => handleOpenPolicy("CAL-2026")}
            disabled={loadingDocId === "CAL-2026"}
            className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 disabled:opacity-60"
          >
            {loadingDocId === "CAL-2026" ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>View Calendar</span>
                <ArrowRight className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Card 2: Remote Equipment */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Laptop className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remote Equipment</h3>
          <p className="text-sm font-bold text-slate-900 mt-1">₹25,000 / $300 USD</p>
          <span className="text-xs text-slate-500 mt-1 block">
            One-time desk setup allowance · POL-HR-006
          </span>
          <button
            onClick={() => handleOpenPolicy("POL-HR-006")}
            disabled={loadingDocId === "POL-HR-006"}
            className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 disabled:opacity-60"
          >
            {loadingDocId === "POL-HR-006" ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Read Details</span>
                <ArrowRight className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Card 3: Travel Per Diem */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Travel Per Diem</h3>
          <p className="text-sm font-bold text-slate-900 mt-1">Tier-1 & US Travel Rates</p>
          <span className="text-xs text-slate-500 mt-1 block">
            Approved hotel & daily meals · POL-HR-007
          </span>
          <button
            onClick={() => handleOpenPolicy("POL-HR-007")}
            disabled={loadingDocId === "POL-HR-007"}
            className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 disabled:opacity-60"
          >
            {loadingDocId === "POL-HR-007" ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Review Rates</span>
                <ArrowRight className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Card 4: HR Escalation */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">HR Service Desk</h3>
          <p className="text-sm font-bold text-slate-900 mt-1">Jira Cloud (HRSD)</p>
          <span className="text-xs text-slate-500 mt-1 block">
            Direct escalations for complex cases
          </span>
          <a
            href="https://fde-dss-logistics.atlassian.net"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Open Jira Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Policy Directory Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>Published Corporate Policies</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Browse approved policies or filter by category. Click any document to read in-depth.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search policy by title or ID..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
                selectedCategory === c.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Policy Grid */}
        {loadingPolicies ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs animate-pulse space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="h-5 w-24 bg-slate-200 rounded-md" />
                  <div className="h-4 w-12 bg-slate-100 rounded-md" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-4/5 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-3/4 bg-slate-100 rounded" />
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="h-3 w-28 bg-slate-100 rounded" />
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No policies found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPolicies.map((p) => (
              <div
                key={p.doc_id}
                onClick={() => handleOpenPolicy(p.doc_id)}
                className="bg-slate-50/70 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-2xl p-5 transition cursor-pointer flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      {p.doc_id}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      v{p.version_label}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800 transition">
                    {p.title}
                  </h3>

                  <p className="text-slate-500 text-xs mt-2 line-clamp-3 leading-relaxed">
                    {p.summary || "Click to read full company guidelines and procedures."}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-emerald-700 font-semibold">
                  <span>Effective: {p.effective_date}</span>
                  <span className="group-hover:translate-x-1 transition flex items-center gap-1">
                    {loadingDocId === p.doc_id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                        <span>Opening...</span>
                      </>
                    ) : (
                      <>
                        <span>Read</span>
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Policy Reader Modal */}
      {(selectedPolicy || loadingDetail) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-150">
            {loadingDetail ? (
              <div className="p-8 space-y-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-28 bg-emerald-100 rounded-md" />
                    <div className="h-6 w-64 bg-slate-200 rounded-md" />
                  </div>
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                </div>
                <div className="space-y-3 pt-6 border-t border-slate-100">
                  <div className="h-4 w-1/3 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-5/6 bg-slate-100 rounded" />
                  <div className="h-3 w-4/5 bg-slate-100 rounded" />
                </div>
                <div className="space-y-3 pt-4">
                  <div className="h-4 w-1/4 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-3/4 bg-slate-100 rounded" />
                </div>
              </div>
            ) : selectedPolicy ? (
              <>
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {selectedPolicy.doc_id}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        Version {selectedPolicy.version_label} · Effective {selectedPolicy.effective_date}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      {selectedPolicy.title}
                    </h2>
                  </div>

                  <button
                    onClick={() => setSelectedPolicy(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-slate-800 text-sm leading-relaxed">
                  {selectedPolicy.sections && selectedPolicy.sections.length > 0 ? (
                    selectedPolicy.sections.map((sec, idx) => (
                      <div key={idx} className="space-y-1.5">
                        {sec.heading_path && (
                          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-1 pt-2">
                            {sec.heading_path}
                          </h3>
                        )}
                        <p className="whitespace-pre-line text-slate-700 text-xs sm:text-sm">
                          {sec.text_content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="whitespace-pre-line">
                      {selectedPolicy.extracted_text || "No content available."}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500 font-medium">
                    Audience: {selectedPolicy.audiences.join(", ")}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const q = `What are the key rules and employee entitlements in ${selectedPolicy.doc_id} (${selectedPolicy.title})?`;
                        setChatbotQuery(q);
                        setSelectedPolicy(null);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Ask Policy AI about this</span>
                    </button>
                    <button
                      onClick={() => setSelectedPolicy(null)}
                      className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition"
                    >
                      Close Reader
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Floating Chatbot Widget (docked at bottom-right) */}
      <FloatingChatbot
        onOpenPolicy={handleOpenPolicy}
        externalQuery={chatbotQuery}
        onClearExternalQuery={() => setChatbotQuery(null)}
      />
    </div>
  );
}
