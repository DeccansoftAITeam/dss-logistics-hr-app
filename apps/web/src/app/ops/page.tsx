"use client";

import React, { useState, useEffect } from "react";
import { useAuthUser } from "@/context/UserContext";
import {
  Shield,
  Activity,
  MessageSquare,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  FileText,
  Lock,
  ArrowRight,
  GitFork,
  Users,
  UserPlus,
  Check,
  UserX,
  UserCheck,
  X,
  Loader2,
} from "lucide-react";

export default function OpsPage() {
  const { profile, getAuthHeaders, loading: userLoading } = useAuthUser();
  const [activeTab, setActiveTab] = useState<"overview" | "conversations" | "library" | "quality" | "users">("overview");

  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<any>(null);
  const [library, setLibrary] = useState<any[]>([]);
  const [quality, setQuality] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Add employee form
  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("User");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [evalRunning, setEvalRunning] = useState(false);
  const [reclassifying, setReclassifying] = useState(false);
  const [reclassifyMsg, setReclassifyMsg] = useState<string | null>(null);

  const apiBase = "/api";

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${apiBase}/ops/users`, { headers: getAuthHeaders() });
      if (res.ok) setUsersList(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch data for the active tab
  useEffect(() => {
    if (!profile?.isHrOps) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === "overview") {
          const res = await fetch(`${apiBase}/ops/overview`, { headers: getAuthHeaders() });
          if (res.ok) setOverview(await res.json());
        } else if (activeTab === "conversations") {
          const res = await fetch(`${apiBase}/ops/conversations`, { headers: getAuthHeaders() });
          if (res.ok) setConversations(await res.json());
        } else if (activeTab === "library") {
          const res = await fetch(`${apiBase}/ops/library`, { headers: getAuthHeaders() });
          if (res.ok) setLibrary(await res.json());
        } else if (activeTab === "quality") {
          const res = await fetch(`${apiBase}/ops/quality`, { headers: getAuthHeaders() });
          if (res.ok) setQuality(await res.json());
        } else if (activeTab === "users") {
          await fetchUsers();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, profile]);

  // Fetch trace for selected conversation
  const loadTrace = async (convId: string) => {
    setSelectedConvId(convId);
    try {
      const res = await fetch(`${apiBase}/ops/conversations/${convId}/trace`, { headers: getAuthHeaders() });
      if (res.ok) {
        setSelectedTrace(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger eval run
  const handleTriggerEval = async () => {
    setEvalRunning(true);
    try {
      const res = await fetch(`${apiBase}/ops/eval/trigger?split=dev`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const qRes = await fetch(`${apiBase}/ops/quality`, { headers: getAuthHeaders() });
        if (qRes.ok) setQuality(await qRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEvalRunning(false);
    }
  };

  // Reclassify POL-HR-012 for incident mitigation
  const handleReclassify = async () => {
    setReclassifying(true);
    setReclassifyMsg(null);
    try {
      const res = await fetch(`${apiBase}/ops/library/POL-HR-012/reclassify`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ target_audience: ["hr-managers"] }),
      });
      if (res.ok) {
        const data = await res.json();
        setReclassifyMsg(data.message);
        const libRes = await fetch(`${apiBase}/ops/library`, { headers: getAuthHeaders() });
        if (libRes.ok) setLibrary(await libRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReclassifying(false);
    }
  };

  // Update user status/role
  const handleUpdateStatus = async (userId: string, status: string, role?: string) => {
    try {
      const res = await fetch(`${apiBase}/ops/users/${userId}/status`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, role }),
      });
      if (res.ok) {
        setToastMsg(`User updated successfully (Status: ${status}${role ? `, Role: ${role}` : ""})`);
        setTimeout(() => setToastMsg(null), 4000);
        await fetchUsers();
      } else {
        const err = await res.json().catch(() => null);
        alert(`Failed to update user: ${err?.detail || "Server error"}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create/pre-provision employee
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    try {
      const res = await fetch(`${apiBase}/ops/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: newEmail.trim(),
          full_name: newName.trim() || newEmail.split("@")[0],
          role: newRole,
          status: "verified",
        }),
      });
      if (res.ok) {
        setToastMsg(`Pre-registered ${newEmail.trim()} with role ${newRole} (verified).`);
        setTimeout(() => setToastMsg(null), 4000);
        setNewEmail("");
        setNewName("");
        setShowAddUser(false);
        await fetchUsers();
      } else {
        const err = await res.json().catch(() => null);
        alert(`Failed to pre-register user: ${err?.detail || "Server error"}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Loading clearance screen while user profile is fetching
  if (userLoading) {
    return (
      <div className="max-w-xl mx-auto my-16 bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-xs animate-in fade-in duration-200">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">Verifying Operations Clearance...</h2>
        <p className="text-xs text-slate-500">
          Connecting to authentication service and querying employee clearance status.
        </p>
      </div>
    );
  }

  // Access denied screen for non-ops users
  if (!profile || !profile.isHrOps) {
    return (
      <div className="max-w-xl mx-auto my-16 bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Operations Clearance Required</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          The Operations Console is restricted to authorized HR Personnel and System Administrators. Your current login (<strong>{profile?.email || "Guest"}</strong>) does not have Operations clearance.
        </p>
        <div className="text-xs text-slate-400">
          Authorized logins: <code>aiteam@deccansoft.net</code> (Admin) or <code>suresh42326@gmail.com</code> (HR).
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Console Subheader */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-emerald-600" />
            <span>Operations & Governance Console</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time observability, security auditing, policy library governance, and employee approvals.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "overview" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("conversations")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "conversations" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Conversations & Traces
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "library" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Policy Library
          </button>
          <button
            onClick={() => setActiveTab("quality")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "quality" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Quality Gates
          </button>

          {profile?.role === "Admin" && (
            <button
              onClick={() => setActiveTab("users")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                activeTab === "users" ? "bg-white text-purple-800 shadow-xs font-bold" : "text-purple-700 hover:text-purple-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Approvals</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        overview ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Conversations</span>
                <span className="text-3xl font-extrabold text-slate-900 mt-2 block">{overview.total_conversations}</span>
                <span className="text-xs text-slate-500 mt-1 block">{overview.total_messages} total messages</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Escalations</span>
                <span className="text-3xl font-extrabold text-amber-700 mt-2 block">{overview.total_escalations}</span>
                <span className="text-xs text-emerald-600 font-bold mt-1 block">{overview.confirmed_escalations} filed to Jira HRSD</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Latency (P50 / P95)</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-slate-900">{overview.latency_p50_ms}ms</span>
                  <span className="text-sm font-semibold text-slate-500">/ {overview.latency_p95_ms}ms</span>
                </div>
                <span className="text-xs text-slate-500 mt-1 block">RRF hybrid + Azure synthesis</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Release Candidate</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-2 block">{overview.candidate_release}</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                      overview.gate_result === "pass"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    Gate: {overview.gate_result || "verified"}
                  </span>
                  {overview.eval_pass_rate_pct && (
                    <span className="text-xs font-semibold text-slate-600">({overview.eval_pass_rate_pct}%)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs shadow-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
            <span>Loading operational telemetry and metrics...</span>
          </div>
        )
      )}

      {/* TAB 2: CONVERSATIONS & TRACES */}
      {activeTab === "conversations" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs overflow-y-auto max-h-[600px]">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Employee Inquiries</span>
              <span className="text-xs font-normal text-slate-400">{conversations.length} total</span>
            </h3>
            {loading && conversations.length === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 animate-pulse space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-28 bg-slate-200 rounded" />
                      <div className="h-3 w-12 bg-slate-200 rounded" />
                    </div>
                    <div className="h-3 w-36 bg-slate-100 rounded" />
                    <div className="flex justify-between pt-1">
                      <div className="h-3 w-16 bg-slate-100 rounded" />
                      <div className="h-3 w-12 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No recorded employee inquiries yet.
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => loadTrace(c.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                      selectedConvId === c.id
                        ? "border-emerald-500 bg-emerald-50/50"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800 mb-0.5">
                      <span className="truncate max-w-[150px]" title={c.user_email || c.user_id}>
                        {c.user_name || c.user_email || c.user_id}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          c.last_outcome === "escalated"
                            ? "bg-amber-100 text-amber-800"
                            : c.last_outcome === "declined"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {c.last_outcome || "answered"}
                      </span>
                    </div>
                    {c.user_email && (
                      <div className="text-[10px] text-slate-400 truncate mb-1">
                        {c.user_email}
                      </div>
                    )}
                    <div className="text-slate-500 flex items-center justify-between text-[11px]">
                      <span>{c.message_count} messages</span>
                      <span>{new Date(c.last_message_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs max-h-[600px] overflow-y-auto">
            {selectedTrace ? (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Execution Trace Diagnostics</h3>
                  <span className="text-xs text-slate-400 font-mono">ID: {selectedTrace.conversation_id}</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Message History</h4>
                  <div className="space-y-2">
                    {selectedTrace.messages.map((m: any) => (
                      <div key={m.id} className="text-xs p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between font-semibold mb-1">
                          <span className={m.role === "user" ? "text-slate-900 font-bold" : "text-emerald-700 font-bold"}>
                            {m.role === "user" ? "👤 Employee Question" : "🤖 Policy Guidance"}
                          </span>
                          <span className="text-slate-400 font-normal">{m.latency_ms ? `${m.latency_ms}ms` : ""}</span>
                        </div>
                        <p className="text-slate-700">{m.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTrace.traces && selectedTrace.traces.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Pipeline Execution Spans
                    </h4>
                    <div className="space-y-2">
                      {selectedTrace.traces.flatMap((t: any) =>
                        t.spans.map((s: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex items-start justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {s.ordinal}
                              </span>
                              <div>
                                <span className="font-bold text-slate-800 block font-mono">{s.name}</span>
                                <pre className="text-[11px] text-slate-500 mt-1 font-mono bg-slate-50 p-1.5 rounded overflow-x-auto max-w-md">
                                  {JSON.stringify(s.detail, null, 2)}
                                </pre>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  s.status === "ok" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {s.status}
                              </span>
                              {s.duration_ms && (
                                <span className="block text-[10px] text-slate-400 mt-1 font-mono">
                                  {s.duration_ms}ms
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Activity className="w-8 h-8 text-slate-300 mb-2" />
                <span>Select a conversation from the left to inspect its execution trace.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: POLICY LIBRARY */}
      {activeTab === "library" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-purple-700" />
                  <span>Access Governance & Policy Classification</span>
                </span>
                <p className="text-xs text-purple-800 mt-1 max-w-2xl leading-relaxed">
                  Reclassify POL-HR-012 (Performance Improvement Plan Handbook) from general access to HR Managers clearance.
                </p>
                {reclassifyMsg && (
                  <span className="mt-2 inline-block text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    ✓ {reclassifyMsg}
                  </span>
                )}
              </div>

              <button
                onClick={handleReclassify}
                disabled={reclassifying}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reclassifying ? "animate-spin" : ""}`} />
                <span>{reclassifying ? "Applying..." : "Reclassify POL-HR-012 to HR Clearance"}</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Corporate Policy Documents ({library.length})</h3>
              <span className="text-xs text-slate-400">PostgreSQL Repository</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Doc ID</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Audience Clearance</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && library.length === 0 ? (
                    [1, 2, 3, 4, 5, 6].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-48 bg-slate-200 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-12 bg-slate-100 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                      </tr>
                    ))
                  ) : library.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        No policy documents found in library.
                      </td>
                    </tr>
                  ) : (
                    library.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{item.doc_id}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.title}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">v{item.version_label}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.audiences.map((a: string) => (
                              <span
                                key={a}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                  a === "all-employees"
                                    ? "bg-slate-100 text-slate-700"
                                    : a === "hr-managers"
                                    ? "bg-purple-100 text-purple-800 font-bold"
                                    : "bg-blue-100 text-blue-800 font-semibold"
                                }`}
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-100 text-emerald-800">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QUALITY GATES */}
      {activeTab === "quality" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">Gold Quality Dataset (36 Cases)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {quality ? `${quality.dev_cases_count} Development Cases · ${quality.holdout_cases_count} Held-Out Verification Cases` : "Loading quality cases..."}
              </p>
            </div>

            <button
              onClick={handleTriggerEval}
              disabled={evalRunning || !quality}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${evalRunning ? "animate-spin" : ""}`} />
              <span>{evalRunning ? "Running Evaluation Suite..." : "Run Evaluation Suite"}</span>
            </button>
          </div>

          {evalRunning && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs flex items-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 text-emerald-600 animate-spin flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900">Executing Evaluation Run on Dev Split...</h4>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Benchmarking multi-turn RRF hybrid search, conflict resolution rules, and LLM rubric assertions against 24 golden cases. This typically takes 30-45 seconds.
                </p>
              </div>
            </div>
          )}

          {quality?.latest_run ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-xs font-bold text-slate-500">Correctness Pass Rate</span>
                <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                  {quality.latest_run.correctness_pct}%
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-xs font-bold text-slate-500">Must-Escalate Recall</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                  {quality.latest_run.must_escalate_recall_pct}%
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-xs font-bold text-slate-500">Release Blockers</span>
                <span className="text-2xl font-extrabold text-rose-600 mt-1 block">
                  {quality.latest_run.release_blockers_count}
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-xs font-bold text-slate-500">Quality Gate</span>
                <span className="text-2xl font-extrabold uppercase mt-1 block text-emerald-600">
                  {quality.latest_run.gate_result}
                </span>
              </div>
            </div>
          ) : !evalRunning ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Evaluation Runs Recorded Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Click 'Run Evaluation Suite' above to benchmark the assistant against the 24 development test cases.
              </p>
            </div>
          ) : null}

          {quality?.case_results && quality.case_results.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-5 py-3 border-b border-slate-200 text-xs font-bold text-slate-800">
                Evaluation Case Results Breakdown ({quality.case_results.length} cases)
              </div>
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {quality.case_results.map((c: any, idx: number) => (
                  <div key={idx} className="p-3.5 text-xs flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{c.gold_case_id}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            c.verdict === "pass"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {c.verdict}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">{c.notes}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                      Retrieved: {c.retrieved_doc_ids.join(", ") || "None"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: USER MANAGEMENT & APPROVALS (ADMIN ONLY) */}
      {activeTab === "users" && profile?.role === "Admin" && (
        <div className="space-y-6">
          {/* Toast feedback banner */}
          {toastMsg && (
            <div className="bg-purple-50 border border-purple-200 text-purple-900 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600" />
                <span>{toastMsg}</span>
              </div>
              <button onClick={() => setToastMsg(null)} className="text-purple-400 hover:text-purple-700">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span>Employee Account Approvals & Roles</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorize newly registered employee accounts, assign roles, and revoke access.
              </p>
            </div>

            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Pre-Register Employee</span>
            </button>
          </div>

          {/* Add Employee Form */}
          {showAddUser && (
            <form
              onSubmit={handleCreateUser}
              className="bg-purple-50/60 border border-purple-200 rounded-2xl p-5 shadow-xs space-y-4"
            >
              <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                Pre-Authorize Employee Email
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="employee@domain.com"
                  className="px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full Name (optional)"
                  className="px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  <option value="User">User (Standard Employee)</option>
                  <option value="HR">HR (HR Operations)</option>
                  <option value="Admin">Admin (System Admin)</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  Save & Authorize
                </button>
              </div>
            </form>
          )}

          {/* Users Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-200 text-xs font-bold text-slate-800">
              Registered Accounts ({usersList.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Approval Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && usersList.length === 0 ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3"><div className="h-4 w-36 bg-slate-200 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                      </tr>
                    ))
                  ) : usersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        No registered accounts found.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-4 py-3 font-semibold text-slate-900">{u.email}</td>
                        <td className="px-4 py-3 text-slate-700">{u.full_name}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateStatus(u.id, u.status, e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 focus:outline-none cursor-pointer"
                          >
                            <option value="User">User</option>
                            <option value="HR">HR</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              u.status === "verified"
                                ? "bg-emerald-100 text-emerald-800"
                                : u.status === "pending_approval"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {u.status === "pending_approval" ? (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(u.id, "verified")}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 transition"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(u.id, "rejected")}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 transition"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : u.status === "verified" ? (
                            <button
                              onClick={() => handleUpdateStatus(u.id, "rejected")}
                              className="border border-rose-300 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold px-2 py-1 rounded-lg transition flex items-center gap-1"
                              title="Revoke access for this employee"
                            >
                              <UserX className="w-3 h-3" />
                              <span>Revoke Access</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(u.id, "verified")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 transition"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Reinstate</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
