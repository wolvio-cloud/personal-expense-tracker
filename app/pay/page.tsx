"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatINR } from "@/lib/format";
import { ALERT_META, AlertType } from "@/lib/obligations";

const MODES = [
  { id: "UPI",          label: "UPI",          icon: "📱" },
  { id: "Bank Transfer",label: "Bank",         icon: "🏦" },
  { id: "Cash",         label: "Cash",         icon: "💵" },
  { id: "Card",         label: "Card",         icon: "💳" },
  { id: "Cheque",       label: "Cheque",       icon: "📝" },
  { id: "Auto-Debit",   label: "Auto-Debit",   icon: "🔄" },
  { id: "Other",        label: "Other",        icon: "•••" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function AddPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("obligationId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [obligations, setObligations] = useState<any[]>([]);
  const [obligationId, setObligationId] = useState(preselectedId || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [mode, setMode] = useState("UPI");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [loadingObl, setLoadingObl] = useState(true);

  useEffect(() => {
    fetch("/api/obligations")
      .then((r) => r.json())
      .then((data) => setObligations(data.filter((o: { status: string }) => o.status !== "Cleared")))
      .finally(() => setLoadingObl(false));
  }, []);

  const selected = obligations.find((o) => String(o.id) === String(obligationId));

  const fillRemaining = useCallback(() => {
    if (selected) setAmount(String(Math.max(0, Math.round(selected.remaining))));
  }, [selected]);

  useEffect(() => {
    if (selected && !amount) fillRemaining();
  }, [selected, amount, fillRemaining]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!obligationId || isNaN(parsed) || parsed <= 0 || !mode) return;
    setSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ obligationId, paymentDate: date, amountPaid: parsed, mode, notes }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Payment saved!", true);
      setTimeout(() => { router.push("/"); router.refresh(); }, 1200);
    } catch {
      showToast("Failed to save. Try again.", false);
    } finally {
      setSaving(false);
    }
  }

  const alertMeta = selected ? ALERT_META[selected.alert as AlertType] : null;

  return (
    <div className="max-w-2xl mx-auto pb-nav">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: toast.ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${toast.ok ? "#22c55e" : "#ef4444"}`,
            backdropFilter: "blur(12px)",
          }}>
          <span className="text-xl">{toast.ok ? "✅" : "❌"}</span>
          <span className="text-sm font-semibold text-white">{toast.msg}</span>
        </div>
      )}

      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-white">Record Payment</h1>
        <p className="text-sm mt-0.5" style={{ color: "#7fa8c9" }}>Log a payment against an obligation</p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 space-y-4">
        {/* Obligation picker */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7fa8c9" }}>
            Select Obligation *
          </label>
          {loadingObl ? (
            <div className="skeleton h-14 w-full rounded-2xl" />
          ) : (
            <div className="relative">
              <select
                required
                value={obligationId}
                onChange={(e) => { setObligationId(e.target.value); setAmount(""); }}
                className="w-full appearance-none px-4 py-3.5 rounded-2xl text-sm outline-none pr-8"
                style={{ background: "#122438", color: "#e8f3ff", border: "1px solid rgba(59,130,246,0.15)" }}
              >
                <option value="">Choose obligation...</option>
                {obligations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.refId} — {o.item} ({formatINR(o.remaining)} left)
                  </option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" fill="none" stroke="#4a6d8a" strokeWidth={2}
                className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}

          {/* Selected obligation summary */}
          {selected && (
            <div className="mt-2.5 rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: "#0f1e30", border: "1px solid rgba(59,130,246,0.1)" }}>
              <div>
                <div className="text-xs mb-0.5" style={{ color: "#4a6d8a" }}>Remaining to pay</div>
                <div className="text-base font-bold num" style={{ color: "#f59e0b" }}>{formatINR(selected.remaining)}</div>
              </div>
              {alertMeta && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: alertMeta.bg, color: alertMeta.color }}>{selected.alert}</span>
              )}
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7fa8c9" }}>Amount *</label>
            {selected && (
              <button type="button" onClick={fillRemaining}
                className="text-xs font-semibold px-3 py-1 rounded-lg"
                style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa" }}>
                Pay full amount
              </button>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold"
              style={{ color: "#4a6d8a" }}>₹</span>
            <input
              required
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-10 pr-4 py-4 rounded-2xl text-2xl font-bold num outline-none"
              style={{ background: "#122438", color: "#e8f3ff", border: "1px solid rgba(59,130,246,0.15)" }}
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7fa8c9" }}>
            Payment Date *
          </label>
          <input
            required type="date" value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none"
            style={{ background: "#122438", color: "#e8f3ff", border: "1px solid rgba(59,130,246,0.15)" }}
          />
        </div>

        {/* Mode */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7fa8c9" }}>
            Payment Mode *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {MODES.map((m) => (
              <button key={m.id} type="button" onClick={() => setMode(m.id)}
                className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: mode === m.id ? "rgba(59,130,246,0.2)" : "#122438",
                  border: `1px solid ${mode === m.id ? "#3b82f6" : "rgba(59,130,246,0.1)"}`,
                  color: mode === m.id ? "#60a5fa" : "#7fa8c9",
                  boxShadow: mode === m.id ? "0 2px 12px rgba(59,130,246,0.2)" : "none",
                }}>
                <span className="text-base">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7fa8c9" }}>
            Notes (optional)
          </label>
          <input
            type="text" value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. partial, ref #12345..."
            className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none"
            style={{ background: "#122438", color: "#e8f3ff", border: "1px solid rgba(59,130,246,0.15)" }}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || !obligationId || !amount}
          className="w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            color: "#fff",
            boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
          }}>
          {saving ? <><span className="spinner" /> Saving...</> : "Save Payment"}
        </button>
      </form>
    </div>
  );
}

export default function AddPaymentPage() {
  return (
    <Suspense fallback={
      <div className="p-4 space-y-3 max-w-2xl mx-auto">
        {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-14 rounded-2xl" />)}
      </div>
    }>
      <AddPaymentForm />
    </Suspense>
  );
}
