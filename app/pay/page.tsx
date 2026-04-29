"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatINR } from "@/lib/format";

const MODES = ["UPI", "Bank Transfer", "Cash", "Card", "Cheque", "Auto-Debit", "Other"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ObligationOption({ o }: { o: any }) {
  return (
    <option value={o.id}>
      {o.refId} — {o.item} ({formatINR(o.remaining)} left)
    </option>
  );
}

function AddPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("obligationId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [obligations, setObligations] = useState<any[]>([]);
  const [obligationId, setObligationId] = useState(preselectedId || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [mode, setMode] = useState("UPI");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/obligations")
      .then((r) => r.json())
      .then((data) => {
        const pending = data.filter((o: { status: string }) => o.status !== "Cleared");
        setObligations(pending);
      });
  }, []);

  const selectedObligation = obligations.find((o) => String(o.id) === String(obligationId));

  const prefillRemaining = useCallback(() => {
    if (selectedObligation) {
      setAmount(String(Math.max(0, selectedObligation.remaining)));
    }
  }, [selectedObligation]);

  useEffect(() => {
    if (selectedObligation && !amount) {
      prefillRemaining();
    }
  }, [selectedObligation, amount, prefillRemaining]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!obligationId || !amount || !mode) return;
    setSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ obligationId, paymentDate: date, amountPaid: amount, mode, notes }),
      });
      if (!res.ok) throw new Error("Failed");
      setToast("Payment saved!");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1200);
    } catch {
      setToast("Failed to save payment. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-white mb-6">Record Payment</h1>

      {toast && (
        <div className="fixed top-20 left-4 right-4 z-50 text-center py-3 px-4 rounded-xl font-semibold"
          style={{ backgroundColor: toast.includes("Failed") ? "#C0392B" : "#27AE60", color: "#fff" }}>
          {toast}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Obligation */}
        <div>
          <label className="block text-sm text-blue-300 mb-1 font-medium">Obligation *</label>
          <select
            required
            value={obligationId}
            onChange={(e) => { setObligationId(e.target.value); setAmount(""); }}
            className="w-full rounded-xl px-4 py-3 text-sm min-h-[44px] outline-none"
            style={{ backgroundColor: "#1a2f45", color: "#e8f0fe", border: "1px solid #243b52" }}
          >
            <option value="">Select obligation...</option>
            {obligations.map((o) => <ObligationOption key={o.id} o={o} />)}
          </select>
          {selectedObligation && (
            <div className="mt-1 text-xs text-blue-300">
              Remaining: <span style={{ color: "#F39C12" }}>{formatINR(selectedObligation.remaining)}</span>
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-blue-300 font-medium">Amount (₹) *</label>
            {selectedObligation && (
              <button type="button" onClick={prefillRemaining}
                className="text-xs px-2 py-1 rounded" style={{ color: "#5B9BD5" }}>
                Use remaining
              </button>
            )}
          </div>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl px-4 py-3 text-sm min-h-[44px] outline-none"
            style={{ backgroundColor: "#1a2f45", color: "#e8f0fe", border: "1px solid #243b52" }}
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm text-blue-300 mb-1 font-medium">Payment Date *</label>
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm min-h-[44px] outline-none"
            style={{ backgroundColor: "#1a2f45", color: "#e8f0fe", border: "1px solid #243b52" }}
          />
        </div>

        {/* Mode */}
        <div>
          <label className="block text-sm text-blue-300 mb-1 font-medium">Payment Mode *</label>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className="py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-colors"
                style={{
                  backgroundColor: mode === m ? "#5B9BD5" : "#1a2f45",
                  color: mode === m ? "#fff" : "#90afc5",
                }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm text-blue-300 mb-1 font-medium">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. partial payment, ref #..."
            className="w-full rounded-xl px-4 py-3 text-sm min-h-[44px] outline-none"
            style={{ backgroundColor: "#1a2f45", color: "#e8f0fe", border: "1px solid #243b52" }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 rounded-xl text-base font-bold min-h-[52px] transition-opacity disabled:opacity-60"
          style={{ backgroundColor: "#5B9BD5", color: "#fff" }}
        >
          {saving ? "Saving..." : "Save Payment"}
        </button>
      </form>
    </div>
  );
}

export default function AddPaymentPage() {
  return (
    <Suspense fallback={<div className="p-4 text-blue-300">Loading...</div>}>
      <AddPaymentForm />
    </Suspense>
  );
}
