"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { addCharge, deleteCharge, getCharges } from "../lib/api";
import type { Charge } from "../lib/types";

type ChargesPanelProps = {
  deviceId: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function ChargesPanel({ deviceId }: ChargesPanelProps) {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const fetchCharges = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCharges(deviceId);
      setCharges(data.items || []);
      setTotal(data.total || 0);
    } catch (_err) {
      // Gracefully handle if table or backend is pending
      setCharges([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  const handleAddCharge = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanDesc = description.trim();
    const numAmount = parseFloat(amount);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-2 mb-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-200">Billing & Charges</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal line items and computed repair total (hidden from public tracker).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total:</span>
          <span className="font-mono text-xl font-bold text-blue-400">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Charges List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-xl bg-slate-800/20 border border-white/5 p-6 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
            Loading charges...
          </div>
        ) : charges.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700/50 bg-slate-800/20 p-6 text-center text-slate-400 text-sm">
            No charges added for this device yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-slate-900/40 border border-white/5">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/40 text-xs uppercase tracking-wider text-slate-400 border-b border-white/5 font-semibold">
                <tr>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Date Added</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {charges.map((charge) => (
                  <tr key={charge.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-200">
                      {charge.description}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(charge.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-200 text-right whitespace-nowrap">
                      {formatCurrency(charge.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteCharge(charge.id)}
                        disabled={deletingId === charge.id}
                        className="inline-flex items-center justify-center text-xs text-red-400 hover:text-red-300 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 disabled:opacity-50"
                        title="Delete charge"
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
              <tfoot className="border-t border-white/10 bg-slate-800/30">
                <tr>
                  <td colSpan={2} className="px-5 py-3 text-xs uppercase tracking-wider font-semibold text-slate-400">
                    Computed Total
                  </td>
                  <td className="px-5 py-3 font-mono font-bold text-blue-400 text-right">
                    {formatCurrency(total)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Add Charge Form */}
        <form
          onSubmit={handleAddCharge}
          className="rounded-xl bg-slate-800/30 border border-white/5 p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
        >
          <div className="flex-1 space-y-1.5">
            <label htmlFor="charge_desc" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
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

          <div className="w-full sm:w-36 space-y-1.5">
            <label htmlFor="charge_amount" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Amount ($)
            </label>
            <input
              id="charge_amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl glass-input px-3.5 py-2.5 text-sm font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 disabled:opacity-50 shrink-0"
          >
            {isSubmitting ? "Adding..." : "+ Add Charge"}
          </button>
        </form>
      </div>
    </section>
  );
}
