"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function TrackLookupPage() {
  const router = useRouter();
  const [ticketCode, setTicketCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleaned = ticketCode.trim().toUpperCase();
    if (!cleaned) {
      setError("Please enter your ticket code.");
      return;
    }
    setError(null);
    router.push(`/track/${encodeURIComponent(cleaned)}`);
  };

  return (
    <main className="min-h-screen px-4 py-16 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
            Repair Status Tracker
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">
            Track Your Device
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter your 8-character ticket code to view real-time repair progress.
          </p>
        </div>

        <div className="glass-panel p-8 relative">
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] pointer-events-none"></div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label htmlFor="ticket_code" className="block text-sm font-medium text-slate-300 mb-2">
                Ticket Code
              </label>
              <input
                id="ticket_code"
                type="text"
                value={ticketCode}
                onChange={(e) => {
                  setTicketCode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. DR-7K3QX9A1"
                className="w-full font-mono uppercase tracking-wider rounded-xl glass-input px-4 py-3 text-base text-center text-slate-100 placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal"
                required
                maxLength={20}
              />
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(37,99,235,0.6)]"
            >
              Track Device
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
