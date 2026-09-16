"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useAuthUser } from "@/context/UserContext";
import { Shield, BookOpen, LogIn, Lock, CheckCircle2, Clock } from "lucide-react";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { profile, loading } = useAuthUser();

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Main Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold shadow-sm group-hover:bg-emerald-700 transition">
              DSS
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base block leading-tight">
                DSS Logistics
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Enterprise Policy Intranet</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                pathname === "/"
                  ? "bg-slate-100 text-emerald-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Policy Directory</span>
            </Link>

            {/* Show HR Ops Console if HR/Admin, or with lock indicator */}
            <Link
              href="/ops"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                pathname.startsWith("/ops")
                  ? "bg-slate-100 text-emerald-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Operations Console</span>
              {profile && !profile.isHrOps && (
                <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Ops Only
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Right Actions: Real User Details & Clerk Auth */}
        <div className="flex items-center gap-3">
          <SignedIn>
            {profile && (
              <div className="hidden sm:flex flex-col text-right pr-1">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                  {profile.fullName || profile.email}
                </span>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                      profile.status === "pending_approval"
                        ? "bg-amber-100 text-amber-800"
                        : profile.role === "Admin"
                        ? "bg-purple-100 text-purple-800"
                        : profile.role === "HR"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {profile.status === "pending_approval" ? (
                      <>
                        <Clock className="w-2.5 h-2.5" />
                        Pending Approval
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {profile.role}
                      </>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                    {profile.email}
                  </span>
                </div>
              </div>
            )}

            <div className="pl-2 border-l border-slate-200">
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8 shadow-xs",
                  },
                }}
              />
            </div>
          </SignedIn>

          <SignedOut>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Employee Sign In</span>
            </Link>
          </SignedOut>
        </div>
      </div>
    </header>
  );
};
