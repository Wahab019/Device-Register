"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "react-hot-toast";
import { createDevice, updateDevice } from "../lib/api";
import {
  EMAIL_NOTIFIABLE_STATUSES,
  STATUS_LABELS,
  getValidNextStatuses,
} from "../lib/status";
import type { DeviceFormData, DeviceRecord, DeviceStatus } from "../lib/types";

const ACCESSORIES = ["Charger", "SIM Card", "Case", "Box"] as const;
const CONDITIONS = ["Scratched", "Cracked Screen", "Water Damage"] as const;

const CHECKLIST_SEPARATOR = "\n\n---intake-checklist---\n";

function serializeChecklist(
  accessories: string[],
  conditions: string[],
  rawNotes: string,
): string {
  const parts: string[] = [];
  if (accessories.length > 0) {
    parts.push(`Accessories: ${accessories.join(", ")}`);
  }
  if (conditions.length > 0) {
    parts.push(`Condition: ${conditions.join(", ")}`);
  }
  const checklist = parts.join("\n");
  if (!checklist) return rawNotes.trim();
  return rawNotes.trim()
    ? `${rawNotes.trim()}${CHECKLIST_SEPARATOR}${checklist}`
    : `${CHECKLIST_SEPARATOR.trimStart()}${checklist}`;
}

function parseChecklist(notes: string | null | undefined): {
  rawNotes: string;
  accessories: string[];
  conditions: string[];
} {
  if (!notes) return { rawNotes: "", accessories: [], conditions: [] };
  const idx = notes.indexOf(CHECKLIST_SEPARATOR);
  if (idx === -1) return { rawNotes: notes, accessories: [], conditions: [] };

  const rawNotes = notes.slice(0, idx).trim();
  const block = notes.slice(idx + CHECKLIST_SEPARATOR.length);

  const accessories: string[] = [];
  const conditions: string[] = [];

  for (const line of block.split("\n")) {
    if (line.startsWith("Accessories:")) {
      const items = line.replace("Accessories:", "").trim().split(", ");
      accessories.push(...items.filter((i) => (ACCESSORIES as readonly string[]).includes(i)));
    } else if (line.startsWith("Condition:")) {
      const items = line.replace("Condition:", "").trim().split(", ");
      conditions.push(...items.filter((i) => (CONDITIONS as readonly string[]).includes(i)));
    }
  }

  return { rawNotes, accessories, conditions };
}

type DeviceFormProps = {
  initialData?: DeviceRecord;
  onSuccess?: () => void;
};

// Formats the two phone-number shapes accepted by the form while the user
// types. Non-digit characters are removed first so repeated edits cannot
// accumulate inconsistent spacing.
const formatPhoneNumber = (value: string) => {
  if (!value) return value;
  const isPlus = value.startsWith("+");
  const phoneNumber = value.replace(/[^\d]/g, "");
  
  if (isPlus) {
    if (phoneNumber.length <= 3) return `+${phoneNumber}`;
    if (phoneNumber.length <= 6) return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3)}`;
    if (phoneNumber.length <= 9) return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;
    return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6, 9)} ${phoneNumber.slice(9, 13)}`;
  } else {
    if (phoneNumber.length <= 4) return phoneNumber;
    if (phoneNumber.length <= 7) return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4)}`;
    return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7, 11)}`;
  }
};

// Builds the initial values used when creating a device form, including a
// default pending status and the current date as the date received.
const getDefaultFormData = (): DeviceFormData => ({
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  device_type: "",
  device_brand: "",
  device_model: "",
  serial_number: "",
  issue_description: "",
  status: "pending",
  date_received: new Date().toISOString().slice(0, 10),
  notes: "",
});

const getInitialFormData = (initialData?: DeviceRecord): DeviceFormData => {
  if (!initialData) {
    return getDefaultFormData();
  }

  return {
    customer_name: initialData.customer_name,
    customer_phone: initialData.customer_phone,
    customer_email: initialData.customer_email ?? "",
    device_type: initialData.device_type,
    device_brand: initialData.device_brand ?? "",
    device_model: initialData.device_model ?? "",
    serial_number: initialData.serial_number ?? "",
    issue_description: initialData.issue_description,
    status: initialData.status,
    date_received: initialData.date_received,
    notes: parseChecklist(initialData.notes).rawNotes,
  };
};

// Renders the device creation or editing form and coordinates its local state,
// API submission, success navigation, and display of submission errors.
export default function DeviceForm({ initialData, onSuccess }: DeviceFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<DeviceFormData>(() => getInitialFormData(initialData));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<DeviceFormData | null>(null);

  // Parse checklist from initial notes if editing an existing record
  const parsedInitial = parseChecklist(initialData?.notes);
  const [checkedAccessories, setCheckedAccessories] = useState<string[]>(parsedInitial.accessories);
  const [checkedConditions, setCheckedConditions] = useState<string[]>(parsedInitial.conditions);

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const customerEmail = (formData.customer_email || initialData?.customer_email || "").trim();
  const hasEmail = Boolean(customerEmail);

  const currentStatus: DeviceStatus = initialData?.status ?? "pending";
  const validNextStatuses = initialData ? getValidNextStatuses(currentStatus) : [];
  const isTerminal = Boolean(initialData && validNextStatuses.length === 0);

  // Updates one field in the form while preserving all other field values.
  const updateField = (
    field: keyof DeviceFormData,
    value: string | DeviceStatus,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value } as DeviceFormData));
  };

  const executeSave = async (payload: DeviceFormData) => {
    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateDevice(initialData.id, payload);
        toast.success("Device updated successfully!");
        if (onSuccess) {
          onSuccess();
          return;
        }
        router.push("/");
      } else {
        const created = await createDevice(payload);
        toast.success(`Device registered! Ticket Code: ${created.ticket_code}`, { duration: 5000 });
        if (onSuccess) {
          onSuccess();
          return;
        }
        router.push(`/${created.id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setShowEmailConfirm(false);
      setPendingPayload(null);
    }
  };

  // Validates the submit event, prepares optional values, saves the device,
  // and then either calls the success callback or navigates back to the list.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = formData.customer_email?.trim() || (initialData?.customer_email ? initialData.customer_email.trim() : null);

    // Serialize checklist into notes before submitting
    const serializedNotes = serializeChecklist(
      checkedAccessories,
      checkedConditions,
      formData.notes?.trim() ?? "",
    );

    const payload: DeviceFormData = {
      ...formData,
      customer_email: normalizedEmail,
      device_brand: formData.device_brand?.trim() ? formData.device_brand : null,
      device_model: formData.device_model?.trim() ? formData.device_model : null,
      serial_number: formData.serial_number?.trim() ? formData.serial_number : null,
      notes: serializedNotes || null,
      status: formData.status ?? "pending",
      date_received: formData.date_received || new Date().toISOString().slice(0, 10),
      notify_customer: hasEmail ? notifyCustomer : false,
    };

    if (initialData) {
      const statusChanged = payload.status !== initialData.status;
      const willEmail =
        hasEmail &&
        notifyCustomer &&
        statusChanged &&
        EMAIL_NOTIFIABLE_STATUSES.includes(payload.status as DeviceStatus);

      if (willEmail) {
        setPendingPayload(payload);
        setShowEmailConfirm(true);
        return;
      }
    }

    await executeSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-1">
          <label htmlFor="customer_name" className="block text-sm font-medium text-slate-300">
            Customer Name
          </label>
          <input
            id="customer_name"
            type="text"
            value={formData.customer_name}
            onChange={(event) => updateField("customer_name", event.target.value)}
            required
            className="w-full rounded-xl glass-input px-4 py-3 text-sm"
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label htmlFor="customer_phone" className="block text-sm font-medium text-slate-300">
            Customer Phone
          </label>
          <input
            id="customer_phone"
            type="text"
            value={formData.customer_phone}
            onChange={(event) => {
              // Format only this field at the boundary so the rest of the form
              // state remains ordinary strings and the API gets readable data.
              const formatted = formatPhoneNumber(event.target.value);
              updateField("customer_phone", formatted);
            }}
            required
            pattern="^(\+234\s\d{3}\s\d{3}\s\d{4}|0\d{3}\s\d{3}\s\d{4})$"
            title="Phone number must be a valid Nigerian format (e.g. 0803 123 4567 or +234 803 123 4567)"
            className="w-full rounded-xl glass-input px-4 py-3 text-sm"
            placeholder="0803 123 4567"
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <label htmlFor="customer_email" className="block text-sm font-medium text-slate-300">
              Customer Email
            </label>
            <span className="text-xs text-blue-400/80">Optional — sends tracking link</span>
          </div>
          <input
            id="customer_email"
            type="email"
            value={formData.customer_email ?? ""}
            onChange={(event) => updateField("customer_email", event.target.value)}
            className="w-full rounded-xl glass-input px-4 py-3 text-sm"
            placeholder="john@example.com"
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label htmlFor="device_type" className="block text-sm font-medium text-slate-300">
            Device Type
          </label>
          <input
            id="device_type"
            type="text"
            value={formData.device_type}
            onChange={(event) => updateField("device_type", event.target.value)}
            required
            className="w-full rounded-xl glass-input px-4 py-3 text-sm"
            placeholder="Laptop, Phone, etc."
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label htmlFor="device_brand" className="block text-sm font-medium text-slate-300">
            Device Brand
          </label>
          <input
            id="device_brand"
            type="text"
            value={formData.device_brand ?? ""}
            onChange={(event) => updateField("device_brand", event.target.value)}
            className="w-full rounded-xl glass-input px-4 py-3 text-sm"
            placeholder="Apple, Samsung, etc."
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label htmlFor="device_model" className="block text-sm font-medium text-slate-300">
            Device Model
          </label>
          <input
            id="device_model"
            type="text"
            value={formData.device_model ?? ""}
            onChange={(event) => updateField("device_model", event.target.value)}
            className="w-full rounded-xl glass-input px-4 py-3 text-sm"
            placeholder="MacBook Pro 14, Galaxy S23..."
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label htmlFor="serial_number" className="block text-sm font-medium text-slate-300">
            Serial Number
          </label>
          <input
            id="serial_number"
            type="text"
            value={formData.serial_number ?? ""}
            onChange={(event) => updateField("serial_number", event.target.value)}
            className="w-full rounded-xl glass-input px-4 py-3 text-sm"
            placeholder="SN-123456789"
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label htmlFor="date_received" className="block text-sm font-medium text-slate-300">
            Date Received
          </label>
          <input
            id="date_received"
            type="date"
            value={formData.date_received}
            onChange={(event) => updateField("date_received", event.target.value)}
            className="w-full rounded-xl glass-input px-4 py-3 text-sm"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* Status and notification controls are available when editing existing records */}
        {initialData && (
          <>
            <div className="space-y-2 md:col-span-1">
              <label htmlFor="status" className="block text-sm font-medium text-slate-300">
                Status
              </label>
              <select
                id="status"
                value={formData.status ?? initialData.status}
                disabled={isTerminal}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value as DeviceStatus,
                  )
                }
                className="w-full rounded-xl glass-input px-4 py-3 text-sm appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value={initialData.status} className="bg-slate-800">
                  {STATUS_LABELS[initialData.status]} (Current)
                </option>
                {validNextStatuses.map((nextStatus) => (
                  <option key={nextStatus} value={nextStatus} className="bg-slate-800">
                    {STATUS_LABELS[nextStatus]}
                  </option>
                ))}
              </select>
              {isTerminal && (
                <p className="text-xs text-slate-400 mt-1">
                  This repair is in a final state ({STATUS_LABELS[initialData.status]}) and cannot be transitioned further.
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-1 flex flex-col justify-end">
              <div className="flex items-center gap-3 py-3 px-1">
                <input
                  type="checkbox"
                  id="notify_customer"
                  checked={hasEmail && notifyCustomer}
                  disabled={!hasEmail || isSubmitting}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                />
                <label
                  htmlFor="notify_customer"
                  className={`text-sm select-none ${hasEmail ? "text-slate-300 cursor-pointer" : "text-slate-500"}`}
                >
                  Notify customer by email
                  {!hasEmail && (
                    <span className="ml-2 inline-flex items-center rounded bg-slate-800 px-2 py-0.5 text-xs text-amber-400 border border-amber-500/20">
                      No email on file
                    </span>
                  )}
                </label>
              </div>
            </div>
          </>
        )}

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="issue_description" className="block text-sm font-medium text-slate-300">
            Issue Description
          </label>
          <textarea
            id="issue_description"
            value={formData.issue_description}
            onChange={(event) => updateField("issue_description", event.target.value)}
            required
            rows={4}
            className="w-full rounded-xl glass-input px-4 py-3 text-sm resize-none"
            placeholder="Describe the issue reported by the customer..."
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-slate-300">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes ?? ""}
            onChange={(event) => updateField("notes", event.target.value)}
            rows={3}
            className="w-full rounded-xl glass-input px-4 py-3 text-sm resize-none"
            placeholder="Any additional notes or internal details..."
          />
        </div>

        {/* Intake Checklist */}
        <div className="md:col-span-2 space-y-4 rounded-xl border border-white/5 bg-slate-800/30 p-5">
          <div className="flex items-center gap-2 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-sm font-semibold text-slate-200">Intake Checklist</span>
            <span className="ml-auto text-xs text-slate-500">Protects against customer disputes</span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Accessories Left Behind</p>
            <div className="flex flex-wrap gap-2">
              {ACCESSORIES.map((item) => {
                const checked = checkedAccessories.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleItem(checkedAccessories, setCheckedAccessories, item)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      checked
                        ? "border-blue-500/60 bg-blue-500/15 text-blue-300 shadow-sm"
                        : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-sm border flex items-center justify-center shrink-0 ${
                      checked ? "border-blue-400 bg-blue-500" : "border-slate-600"
                    }`}>
                      {checked && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Physical Condition</p>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((item) => {
                const checked = checkedConditions.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleItem(checkedConditions, setCheckedConditions, item)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      checked
                        ? "border-amber-500/60 bg-amber-500/15 text-amber-300 shadow-sm"
                        : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-sm border flex items-center justify-center shrink-0 ${
                      checked ? "border-amber-400 bg-amber-500" : "border-slate-600"
                    }`}>
                      {checked && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden w-full sm:w-auto"
        >
          <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Saving...
            </span>
          ) : (
            <span className="relative z-10">{initialData ? "Update Device" : "Create Device"}</span>
          )}
        </button>
      </div>

      {/* Confirmation step before sending customer notification email */}
      {showEmailConfirm && pendingPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="glass-panel max-w-md w-full p-6 space-y-4 border border-blue-500/30 shadow-2xl relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100">Send Status Notification</h3>
                <p className="text-xs text-slate-400">Customer email confirmation</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              This will email <strong className="text-blue-400 font-mono">{pendingPayload.customer_email}</strong>.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowEmailConfirm(false);
                  setPendingPayload(null);
                }}
                disabled={isSubmitting}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeSave(pendingPayload)}
                disabled={isSubmitting}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-500 transition flex items-center gap-2"
              >
                {isSubmitting ? "Updating..." : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
