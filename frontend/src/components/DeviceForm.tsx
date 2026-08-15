"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { createDevice, updateDevice } from "../lib/api";
import type { DeviceFormData, DeviceRecord } from "../lib/types";

type DeviceFormProps = {
  initialData?: DeviceRecord;
  onSuccess?: () => void;
};

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

  const updateField = (
    field: keyof DeviceFormData,
    value: string | "pending" | "in_progress" | "completed" | "picked_up",
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value } as DeviceFormData));
  };

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
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-1">
          <label htmlFor="customer_name" className="block text-sm font-medium text-slate-700">
            Customer Name
          </label>
          <input
            id="customer_name"
            type="text"
            value={formData.customer_name}
            onChange={(event) => updateField("customer_name", event.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label htmlFor="customer_phone" className="block text-sm font-medium text-slate-700">
            Customer Phone
          </label>
          <input
            id="customer_phone"
            type="text"
            value={formData.customer_phone}
            onChange={(event) => updateField("customer_phone", event.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label htmlFor="customer_email" className="block text-sm font-medium text-slate-700">
            Customer Email
          </label>
          <input
            id="customer_email"
            type="email"
            value={formData.customer_email ?? ""}
            onChange={(event) => updateField("customer_email", event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label htmlFor="device_type" className="block text-sm font-medium text-slate-700">
            Device Type
          </label>
          <input
            id="device_type"
            type="text"
            value={formData.device_type}
            onChange={(event) => updateField("device_type", event.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label htmlFor="device_brand" className="block text-sm font-medium text-slate-700">
            Device Brand
          </label>
          <input
            id="device_brand"
            type="text"
            value={formData.device_brand ?? ""}
            onChange={(event) => updateField("device_brand", event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label htmlFor="device_model" className="block text-sm font-medium text-slate-700">
            Device Model
          </label>
          <input
            id="device_model"
            type="text"
            value={formData.device_model ?? ""}
            onChange={(event) => updateField("device_model", event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label htmlFor="serial_number" className="block text-sm font-medium text-slate-700">
            Serial Number
          </label>
          <input
            id="serial_number"
            type="text"
            value={formData.serial_number ?? ""}
            onChange={(event) => updateField("serial_number", event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label htmlFor="date_received" className="block text-sm font-medium text-slate-700">
            Date Received
          </label>
          <input
            id="date_received"
            type="date"
            value={formData.date_received}
            onChange={(event) => updateField("date_received", event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {initialData && (
          <div className="space-y-2 md:col-span-1">
            <label htmlFor="status" className="block text-sm font-medium text-slate-700">
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
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="picked_up">Picked Up</option>
            </select>
          </div>
        )}

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="issue_description" className="block text-sm font-medium text-slate-700">
            Issue Description
          </label>
          <textarea
            id="issue_description"
            value={formData.issue_description}
            onChange={(event) => updateField("issue_description", event.target.value)}
            required
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes ?? ""}
            onChange={(event) => updateField("notes", event.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : initialData ? "Update Device" : "Create Device"}
        </button>
      </div>
    </form>
  );
}
