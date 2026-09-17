"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import DeviceForm from "../../components/DeviceForm";
import { deleteDevice, getDevice } from "../../lib/api";
import type { DeviceRecord } from "../../lib/types";

const statusStyles: Record<
  DeviceRecord["status"],
  { label: string; classes: string }
> = {
  pending: {
    label: "Pending",
    classes: "bg-slate-800/80 border-slate-700 text-slate-300 shadow-slate-900/50",
  },
  in_progress: {
    label: "In Progress",
    classes: "bg-amber-900/20 border-amber-700/50 text-amber-400 shadow-amber-900/20",
  },
  completed: {
    label: "Completed",
    classes: "bg-blue-900/20 border-blue-700/50 text-blue-400 shadow-blue-900/20",
  },
  picked_up: {
    label: "Picked Up",
    classes: "bg-emerald-900/20 border-emerald-700/50 text-emerald-400 shadow-emerald-900/20",
  },
};

function formatDate(value: string | null) {
  // Receipt output uses a dash for dates that are not applicable yet, making
  // the printed document understandable without exposing null values.
  return value ? new Date(value).toLocaleDateString() : "-";
}

function formatDeviceName(device: DeviceRecord) {
  // The receipt needs one compact device label while still tolerating missing
  // brand or model data from older records.
  return [device.device_type, device.device_brand, device.device_model]
    .filter(Boolean)
    .join(" ");
}

// Loads the requested device record, updates the page state, and reports
// missing IDs or API failures so the appropriate UI state can be displayed.
export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [record, setRecord] = useState<DeviceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetches the current device details and manages loading and error states
  // while the request is in progress.
  const fetchRecord = useCallback(async () => {
    await Promise.resolve();

    if (!id) {
      setError("Missing device id.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getDevice(id);
      setRecord(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load device.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Reloads the record whenever the route ID changes.
  useEffect(() => {
    // Route parameters can change without remounting this client component, so
    // the effect must refetch whenever the ID changes.
    const timeout = window.setTimeout(() => {
      fetchRecord();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchRecord]);

  if (loading) {
    // Keep the page structure stable during the request and avoid showing stale
    // details from a previous route while the new record is being fetched.
    return (
      <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl glass-panel p-10 flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="animate-pulse">Loading device details...</p>
        </div>
      </main>
    );
  }

  if (error) {
    // The error branch includes navigation back to the list because a failed
    // detail request leaves the user without a usable record context.
    return (
      <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl relative z-10">
          <Link
            href="/"
            className="group mb-8 inline-flex items-center text-sm font-medium text-slate-400 transition hover:text-blue-400"
          >
            <span className="mr-2 transition-transform group-hover:-translate-x-1">←</span> Back to records
          </Link>

          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm text-red-400 backdrop-blur-md flex items-center gap-3 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!record) {
    // This guard protects the render below from an impossible intermediate
    // state if loading finishes without a record or an error message.
    return null;
  }

  if (isEditing) {
    // Editing replaces the read-only view with the shared form. Its callback
    // exits edit mode only after the API save has completed and then refreshes
    // the displayed record.
    return (
      <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl relative z-10">
          <Link
            href="/"
            className="group mb-8 inline-flex items-center text-sm font-medium text-slate-400 transition hover:text-blue-400"
          >
            <span className="mr-2 transition-transform group-hover:-translate-x-1">←</span> Back to records
          </Link>

          <div className="glass-panel p-8 sm:p-10 relative">
            <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] pointer-events-none"></div>
            <h1 className="mb-8 text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400 drop-shadow-sm">
              Edit Device Record
            </h1>
            <div className="relative z-10">
              {/* Exit edit mode and refresh the displayed record after saving. */}
              <DeviceForm
                initialData={record}
                onSuccess={async () => {
                  setIsEditing(false);
                  await fetchRecord();
                }}
              />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const status = statusStyles[record.status];

  return (
    <>
    <main className="screen-only min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl relative z-10">
        <Link
          href="/"
          className="group mb-8 inline-flex items-center text-sm font-medium text-slate-400 transition hover:text-blue-400"
        >
          <span className="mr-2 transition-transform group-hover:-translate-x-1">←</span> Back to records
        </Link>

        <div className="glass-panel p-8 sm:p-10 relative">
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
                  Device Details
                </p>
                <h1 className="text-3xl font-bold text-slate-100 drop-shadow-sm">
                  {record.customer_name}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-900/30 border border-blue-700/50 px-5 py-2.5 text-sm font-semibold text-blue-300 transition-all hover:bg-blue-900/50 hover:text-blue-200 hover:border-blue-600 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
                >
                  Print Receipt
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-slate-700 hover:text-white hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
                >
                  Edit Record
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center rounded-xl bg-red-900/30 border border-red-700/50 px-5 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-900/50 hover:text-red-300 hover:border-red-600 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>

            {showDeleteConfirm && (
              // Keep deletion as a two-step action because it permanently
              // removes the record and cannot be recovered from this screen.
              <div className="mb-10 rounded-xl border border-red-500/20 bg-red-950/40 p-6 backdrop-blur-md relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/5 pointer-events-none animate-pulse"></div>
                <div className="relative z-10">
                  <p className="font-medium text-red-200">Are you sure you want to delete this record?</p>
                  <p className="text-sm text-red-400/80 mt-1">This action cannot be undone and all data will be permanently lost.</p>
                  <div className="mt-5 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>

                    {/* Delete the record, redirect on success, and show any API error. */}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!id) return;
                        try {
                          setIsDeleting(true);
                          setError(null);
                          await deleteDevice(id);
                          router.push("/");
                        } catch (err) {
                          const message = err instanceof Error ? err.message : "Failed to delete device.";
                          setError(message);
                          setIsDeleting(false);
                        }
                      }}
                      disabled={isDeleting}
                      className="rounded-xl bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all hover:bg-red-500 hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDeleting ? "Deleting..." : "Confirm Delete"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-10">
              <section>
                <h2 className="mb-5 text-xl font-semibold text-slate-200 border-b border-white/5 pb-2">Customer Information</h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div className="rounded-xl bg-slate-800/40 border border-white/5 p-4 transition hover:bg-slate-800/60">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Name</div>
                    <div className="mt-1.5 text-slate-200 font-medium">{record.customer_name}</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/40 border border-white/5 p-4 transition hover:bg-slate-800/60">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</div>
                    <div className="mt-1.5 text-slate-200 font-medium">{record.customer_phone}</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/40 border border-white/5 p-4 transition hover:bg-slate-800/60">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</div>
                    <div className="mt-1.5 text-slate-200 font-medium wrap-break-word">{record.customer_email ?? "—"}</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/40 border border-white/5 p-4 transition hover:bg-slate-800/60">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Status</div>
                    <div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border shadow-sm ${status.classes}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-5 text-xl font-semibold text-slate-200 border-b border-white/5 pb-2">Device Information</h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-800/40 border border-white/5 p-4 transition hover:bg-slate-800/60">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Device Type</div>
                    <div className="mt-1.5 text-slate-200 font-medium">{record.device_type}</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/40 border border-white/5 p-4 transition hover:bg-slate-800/60">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Brand</div>
                    <div className="mt-1.5 text-slate-200 font-medium">{record.device_brand ?? "—"}</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/40 border border-white/5 p-4 transition hover:bg-slate-800/60">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Model</div>
                    <div className="mt-1.5 text-slate-200 font-medium">{record.device_model ?? "—"}</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/40 border border-white/5 p-4 transition hover:bg-slate-800/60">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Serial Number</div>
                    <div className="mt-1.5 text-slate-200 font-medium">{record.serial_number ?? "—"}</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/40 border border-white/5 p-4 transition hover:bg-slate-800/60">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date Received</div>
                    <div className="mt-1.5 text-slate-200 font-medium">
                      {new Date(record.date_received).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-800/40 border border-white/5 p-4 transition hover:bg-slate-800/60">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date Completed</div>
                    <div className="mt-1.5 text-slate-200 font-medium">
                      {record.date_completed ? new Date(record.date_completed).toLocaleDateString() : "—"}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-5 text-xl font-semibold text-slate-200 border-b border-white/5 pb-2">Issue & Notes</h2>
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-800/40 border border-white/5 p-5 transition hover:bg-slate-800/60">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reported Issue</div>
                    <div className="mt-3 whitespace-pre-wrap text-slate-300 leading-relaxed">
                      {record.issue_description}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-800/40 border border-white/5 p-5 transition hover:bg-slate-800/60">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Internal Notes</div>
                    <div className="mt-3 whitespace-pre-wrap text-slate-400 italic leading-relaxed">
                      {record.notes ? record.notes : "No notes provided."}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
    <section className="print-only print-receipt">
      <header className="receipt-header">
        <div>
          <h1>Repair Receipt</h1>
          <p>Device Register</p>
        </div>
        <div className="receipt-meta">
          <p>Record ID</p>
          <strong>{record.id}</strong>
        </div>
      </header>

      <div className="receipt-status">
        <span>Status</span>
        <strong>{status.label}</strong>
      </div>

      <section className="receipt-section">
        <h2>Customer</h2>
        <dl>
          <div>
            <dt>Name</dt>
            <dd>{record.customer_name}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{record.customer_phone}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{record.customer_email ?? "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="receipt-section">
        <h2>Device</h2>
        <dl>
          <div>
            <dt>Device</dt>
            <dd>{formatDeviceName(record)}</dd>
          </div>
          <div>
            <dt>Serial Number</dt>
            <dd>{record.serial_number ?? "-"}</dd>
          </div>
          <div>
            <dt>Date Received</dt>
            <dd>{formatDate(record.date_received)}</dd>
          </div>
          <div>
            <dt>Date Completed</dt>
            <dd>{formatDate(record.date_completed)}</dd>
          </div>
        </dl>
      </section>

      <section className="receipt-section">
        <h2>Reported Issue</h2>
        <p>{record.issue_description}</p>
      </section>

      <section className="receipt-section">
        <h2>Notes</h2>
        <p>{record.notes || "No notes provided."}</p>
      </section>
    </section>
    </>
  );
}
