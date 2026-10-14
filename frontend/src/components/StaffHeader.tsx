"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth-context";

export default function StaffHeader() {
  const { user, logout } = useAuth();

  return (
    <div className="border-b border-[#997E67]/20 bg-[#20150E]/60 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8 mb-6">
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="h-2 w-2 rounded-full bg-[#FFDBBB] shadow-[0_0_8px_rgba(255,219,187,0.7)] animate-pulse"></span>
            <span className="font-semibold text-sm tracking-tight text-[#F5EBE1] group-hover:text-[#FFDBBB] transition-colors">
              Staff Portal
            </span>
          </Link>
          {user && (
            <span className="hidden sm:inline-block rounded-full bg-[#664930]/40 px-2.5 py-0.5 text-xs text-[#CCBEB1] border border-[#997E67]/30 font-mono">
              {user.email}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={logout}
              className="rounded-lg bg-[#664930]/40 border border-[#997E67]/30 px-3 py-1.5 text-xs font-medium text-[#CCBEB1] transition hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/40"
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
