"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DeviceTable from "../components/DeviceTable";
import { getDevices } from "../lib/api";
import type { DeviceRecord } from "../lib/types";

const PAGE_SIZE = 20;
type SortColumn = "customer_name" | "date_received" | "status";
type SortDirection = "asc" | "desc";

// Displays the main device dashboard and loads the current list of records.
export default function HomePage() {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalDevices, setTotalDevices] = useState(0);
  const [sortColumn, setSortColumn] = useState<SortColumn>("date_received");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const hasMoreDevices = devices.length < totalDevices;

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setPage(1);
  };

  // Fetches the requested device page and updates loading/error state based on
  // the outcome of the API request.
  useEffect(() => {
    async function fetchDevices() {
      try {
        setLoading(page === 1);
        setLoadingMore(page > 1);
        setError(null);
        const data = await getDevices({
          page,
          pageSize: PAGE_SIZE,
          search: searchQuery,
          status: statusFilter as DeviceRecord["status"] | "all",
          sortBy: sortColumn,
          sortDirection,
        });
        setDevices((currentDevices) => page === 1 ? data.items : [...currentDevices, ...data.items]);
        setTotalDevices(data.total);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load devices.";
        setError(message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }

    fetchDevices();
  }, [page, searchQuery, statusFilter, sortColumn, sortDirection]);

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400 drop-shadow-sm">
              Device Records
            </h1>
            <p className="mt-2 text-sm text-slate-400">Manage and track customer device repair status.</p>
          </div>

          <Link
            href="/new"
            className="group relative inline-flex items-center justify-center rounded-xl bg-slate-800/80 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-slate-700 hover:shadow-blue-500/25 border border-slate-700 hover:border-blue-500/50 overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-linear-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-blue-400 text-lg leading-none">+</span> Add New Record
            </span>
          </Link>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by name, phone, or serial..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="flex-1 rounded-xl glass-input px-4 py-3 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-48 rounded-xl glass-input px-4 py-3 text-sm appearance-none bg-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="picked_up">Picked Up</option>
          </select>
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

          {!loading && !error && (
            <>
              <DeviceTable
                devices={devices}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              {devices.length > 0 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-white/5 px-4 py-5 text-sm text-slate-400 sm:flex-row">
                  <span>
                    Showing {devices.length} of {totalDevices} records
                  </span>
                  {hasMoreDevices && (
                    <button
                      type="button"
                      onClick={() => setPage((currentPage) => currentPage + 1)}
                      disabled={loadingMore}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-2.5 font-semibold text-slate-100 transition-all hover:border-blue-500/50 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingMore ? "Loading..." : "Load More"}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
