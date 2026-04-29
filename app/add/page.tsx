"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = ["Credit Card", "Payment Pending", "Planned Expense", "Pending Credit"];
const TYPE_PREFIXES: Record<string, string> = {
  "Credit Card": "CC",
  "Payment Pending": "PP",
  "Planned Expense": "PE",
  "Pending Credit": "PC",
};

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

  const refId = `${TYPE_PREFIXES[type]}-${refSuffix || "XXX"}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!refSuffix.trim()) { setError("Enter a ref ID suffix (e.g. 001)"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/obligations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refId: `${TYPE_PREFIXES[type]}-${refSuffix.trim()}`,
          month: currentMonthKey(),
          type,
          item,
          originalAmount: amount,
          dueDate: dueDate || null,
          direction,
          notes,
          isRecurring,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      router.push("/obligations");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create. Check ref ID is unique.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-white mb-6">Add Due / Receivable</h1>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: "#C0392B20", color: "#C0392B" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div>
          <label className="block text-sm text-blue-300 mb-2 font-medium">Type *</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className="py-3 rounded-xl text-sm font-medium min-h-[44px] text-left px-3"
                style={{
                  backgroundColor: type === t ? "#243b52" : "#1a2f45",
                  color: type === t ? "#e8f0fe" : "#90afc5",
                  border: `1px solid ${type === t ? "#5B9BD5" : "transparent"}`,
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Ref ID */}
        <div>
          <label className="block text-sm text-blue-300 mb-1 font-medium">Ref ID *</label>
          <div className="flex gap-2 items-center">
            <span className="px-3 py-3 rounded-xl text-sm font-mono font-bold min-h-[44px] flex items-center"
              style={{ backgroundColor: "#243b52", color: "#5B9BD5" }}>
              {TYPE_PREFIXES[type]}-
            </span>
            <input
              type="text"
              required
              value={refSuffix}
              onChange={(e) => setRefSuffix(e.target.value.toUpperCase())}
              placeholder="001"
              maxLength={10}
              className="flex-1 rounded-xl px-4 py-3 text-sm min-h-[44px] outline-none font-mono"
              style={{ backgroundColor: "#1a2f45", color: "#e8f0fe", border: "1px solid #243b52" }}
            />
          </div>
          <div className="text-xs text-blue-400 mt-1">Preview: <span className="font-mono text-white">{refId}</span></div>
        </div>

        {/* Item */}
        <div>
          <label className="block text-sm text-blue-300 mb-1 font-medium">Description *</label>
          <input
            required
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="e.g. HDFC Credit Card Bill"
            className="w-full rounded-xl px-4 py-3 text-sm min-h-[44px] outline-none"
            style={{ backgroundColor: "#1a2f45", color: "#e8f0fe", border: "1px solid #243b52" }}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm text-blue-300 mb-1 font-medium">Amount (₹) *</label>
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

        {/* Direction */}
        <div>
          <label className="block text-sm text-blue-300 mb-2 font-medium">Direction *</label>
          <div className="flex gap-2">
            {["Outflow", "Inflow"].map((d) => (
              <button key={d} type="button" onClick={() => setDirection(d)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold min-h-[44px]"
                style={{
                  backgroundColor: direction === d ? (d === "Outflow" ? "#C0392B" : "#27AE60") : "#1a2f45",
                  color: direction === d ? "#fff" : "#90afc5",
                }}>
                {d === "Outflow" ? "↑ Outflow" : "↓ Inflow"}
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm text-blue-300 mb-1 font-medium">Due Date (optional)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm min-h-[44px] outline-none"
            style={{ backgroundColor: "#1a2f45", color: "#e8f0fe", border: "1px solid #243b52" }}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm text-blue-300 mb-1 font-medium">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional details..."
            className="w-full rounded-xl px-4 py-3 text-sm min-h-[44px] outline-none"
            style={{ backgroundColor: "#1a2f45", color: "#e8f0fe", border: "1px solid #243b52" }}
          />
        </div>

        {/* Recurring */}
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "#1a2f45" }}>
          <span className="text-sm text-white">Recurring monthly</span>
          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            className="relative w-12 h-6 rounded-full transition-colors"
            style={{ backgroundColor: isRecurring ? "#5B9BD5" : "#243b52" }}
          >
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
              style={{ transform: isRecurring ? "translateX(24px)" : "translateX(0)" }} />
          </button>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 rounded-xl text-base font-bold min-h-[52px] transition-opacity disabled:opacity-60"
          style={{ backgroundColor: "#5B9BD5", color: "#fff" }}
        >
          {saving ? "Saving..." : "Add Obligation"}
        </button>
      </form>
    </div>
  );
}
