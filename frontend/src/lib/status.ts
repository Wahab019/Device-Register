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
  completed: "Your device has been handed back to you. Thank you for your patronage.",
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
  "in_progress",
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
    badgeClasses: "bg-neutral-espresso/35 border-neutral-taupe/40 text-neutral-sand shadow-neutral-espresso/20",
    dotClasses: "bg-neutral-sand ring-neutral-sand/20",
    textClass: "text-neutral-sand",
  },
  in_progress: {
    label: "In Progress",
    badgeClasses: "bg-neutral-peach/15 border-neutral-peach/40 text-neutral-peach shadow-neutral-peach/10",
    dotClasses: "bg-neutral-peach ring-neutral-peach/30",
    textClass: "text-neutral-peach",
  },
  awaiting_approval: {
    label: "Awaiting Approval",
    badgeClasses: "bg-neutral-taupe/30 border-neutral-taupe/50 text-neutral-peach shadow-neutral-taupe/20",
    dotClasses: "bg-neutral-taupe ring-neutral-taupe/30",
    textClass: "text-neutral-peach",
  },
  ready_for_pickup: {
    label: "Ready for Pickup",
    badgeClasses: "bg-emerald-950/40 border-emerald-700/50 text-emerald-300 shadow-emerald-950/20",
    dotClasses: "bg-emerald-400 ring-emerald-500/20",
    textClass: "text-emerald-300",
  },
  completed: {
    label: "Completed",
    badgeClasses: "bg-neutral-sand/15 border-neutral-sand/30 text-neutral-sand shadow-neutral-sand/10",
    dotClasses: "bg-neutral-sand ring-neutral-sand/20",
    textClass: "text-neutral-sand",
  },
  cancelled: {
    label: "Cancelled",
    badgeClasses: "bg-rose-950/40 border-rose-800/40 text-rose-300 shadow-rose-950/20",
    dotClasses: "bg-rose-400 ring-rose-500/20",
    textClass: "text-rose-300",
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
    badgeClasses: "bg-neutral-espresso/35 text-neutral-sand border-neutral-taupe/40",
    dotClasses: "bg-neutral-sand ring-neutral-sand/20",
    textClass: "text-neutral-sand",
  };
}
