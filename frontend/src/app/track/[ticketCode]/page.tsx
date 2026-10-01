"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { trackDevice } from "../../../lib/api";
import type { DeviceTrackRecord } from "../../../lib/types";

const statusStyles: Record<
  string,
  { label: string; badgeClasses: string; dotClasses: string }
> = {
  pending: {
    label: "Pending",
    badgeClasses: "bg-slate-800/80 border-slate-700 text-slate-300 shadow-slate-900/50",
    dotClasses: "bg-slate-400 ring-slate-500/20",
  },
  in_progress: {
    label: "In Progress",
    badgeClasses: "bg-amber-900/20 border-amber-700/50 text-amber-400 shadow-amber-900/20",
    dotClasses: "bg-amber-400 ring-amber-500/20",
  },
  ready_for_pickup: {
    label: "Ready for Pickup",
    badgeClasses: "bg-emerald-900/20 border-emerald-700/50 text-emerald-400 shadow-emerald-900/20",
    dotClasses: "bg-emerald-400 ring-emerald-500/20",
  },
  completed: {
    label: "Completed",
    badgeClasses: "bg-blue-900/20 border-blue-700/50 text-blue-400 shadow-blue-900/20",
    dotClasses: "bg-blue-400 ring-blue-500/20",
  },
};

function formatStatus(status: string) {
  return statusStyles[status]?.label ?? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TicketTrackingPage() {
  const params = useParams();
  const rawCode = Array.isArray(params.ticketCode) ? params.ticketCode[0] : params.ticketCode;
  const ticketCode = rawCode ? decodeURIComponent(rawCode).trim().toUpperCase() : "";

  const [record, setRecord] = useState<DeviceTrackRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketCode) {
      setError("No ticket code provided.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    trackDevice(ticketCode)
      .then((data) => {
        if (isMounted) {
          setRecord(data);
          setLoading(false);
        }
      })
      .catch((_err) => {
        if (isMounted) {
          setError("Ticket not found. Please verify your ticket code and try again.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [ticketCode]);

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-16 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="mx-auto max-w-md w-full glass-panel p-10 flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="animate-pulse text-sm">Loading repair status...</p>
        </div>
      </main>
    );
  }

  if (error || !record) {
    return (
      <main className="min-h-screen px-4 py-16 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="mx-auto max-w-md w-full glass-panel p-8 text-center relative">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Ticket Not Found</h2>
          <p className="text-sm text-slate-400 mb-6">
            We couldn't find a record for <span className="font-mono text-slate-200 font-semibold">{ticketCode}</span>. Please double-check the ticket code.
          </p>
          <Link
            href="/track"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            ← Enter Another Code
          </Link>
        </div>
      </main>
    );
  }

  const currentStatusConfig = statusStyles[record.status] ?? {
    label: formatStatus(record.status),
    badgeClasses: "bg-slate-800 text-slate-300 border-slate-700",
    dotClasses: "bg-slate-400",
  };

  const deviceFullName = [record.device_type, record.device_brand, record.device_model]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/track"
            className="group inline-flex items-center text-sm font-medium text-slate-400 transition hover:text-blue-400"
          >
            <span className="mr-2 transition-transform group-hover:-translate-x-1">←</span> Lookup another ticket
          </Link>

          <span className="font-mono text-xs text-blue-400 bg-blue-950/40 px-3 py-1 rounded-full border border-blue-800/40">
            {ticketCode}
          </span>
        </div>

        <div className="glass-panel p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] pointer-events-none"></div>

          <div className="relative z-10">
            {/* Status Header */}
            <div className="border-b border-white/5 pb-8 mb-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Repair Status
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
                  {deviceFullName}
                </h1>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold border shadow-sm ${currentStatusConfig.badgeClasses}`}
                  >
                    {currentStatusConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Device Details Grid */}
            <section className="mb-10">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Service Overview
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-800/40 border border-white/5 p-3.5">
                  <div className="text-xs text-slate-500 font-medium">Device Type</div>
                  <div className="mt-1 text-sm font-medium text-slate-200">{record.device_type}</div>
                </div>

                <div className="rounded-xl bg-slate-800/40 border border-white/5 p-3.5">
                  <div className="text-xs text-slate-500 font-medium">Brand & Model</div>
                  <div className="mt-1 text-sm font-medium text-slate-200">
                    {[record.device_brand, record.device_model].filter(Boolean).join(" ") || "—"}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-800/40 border border-white/5 p-3.5">
                  <div className="text-xs text-slate-500 font-medium">Date Received</div>
                  <div className="mt-1 text-sm font-medium text-slate-200">
                    {new Date(record.date_received).toLocaleDateString()}
                  </div>
                </div>

                {record.date_completed && (
                  <div className="rounded-xl bg-slate-800/40 border border-white/5 p-3.5 col-span-2 sm:col-span-3">
                    <div className="text-xs text-slate-500 font-medium">Date Completed</div>
                    <div className="mt-1 text-sm font-medium text-blue-400">
                      {new Date(record.date_completed).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Status Timeline */}
            <section className="mb-10">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
                Status History Timeline
              </h2>

              {record.status_history && record.status_history.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700/60">
                  {record.status_history.map((item, index) => {
                    const itemStyle = statusStyles[item.new_status] ?? {
                      label: formatStatus(item.new_status),
                      badgeClasses: "",
                      dotClasses: "bg-slate-400",
                    };
                    const isLatest = index === record.status_history.length - 1;

                    return (
                      <div key={index} className="relative group">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-slate-900 ${
                            itemStyle.dotClasses
                          } ${isLatest ? "ring-4 ring-blue-500/20" : ""}`}
                        />
                        <div className="rounded-xl bg-slate-800/30 border border-white/5 p-4 transition hover:bg-slate-800/50">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="text-sm font-semibold text-slate-200">
                              {itemStyle.label}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(item.changed_at).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-slate-800/20 border border-dashed border-slate-700/40 p-6 text-center text-sm text-slate-400">
                  Initial status recorded: <span className="font-medium text-slate-200">{currentStatusConfig.label}</span>
                </div>
              )}
            </section>

            {/* Billing & Repair Charges Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Repair Charges & Bill
                </h2>
                {typeof record.total_charges === "number" && record.total_charges > 0 && (
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/40">
                    Total: ${record.total_charges.toFixed(2)}
                  </span>
                )}
              </div>

              {record.charges && record.charges.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-white/5 bg-slate-800/30">
                  <div className="divide-y divide-white/5">
                    {record.charges.map((charge, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-slate-200">{charge.description}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(charge.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <span className="text-sm font-semibold font-mono text-slate-100">
                          ${charge.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between bg-slate-800/70 px-4 py-3.5 border-t border-white/5">
                    <span className="text-sm font-medium text-slate-300">Total Accumulated Bill</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">
                      ${(record.total_charges ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-800/20 border border-dashed border-slate-700/40 p-6 text-center text-sm text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                  <p className="text-slate-300 font-medium">No charges added yet</p>
                  <p className="text-xs text-slate-500 mt-1">Itemized service fees or parts will appear here as they are logged.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
