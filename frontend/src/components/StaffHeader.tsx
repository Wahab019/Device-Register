"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth-context";

export default function StaffHeader() {
  const { user, logout } = useAuth();

  return (
    <div className="border-b border-white/5 bg-slate-900/40 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8 mb-6">
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-sm tracking-tight text-slate-200">
              Staff Portal
            </span>
          </Link>
          {user && (
            <span className="hidden sm:inline-block rounded-full bg-slate-800/80 px-2.5 py-0.5 text-xs text-slate-400 border border-white/5 font-mono">
              {user.email}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* <Link
            href="/track"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-slate-400 hover:text-blue-400 transition-colors"
          >
            Public Tracker ↗
          </Link> */}

          {user && (
            <button
              onClick={logout}
              className="rounded-lg bg-slate-800/70 border border-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30"
              title="Sign out of Staff Portal"
            >
              Log Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
