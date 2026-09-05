import Link from "next/link";
import type { DeviceRecord } from "../lib/types";

type DeviceTableProps = {
  devices: DeviceRecord[];
};

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

// Combines the device type, brand, and model into a readable table label,
// omitting missing optional values and providing a fallback when necessary.
function formatDeviceName(device: DeviceRecord) {
  const parts = [device.device_type];

  if (device.device_brand) {
    parts.push(device.device_brand);
  }

  if (device.device_model) {
    parts.push(device.device_model);
  }

  return parts.join(" - ") || "Unknown device";
}

// Renders the device list as a responsive table, including an empty state,
// status labels, received dates, and links to each device's detail page.
export default function DeviceTable({ devices }: DeviceTableProps) {
  if (devices.length === 0) {
    return (
      <div className="flex min-h-75 items-center justify-center rounded-xl border border-dashed border-slate-700/50 bg-slate-800/20 px-4 py-8 text-center text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p>No device records yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-slate-900/40 backdrop-blur-sm">
      <table className="min-w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-800/50 text-slate-400 border-b border-white/5 uppercase tracking-wider text-xs font-semibold">
          <tr>
            <th className="px-6 py-4 rounded-tl-xl">Customer Name</th>
            <th className="px-6 py-4">Phone</th>
            <th className="px-6 py-4">Device</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Date Received</th>
            <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {/* Render one table row with the device details and its view link. */}
          {devices.map((device) => {
            const status = statusStyles[device.status];

            return (
              <tr key={device.id} className="transition-all duration-200 hover:bg-slate-800/60 group relative z-0">
                <td className="px-6 py-4 font-medium text-slate-200">
                  {device.customer_name}
                </td>
                <td className="px-6 py-4 text-slate-400">{device.customer_phone}</td>
                <td className="px-6 py-4 text-slate-300">{formatDeviceName(device)}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border shadow-sm ${
                      device.status === 'pending' ? 'bg-slate-800/80 border-slate-700 text-slate-300 shadow-slate-900/50' :
                      device.status === 'in_progress' ? 'bg-amber-900/20 border-amber-700/50 text-amber-400 shadow-amber-900/20' :
                      device.status === 'completed' ? 'bg-blue-900/20 border-blue-700/50 text-blue-400 shadow-blue-900/20' :
                      'bg-emerald-900/20 border-emerald-700/50 text-emerald-400 shadow-emerald-900/20'
                    }`}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                  {new Date(device.date_received).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/${device.id}`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-400 transition-all hover:bg-blue-600 hover:text-white hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] group-hover:bg-slate-700"
                    title="View Details"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
