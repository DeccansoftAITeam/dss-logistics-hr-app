import React from "react";
import { Loader2, Shield } from "lucide-react";

export default function OpsLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center animate-pulse shadow-md">
        <Shield className="w-6 h-6" />
      </div>
      <div className="text-center">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading Operations & Governance Console</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">Retrieving audit telemetry and clearance data...</p>
      </div>
    </div>
  );
}
