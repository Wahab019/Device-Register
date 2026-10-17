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
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-peach mb-2">
            Repair Status Tracker
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-neutral-peach via-[#E4CBBA] to-neutral-sand">
            Track Your Device
          </h1>
          <p className="mt-2 text-sm text-neutral-sand/90">
            Enter your 8-character ticket code to view real-time repair progress.
          </p>
        </div>

        <div className="glass-panel p-8 relative border border-neutral-taupe/20 shadow-2xl">
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(255,219,187,0.03)] pointer-events-none"></div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label htmlFor="ticket_code" className="block text-sm font-medium text-neutral-sand mb-2">
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
                className="w-full font-mono uppercase tracking-wider rounded-xl glass-input px-4 py-3 text-base text-center text-[#F5EBE1] placeholder:text-neutral-sand/50 placeholder:normal-case placeholder:tracking-normal"
                required
                maxLength={20}
              />
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-neutral-peach px-6 py-3 text-sm font-bold text-[#2D1B0E] shadow-[0_0_20px_rgba(255,219,187,0.25)] transition-all hover:bg-[#ffe5cd] hover:shadow-[0_0_28px_rgba(255,219,187,0.45)]"
            >
              Track Device
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
