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
    badgeClasses: "bg-[#664930]/35 border-[#997E67]/40 text-[#CCBEB1] shadow-[#664930]/20",
    dotClasses: "bg-[#CCBEB1] ring-[#CCBEB1]/20",
    textClass: "text-[#CCBEB1]",
  },
  in_progress: {
    label: "In Progress",
    badgeClasses: "bg-[#FFDBBB]/15 border-[#FFDBBB]/40 text-[#FFDBBB] shadow-[#FFDBBB]/10",
    dotClasses: "bg-[#FFDBBB] ring-[#FFDBBB]/30",
    textClass: "text-[#FFDBBB]",
  },
  awaiting_approval: {
    label: "Awaiting Approval",
    badgeClasses: "bg-[#997E67]/30 border-[#997E67]/50 text-[#FFDBBB] shadow-[#997E67]/20",
    dotClasses: "bg-[#997E67] ring-[#997E67]/30",
    textClass: "text-[#FFDBBB]",
  },
  ready_for_pickup: {
    label: "Ready for Pickup",
    badgeClasses: "bg-emerald-950/40 border-emerald-700/50 text-emerald-300 shadow-emerald-950/20",
    dotClasses: "bg-emerald-400 ring-emerald-500/20",
    textClass: "text-emerald-300",
  },
  completed: {
    label: "Completed",
    badgeClasses: "bg-[#CCBEB1]/15 border-[#CCBEB1]/30 text-[#CCBEB1] shadow-[#CCBEB1]/10",
    dotClasses: "bg-[#CCBEB1] ring-[#CCBEB1]/20",
    textClass: "text-[#CCBEB1]",
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
    badgeClasses: "bg-[#664930]/35 text-[#CCBEB1] border-[#997E67]/40",
    dotClasses: "bg-[#CCBEB1] ring-[#CCBEB1]/20",
    textClass: "text-[#CCBEB1]",
  };
}
