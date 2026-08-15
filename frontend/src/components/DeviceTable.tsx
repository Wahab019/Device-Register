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

export default function DeviceTable({ devices }: DeviceTableProps) {
  if (devices.length === 0) {
    return (
      <div className="flex min-h-30 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-slate-600">
        No device records yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Customer Name</th>
            <th className="px-4 py-3 font-semibold">Phone</th>
            <th className="px-4 py-3 font-semibold">Device</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Date Received</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {devices.map((device) => {
            const status = statusStyles[device.status];

            return (
              <tr key={device.id} className="transition hover:bg-slate-50 even:bg-slate-50/40">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {device.customer_name}
                </td>
                <td className="px-4 py-3">{device.customer_phone}</td>
                <td className="px-4 py-3">{formatDeviceName(device)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.classes}`}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {new Date(device.date_received).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/${device.id}`}
                    className="inline-flex items-center font-medium text-blue-600 transition hover:text-blue-800"
                  >
                    View
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
