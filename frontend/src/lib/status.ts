import type { DeviceStatus } from "./types";

export const STATUS_LABELS: Record<DeviceStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  awaiting_approval: "Awaiting Approval",
  ready_for_pickup: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_MESSAGES: Record<DeviceStatus, string> = {
  pending: "We've received your device and will start soon.",
  in_progress: "We're working on your device.",
  awaiting_approval: "We need your approval before continuing. Please contact us.",
  ready_for_pickup: "Your device is ready. Bring your ticket ID to collect it.",
  completed: "Your device has been handed back. Thank you.",
  cancelled: "This repair has been closed. Please contact us for details.",
};

export const STATUS_TRANSITIONS: Record<DeviceStatus, DeviceStatus[]> = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["awaiting_approval", "ready_for_pickup", "cancelled"],
  awaiting_approval: ["in_progress", "cancelled"],
  ready_for_pickup: ["completed", "in_progress", "cancelled"],
  completed: [],
  cancelled: [],
};

export const EMAIL_NOTIFIABLE_STATUSES: DeviceStatus[] = [
  "pending",
  "awaiting_approval",
  "ready_for_pickup",
  "completed",
  "cancelled",
];

export const STATUS_STYLES: Record<
  DeviceStatus,
  { label: string; badgeClasses: string; dotClasses: string; textClass: string }
> = {
  pending: {
    label: "Pending",
    badgeClasses: "bg-slate-800/80 border-slate-700 text-slate-300 shadow-slate-900/50",
    dotClasses: "bg-slate-400 ring-slate-500/20",
    textClass: "text-slate-300",
  },
  in_progress: {
    label: "In Progress",
    badgeClasses: "bg-amber-900/20 border-amber-700/50 text-amber-400 shadow-amber-900/20",
    dotClasses: "bg-amber-400 ring-amber-500/20",
    textClass: "text-amber-400",
  },
  awaiting_approval: {
    label: "Awaiting Approval",
    badgeClasses: "bg-purple-900/20 border-purple-700/50 text-purple-400 shadow-purple-900/20",
    dotClasses: "bg-purple-400 ring-purple-500/20",
    textClass: "text-purple-400",
  },
  ready_for_pickup: {
    label: "Ready for Pickup",
    badgeClasses: "bg-emerald-900/20 border-emerald-700/50 text-emerald-400 shadow-emerald-900/20",
    dotClasses: "bg-emerald-400 ring-emerald-500/20",
    textClass: "text-emerald-400",
  },
  completed: {
    label: "Completed",
    badgeClasses: "bg-blue-900/20 border-blue-700/50 text-blue-400 shadow-blue-900/20",
    dotClasses: "bg-blue-400 ring-blue-500/20",
    textClass: "text-blue-400",
  },
  cancelled: {
    label: "Cancelled",
    badgeClasses: "bg-rose-900/20 border-rose-700/50 text-rose-400 shadow-rose-900/20",
    dotClasses: "bg-rose-400 ring-rose-500/20",
    textClass: "text-rose-400",
  },
};

export function getStatusLabel(status: string): string {
  if (status in STATUS_LABELS) {
    return STATUS_LABELS[status as DeviceStatus];
  }
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getStatusMessage(status: string): string {
  if (status in STATUS_MESSAGES) {
    return STATUS_MESSAGES[status as DeviceStatus];
  }
  return "The status of your repair has been updated.";
}

export function getValidNextStatuses(currentStatus: DeviceStatus): DeviceStatus[] {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

export function getStatusStyle(status: string) {
  if (status in STATUS_STYLES) {
    return STATUS_STYLES[status as DeviceStatus];
  }
  return {
    label: getStatusLabel(status),
    badgeClasses: "bg-slate-800 text-slate-300 border-slate-700",
    dotClasses: "bg-slate-400 ring-slate-500/20",
    textClass: "text-slate-300",
  };
}
