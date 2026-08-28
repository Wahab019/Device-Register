"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DeviceTable from "../components/DeviceTable";
import { getDevices } from "../lib/api";
import type { DeviceRecord } from "../lib/types";

export default function HomePage() {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDevices() {
      try {
        setLoading(true);
        setError(null);
        const data = await getDevices();
        setDevices(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load devices.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchDevices();
  }, []);

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 drop-shadow-sm">
              Device Records
            </h1>
            <p className="mt-2 text-sm text-slate-400">Manage and track customer device repair status.</p>
          </div>

          <Link
            href="/new"
            className="group relative inline-flex items-center justify-center rounded-xl bg-slate-800/80 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-slate-700 hover:shadow-blue-500/25 border border-slate-700 hover:border-blue-500/50 overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-blue-400 text-lg leading-none">+</span> Add New Record
            </span>
          </Link>
        </div>

        {/* Content Area */}
        <div className="glass-panel p-1 border border-white/5 shadow-2xl relative">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] pointer-events-none"></div>
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p className="animate-pulse">Loading records...</p>
            </div>
          )}

          {!loading && error && (
            <div className="m-4 rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm text-red-400 backdrop-blur-md flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {!loading && !error && <DeviceTable devices={devices} />}
        </div>
      </div>
    </main>
  );
}
