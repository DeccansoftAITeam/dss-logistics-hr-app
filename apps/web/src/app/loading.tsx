import React from "react";
import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">DSS Logistics Intranet</h3>
        <p className="text-xs text-slate-500 mt-1">Connecting to policy repository...</p>
      </div>
    </div>
  );
}
