"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR, formatDate } from "@/lib/format";

const TYPES = ["All", "Credit Card", "Payment Pending", "Planned Expense", "Pending Credit"];
const STATUSES = ["All", "Pending", "Partial", "Cleared"];
const DIRECTIONS = ["All", "Outflow", "Inflow"];

const STATUS_COLORS: Record<string, string> = {
  Cleared: "#27AE60", Partial: "#5B9BD5", Pending: "#90afc5",
};
const ALERT_COLORS: Record<string, string> = {
  Overdue: "#C0392B", Upcoming: "#F39C12", Open: "#5B9BD5", Planned: "#4a7fa5",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ObligationsList() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [obligations, setObligations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [direction, setDirection] = useState("All");

  useEffect(() => {
    const params = new URLSearchParams();
    if (type !== "All") params.set("type", type);
    if (status !== "All") params.set("status", status);
    if (direction !== "All") params.set("direction", direction);
    setLoading(true);
    fetch(`/api/obligations?${params}`)
      .then((r) => r.json())
      .then(setObligations)
      .finally(() => setLoading(false));
  }, [type, status, direction]);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Dues & Receivables</h1>
        <Link href="/add"
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium min-h-[44px]"
          style={{ backgroundColor: "#1a2f45", color: "#5B9BD5" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16" />
          </svg>
          Add
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium min-h-[36px] transition-colors"
              style={{
                backgroundColor: type === t ? "#5B9BD5" : "#1a2f45",
                color: type === t ? "#fff" : "#90afc5",
              }}>
              {t === "All" ? "All Types" : t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium min-h-[36px] transition-colors"
              style={{
                backgroundColor: status === s ? "#243b52" : "#1a2f45",
                color: status === s ? "#e8f0fe" : "#90afc5",
                border: `1px solid ${status === s ? "#5B9BD5" : "transparent"}`,
              }}>
              {s}
            </button>
          ))}
          <div className="flex-1" />
          {DIRECTIONS.slice(1).map((d) => (
            <button key={d} onClick={() => setDirection(direction === d ? "All" : d)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium min-h-[36px] transition-colors"
              style={{
                backgroundColor: direction === d ? "#243b52" : "#1a2f45",
                color: direction === d ? "#e8f0fe" : "#90afc5",
                border: `1px solid ${direction === d ? "#5B9BD5" : "transparent"}`,
              }}>
              {d === "Outflow" ? "↑ Out" : "↓ In"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-blue-300">Loading...</div>
      ) : obligations.length === 0 ? (
        <div className="text-center py-8 text-blue-400">No obligations match the filters.</div>
      ) : (
        <div className="space-y-2">
          {obligations.map((o) => (
            <Link key={o.id} href={`/obligations/${o.id}`}>
              <div className="rounded-xl p-4 flex items-start gap-3 active:opacity-80"
                style={{ backgroundColor: "#1a2f45" }}>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold" style={{ color: "#5B9BD5" }}>{o.refId}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                      style={{ backgroundColor: ALERT_COLORS[o.alert] || "#4a7fa5" }}>
                      {o.alert}
                    </span>
                    <span className="ml-auto text-xs" style={{ color: o.direction === "Inflow" ? "#27AE60" : "#C0392B" }}>
                      {o.direction === "Inflow" ? "↓ IN" : "↑ OUT"}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-white truncate">{o.item}</span>
                  <div className="flex items-center gap-3 mt-1">
                    <div>
                      <div className="text-xs text-blue-300">Total</div>
                      <div className="text-sm font-medium text-white">{formatINR(o.originalAmount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-300">Paid</div>
                      <div className="text-sm font-medium" style={{ color: "#27AE60" }}>{formatINR(o.paidSoFar)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-300">Remaining</div>
                      <div className="text-sm font-bold" style={{ color: o.remaining > 0 ? "#e8f0fe" : "#27AE60" }}>
                        {formatINR(o.remaining)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-blue-300">
                      {o.dueDate ? `Due ${formatDate(o.dueDate)}` : "No due date"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[o.status] + "30", color: STATUS_COLORS[o.status] }}>
                      {o.status}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
