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
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-900">
            Customer Device Records
          </h1>

          <Link
            href="/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            + Add New Record
          </Link>
        </div>

        {loading && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-slate-600 shadow-sm">
            Loading...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {!loading && !error && <DeviceTable devices={devices} />}
      </div>
    </main>
  );
}
