"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = [
  { id: "Credit Card",    prefix: "CC", icon: "💳", desc: "Monthly CC bill" },
  { id: "Payment Pending",prefix: "PP", icon: "⏳", desc: "EMI or pending pay" },
  { id: "Planned Expense",prefix: "PE", icon: "📋", desc: "Utility or expense" },
  { id: "Pending Credit", prefix: "PC", icon: "💰", desc: "Money incoming" },
];

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export default function AddObligation() {
  const router = useRouter();
  const [type, setType] = useState("Planned Expense");
  const [refSuffix, setRefSuffix] = useState("");
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [direction, setDirection] = useState("Outflow");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedType = TYPES.find((t) => t.id === type)!;
  const refId = `${selectedType.prefix}-${refSuffix || "XXX"}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = refSuffix.trim();
    if (!trimmed) { setError("Enter a ref ID suffix (e.g. 020)"); return; }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) { setError("Enter a valid positive amount"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/obligations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refId: `${selectedType.prefix}-${trimmed}`,
          month: currentMonthKey(),
          type,
          item: item.trim(),
          originalAmount: parsed,
          dueDate: dueDate || null,
          direction,
          notes: notes.trim(),
          isRecurring,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push("/obligations");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create. Try a different Ref ID.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-nav">
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-white">Add Obligation</h1>
        <p className="text-sm mt-0.5" style={{ color: "#7fa8c9" }}>Add a due or receivable for this month</p>
      </div>

      {error && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-4 space-y-5">
        {/* Type */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7fa8c9" }}>Type *</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button key={t.id} type="button" onClick={() => { setType(t.id); setDirection(t.id === "Pending Credit" ? "Inflow" : "Outflow"); }}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                style={{
                  background: type === t.id ? "rgba(59,130,246,0.15)" : "#122438",
                  border: `1px solid ${type === t.id ? "#3b82f6" : "rgba(59,130,246,0.1)"}`,
                }}>
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <div className="text-xs font-bold" style={{ color: type === t.id ? "#60a5fa" : "#e8f3ff" }}>{t.id}</div>
                  <div className="text-xs" style={{ color: "#4a6d8a" }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Ref ID */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7fa8c9" }}>Ref ID *</label>
          <div className="flex gap-2 items-center">
            <div className="px-4 py-3.5 rounded-xl font-mono font-bold text-sm shrink-0"
              style={{ background: "#0f1e30", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>
              {selectedType.prefix}-
            </div>
            <input
              required type="text" value={refSuffix}
              onChange={(e) => setRefSuffix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="001" maxLength={8}
              className="flex-1 px-4 py-3.5 rounded-xl text-sm outline-none font-mono"
              style={{ background: "#122438", color: "#e8f3ff", border: "1px solid rgba(59,130,246,0.15)" }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: "#4a6d8a" }}>
            Preview: <span className="font-mono font-bold" style={{ color: "#60a5fa" }}>{refId}</span>
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7fa8c9" }}>Description *</label>
          <input
            required type="text" value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="e.g. HDFC Credit Card April Bill"
            className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
            style={{ background: "#122438", color: "#e8f3ff", border: "1px solid rgba(59,130,246,0.15)" }}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7fa8c9" }}>Amount (₹) *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold" style={{ color: "#4a6d8a" }}>₹</span>
            <input
              required type="number" min="1" step="1" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-10 pr-4 py-4 rounded-xl text-2xl font-bold num outline-none"
              style={{ background: "#122438", color: "#e8f3ff", border: "1px solid rgba(59,130,246,0.15)" }}
            />
          </div>
        </div>

        {/* Direction */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7fa8c9" }}>Direction *</label>
          <div className="flex gap-2">
            {["Outflow", "Inflow"].map((d) => (
              <button key={d} type="button" onClick={() => setDirection(d)}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: direction === d
                    ? (d === "Outflow" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)")
                    : "#122438",
                  border: `1px solid ${direction === d ? (d === "Outflow" ? "#ef4444" : "#22c55e") : "rgba(59,130,246,0.1)"}`,
                  color: direction === d ? (d === "Outflow" ? "#ef4444" : "#22c55e") : "#7fa8c9",
                }}>
                {d === "Outflow" ? "↑ Outflow" : "↓ Inflow"}
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7fa8c9" }}>Due Date (optional)</label>
          <input
            type="date" value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
            style={{ background: "#122438", color: "#e8f3ff", border: "1px solid rgba(59,130,246,0.15)" }}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#7fa8c9" }}>Notes (optional)</label>
          <input
            type="text" value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional context..."
            className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
            style={{ background: "#122438", color: "#e8f3ff", border: "1px solid rgba(59,130,246,0.15)" }}
          />
        </div>

        {/* Recurring toggle */}
        <div className="flex items-center justify-between px-4 py-4 rounded-xl"
          style={{ background: "#122438", border: "1px solid rgba(59,130,246,0.1)" }}>
          <div>
            <div className="text-sm font-semibold text-white">Recurring monthly</div>
            <div className="text-xs mt-0.5" style={{ color: "#4a6d8a" }}>Repeats every month</div>
          </div>
          <button type="button" onClick={() => setIsRecurring(!isRecurring)}
            className="relative w-12 h-6 rounded-full transition-all"
            style={{ background: isRecurring ? "#3b82f6" : "#1a3149" }}>
            <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
              style={{ left: isRecurring ? "calc(100% - 22px)" : "2px" }} />
          </button>
        </div>

        <button
          type="submit" disabled={saving}
          className="w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", color: "#fff", boxShadow: "0 4px 20px rgba(59,130,246,0.3)" }}>
          {saving ? <><span className="spinner" /> Saving...</> : "Add Obligation"}
        </button>
      </form>
    </div>
  );
}
