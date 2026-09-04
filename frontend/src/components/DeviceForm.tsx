"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { createDevice, updateDevice } from "../lib/api";
import type { DeviceFormData, DeviceRecord } from "../lib/types";

type DeviceFormProps = {
  initialData?: DeviceRecord;
  onSuccess?: () => void;
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

// Renders the device creation or editing form and coordinates its local state,
// API submission, success navigation, and display of submission errors.
export default function DeviceForm({ initialData, onSuccess }: DeviceFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<DeviceFormData>(getDefaultFormData());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData) {
      setFormData(getDefaultFormData());
      return;
    }

    setFormData({
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
      notes: initialData.notes ?? "",
    });
  }, [initialData]);

  // Updates one field in the form while preserving all other field values.
  const updateField = (
    field: keyof DeviceFormData,
    value: string | "pending" | "in_progress" | "completed" | "picked_up",
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value } as DeviceFormData));
  };

  // Validates the submit event, prepares optional values, saves the device,
  // and then either calls the success callback or navigates back to the list.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: DeviceFormData = {
        ...formData,
        customer_email: formData.customer_email?.trim() ? formData.customer_email : null,
        device_brand: formData.device_brand?.trim() ? formData.device_brand : null,
        device_model: formData.device_model?.trim() ? formData.device_model : null,
        serial_number: formData.serial_number?.trim() ? formData.serial_number : null,
        notes: formData.notes?.trim() ? formData.notes : null,
        status: formData.status ?? "pending",
        date_received: formData.date_received || new Date().toISOString().slice(0, 10),
      };

      if (initialData) {
        await updateDevice(initialData.id, payload);
      } else {
        await createDevice(payload);
      }

      if (onSuccess) {
        onSuccess();
        return;
      }

      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
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
            onChange={(event) => updateField("customer_phone", event.target.value)}
            required
            className="w-full rounded-xl glass-input px-4 py-3 text-sm"
            placeholder="(555) 123-4567"
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label htmlFor="customer_email" className="block text-sm font-medium text-slate-300">
            Customer Email
          </label>
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

        {initialData && (
          <div className="space-y-2 md:col-span-1">
            <label htmlFor="status" className="block text-sm font-medium text-slate-300">
              Status
            </label>
            <select
              id="status"
              value={formData.status ?? "pending"}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target.value as
                    | "pending"
                    | "in_progress"
                    | "completed"
                    | "picked_up",
                )
              }
              className="w-full rounded-xl glass-input px-4 py-3 text-sm appearance-none"
            >
              <option value="pending" className="bg-slate-800">Pending</option>
              <option value="in_progress" className="bg-slate-800">In Progress</option>
              <option value="completed" className="bg-slate-800">Completed</option>
              <option value="picked_up" className="bg-slate-800">Picked Up</option>
            </select>
          </div>
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
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 backdrop-blur-md flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

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
    </form>
  );
}
