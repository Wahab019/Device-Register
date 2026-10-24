"use client";

import { type ChangeEvent, type FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { addCharge, deleteCharge, getCharges } from "../lib/api";
import type { Charge } from "../lib/types";

type ChargesPanelProps = {
  deviceId: string;
  /** The current repair status. Charge management is only allowed when status is "in_progress". */
  status: string;
};

// Format Nigerian naira values in a readable way for the billing summary and table cells.
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
}

// Keep the amount input user-friendly by stripping invalid characters and inserting commas
// without affecting the numeric value sent to the backend.
function formatNumberWithCommas(value: string) {
  // Strip non-numeric/non-dot characters
  const cleanValue = value.replace(/[^0-9.]/g, "");
  if (!cleanValue) return "";

  // Split into integer and optional decimal parts
  const parts = cleanValue.split(".");
  const intPart = parts[0];
  const decPart = parts.length > 1 ? parts.slice(1).join("").slice(0, 2) : undefined;

  // Add comma thousand separators to integer part
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}

export default function ChargesPanel({ deviceId, status }: ChargesPanelProps) {
  // A repair can only be billed while it is actively in progress, otherwise the charge
  // management controls are intentionally locked to prevent inconsistent data.
  const canEdit = status === "in_progress";
  const [charges, setCharges] = useState<Charge[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Local form state for the charge description and monetary value entered by staff.
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  // Refresh the charge list whenever the device is changed or after a mutation.
  const fetchCharges = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCharges(deviceId);
      setCharges(data.items || []);
      setTotal(data.total || 0);
    } catch (_err) {
      // The backend may still be spinning up or the table might not be ready yet.
      // In that case, we show an empty state instead of crashing the panel.
      setCharges([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  // Validate the input before sending a new line item to the API.
  const handleAddCharge = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanDesc = description.trim();
    const numAmount = parseFloat(amount.replace(/,/g, ""));

    if (!cleanDesc) {
      toast.error("Please enter a charge description.");
      return;
    }

    if (isNaN(numAmount) || numAmount < 0) {
      toast.error("Please enter a valid positive amount.");
      return;
    }

    try {
      setIsSubmitting(true);
      await addCharge(deviceId, {
        description: cleanDesc,
        amount: numAmount,
      });
      toast.success("Charge added successfully!");
      setDescription("");
      setAmount("");
      await fetchCharges();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add charge.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove an item and immediately refresh the total so the totals remain in sync.
  const handleDeleteCharge = async (chargeId: string) => {
    try {
      setDeletingId(chargeId);
      await deleteCharge(deviceId, chargeId);
      toast.success("Charge deleted.");
      await fetchCharges();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete charge.";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="screen-only">
      {/* Header shows the current billing summary for internal staff only. */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-taupe/20 pb-2 mb-5">
        <div>
          <h2 className="text-xl font-semibold text-[#F5EBE1]">Billing & Charges</h2>
          <p className="text-xs text-neutral-sand/70 mt-0.5">
            Internal line items and computed repair total (hidden from public tracker).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs uppercase tracking-wider text-neutral-sand/70 font-semibold">Total:</span>
          <span className="font-mono text-xl font-bold text-neutral-peach">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Locked state banner — shown whenever the repair is not actively in progress */}
      {!canEdit && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-neutral-taupe/40 bg-neutral-espresso/20 px-4 py-3 text-sm text-neutral-sand">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0 text-neutral-peach" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>
            Charges can only be added or removed when the repair status is{" "}
            <strong className="text-neutral-peach">In Progress</strong>. Change the status first via{" "}
            <em>Edit Record</em>.
          </span>
        </div>
      )}

      {/* Charge table and empty/loading states for the device's billing history. */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-xl bg-neutral-espresso/15 border border-neutral-taupe/20 p-6 text-center text-neutral-sand/70 text-sm">
            <div className="w-6 h-6 border-2 border-neutral-taupe/30 border-t-neutral-peach rounded-full animate-spin mx-auto mb-2"></div>
            Loading charges...
          </div>
        ) : charges.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-taupe/30 bg-neutral-espresso/10 p-6 text-center text-neutral-sand/70 text-sm">
            No charges added for this device yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-neutral-espresso/15 border border-neutral-taupe/20">
            <table className="w-full text-left text-sm text-neutral-sand">
              <thead className="bg-neutral-espresso/25 text-xs uppercase tracking-wider text-neutral-sand/70 border-b border-neutral-taupe/20 font-semibold">
                <tr>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Date Added</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-taupe/20">
                {charges.map((charge) => (
                  <tr key={charge.id} className="hover:bg-neutral-espresso/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[#F5EBE1]">
                      {charge.description}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-neutral-sand/70 whitespace-nowrap">
                      {new Date(charge.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-[#F5EBE1] text-right whitespace-nowrap">
                      {formatCurrency(charge.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteCharge(charge.id)}
                        disabled={!canEdit || deletingId === charge.id}
                        className="inline-flex items-center justify-center text-xs text-red-400 hover:text-red-300 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={canEdit ? "Delete charge" : "Change status to In Progress to manage charges"}
                      >
                        {deletingId === charge.id ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-neutral-taupe/30 bg-neutral-espresso/25">
                <tr>
                  <td colSpan={2} className="px-5 py-3 text-xs uppercase tracking-wider font-semibold text-neutral-sand/80">
                    Computed Total
                  </td>
                  <td className="px-5 py-3 font-mono font-bold text-neutral-peach text-right">
                    {formatCurrency(total)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Add Charge Form — only rendered when the repair is actively in progress */}
        {canEdit && (
          <form
            onSubmit={handleAddCharge}
            className="rounded-xl bg-neutral-espresso/20 border border-neutral-taupe/20 p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
          >
            {/* Description is the human-readable reason for the charge, such as part replacement or diagnostic work. */}
            <div className="flex-1 space-y-1.5">
              <label htmlFor="charge_desc" className="block text-xs font-semibold uppercase tracking-wider text-neutral-sand/80">
                Description
              </label>
              <input
                id="charge_desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Replacement screen, Diagnostics..."
                className="w-full rounded-xl glass-input px-3.5 py-2.5 text-sm"
                required
              />
            </div>

            {/* Amount is displayed with thousand separators but submitted as a plain numeric value. */}
            <div className="w-full sm:w-40 space-y-1.5">
              <label htmlFor="charge_amount" className="block text-xs font-semibold uppercase tracking-wider text-neutral-sand/80">
                Amount (₦)
              </label>
              <input
                id="charge_amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(formatNumberWithCommas(e.target.value))}
                placeholder="0.00"
                className="w-full rounded-xl glass-input px-3.5 py-2.5 text-sm font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-neutral-peach px-5 py-2.5 text-sm font-semibold text-[#2D1B0E] shadow-sm transition-all hover:bg-[#ffe7d1] hover:shadow-[0_0_15px_rgba(255,219,187,0.3)] disabled:opacity-50 shrink-0"
            >
              {isSubmitting ? "Adding..." : "+ Add Charge"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
