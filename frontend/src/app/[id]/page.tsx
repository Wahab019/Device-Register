"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DeviceForm from "../../components/DeviceForm";
import { deleteDevice, getDevice } from "../../lib/api";
import type { DeviceRecord } from "../../lib/types";

const statusStyles: Record<
  DeviceRecord["status"],
  { label: string; classes: string }
> = {
  pending: {
    label: "Pending",
    classes: "bg-slate-100 text-slate-700",
  },
  in_progress: {
    label: "In Progress",
    classes: "bg-yellow-100 text-yellow-800",
  },
  completed: {
    label: "Completed",
    classes: "bg-blue-100 text-blue-800",
  },
  picked_up: {
    label: "Picked Up",
    classes: "bg-green-100 text-green-800",
  },
};

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

  const fetchRecord = async () => {
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
  };

  useEffect(() => {
    fetchRecord();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white px-4 py-6 text-slate-600 shadow-sm">
          Loading...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="mb-4 inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            ← Back to records
          </Link>

          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!record) {
    return null;
  }

  if (isEditing) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="mb-4 inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            ← Back to records
          </Link>

          <DeviceForm
            initialData={record}
            onSuccess={async () => {
              setIsEditing(false);
              await fetchRecord();
            }}
          />
        </div>
      </main>
    );
  }

  const status = statusStyles[record.status];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-4 inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          ← Back to records
        </Link>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                Device Details
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                {record.customer_name}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isDeleting}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
              <p className="font-medium">Are you sure you want to delete this record? This cannot be undone.</p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="rounded-md border border-red-200 bg-white px-3 py-1.5 font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!id) {
                      return;
                    }

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
                  className="rounded-md bg-red-600 px-3 py-1.5 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          )}

          <div className="space-y-8">
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Customer Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</div>
                  <div className="mt-1 text-slate-900">{record.customer_name}</div>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</div>
                  <div className="mt-1 text-slate-900">{record.customer_phone}</div>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</div>
                  <div className="mt-1 text-slate-900">{record.customer_email ?? "—"}</div>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</div>
                  <div className="mt-2">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.classes}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Device Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Device Type</div>
                  <div className="mt-1 text-slate-900">{record.device_type}</div>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Brand</div>
                  <div className="mt-1 text-slate-900">{record.device_brand ?? "—"}</div>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Model</div>
                  <div className="mt-1 text-slate-900">{record.device_model ?? "—"}</div>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Serial Number</div>
                  <div className="mt-1 text-slate-900">{record.serial_number ?? "—"}</div>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Date Received</div>
                  <div className="mt-1 text-slate-900">
                    {new Date(record.date_received).toLocaleDateString()}
                  </div>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Date Completed</div>
                  <div className="mt-1 text-slate-900">
                    {record.date_completed ? new Date(record.date_completed).toLocaleDateString() : "—"}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Issue & Notes</h2>
              <div className="space-y-4">
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Issue</div>
                  <div className="mt-1 whitespace-pre-wrap text-slate-900">
                    {record.issue_description}
                  </div>
                </div>

                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</div>
                  <div className="mt-1 whitespace-pre-wrap text-slate-900">
                    {record.notes ?? "—"}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
