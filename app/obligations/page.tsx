"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatINR, formatShortDate } from "@/lib/format";
import { ALERT_META, STATUS_META, AlertType, StatusType } from "@/lib/obligations";

const TYPES = ["All", "Credit Card", "Payment Pending", "Planned Expense", "Pending Credit"];
const STATUSES = ["All", "Pending", "Partial", "Cleared"];

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-4" style={{ background: "#122438", border: "1px solid rgba(59,130,246,0.08)" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-4 w-14" />
        <div className="ml-auto skeleton h-4 w-10" />
      </div>
      <div className="skeleton h-4 w-2/3 mb-3" />
      <div className="flex gap-4">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-3 w-16" />
      </div>
      <div className="skeleton h-1.5 w-full mt-3" />
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
      style={{
        background: active ? "#3b82f6" : "#122438",
        color: active ? "#fff" : "#7fa8c9",
        border: `1px solid ${active ? "#3b82f6" : "rgba(59,130,246,0.12)"}`,
        boxShadow: active ? "0 2px 12px rgba(59,130,246,0.3)" : "none",
      }}>
      {label}
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ObligationCard({ o }: { o: any }) {
  const alertMeta = ALERT_META[o.alert as AlertType] ?? ALERT_META.Planned;
  const statusMeta = STATUS_META[o.status as StatusType] ?? STATUS_META.Pending;

  return (
    <Link href={`/obligations/${o.id}`} className="card-press block">
      <div className="rounded-2xl p-4"
        style={{ background: "#122438", border: "1px solid rgba(59,130,246,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
        {/* Row 1: ref, alert, direction */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-mono font-bold" style={{ color: "#3b82f6" }}>{o.refId}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: alertMeta.bg, color: alertMeta.color }}>{o.alert}</span>
          <span className="ml-auto text-xs font-semibold"
            style={{ color: o.direction === "Inflow" ? "#22c55e" : "#ef4444" }}>
            {o.direction === "Inflow" ? "↓ IN" : "↑ OUT"}
          </span>
        </div>

        {/* Row 2: name */}
        <p className="text-sm font-semibold text-white truncate mb-2">{o.item}</p>

        {/* Row 3: amounts */}
        <div className="flex items-end gap-4">
          <div>
            <div className="text-xs mb-0.5" style={{ color: "#4a6d8a" }}>Total</div>
            <div className="text-sm font-medium text-white num">{formatINR(o.originalAmount)}</div>
          </div>
          <div>
            <div className="text-xs mb-0.5" style={{ color: "#4a6d8a" }}>Paid</div>
            <div className="text-sm font-medium num" style={{ color: "#22c55e" }}>{formatINR(o.paidSoFar)}</div>
          </div>
          <div>
            <div className="text-xs mb-0.5" style={{ color: "#4a6d8a" }}>Left</div>
            <div className="text-sm font-bold num"
              style={{ color: o.remaining > 0 ? "#f59e0b" : "#22c55e" }}>{formatINR(o.remaining)}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs mb-0.5" style={{ color: "#4a6d8a" }}>
              {o.dueDate ? formatShortDate(o.dueDate) : "No due date"}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}>{o.status}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#1a3149" }}>
          <div className="h-full rounded-full bar-fill transition-all"
            style={{ width: `${o.paidPct}%`, backgroundColor: o.paidPct === 100 ? "#22c55e" : "#3b82f6" }} />
        </div>
        <div className="mt-1 text-right">
          <span className="text-xs" style={{ color: "#4a6d8a" }}>{o.paidPct}% complete</span>
        </div>
      </div>
    </Link>
  );
}

export default function ObligationsList() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [obligations, setObligations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [direction, setDirection] = useState("All");
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (type !== "All") params.set("type", type);
    if (status !== "All") params.set("status", status);
    if (direction !== "All") params.set("direction", direction);
    if (search.trim()) params.set("search", search.trim());

    setLoading(true);
    setError(false);
    fetch(`/api/obligations?${params}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setObligations)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [type, status, direction, search]);

  return (
    <div className="max-w-2xl mx-auto pb-nav">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Dues & Receivables</h1>
        <Link href="/add"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16" />
          </svg>
          Add
        </Link>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "#4a6d8a" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search obligations..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "#122438",
              border: "1px solid rgba(59,130,246,0.12)",
              color: "#e8f3ff",
            }}
          />
        </div>
      </div>

      {/* Type filters */}
      <div className="px-4 mb-2">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TYPES.map((t) => (
            <FilterChip key={t} label={t === "All" ? "All Types" : t} active={type === t} onClick={() => setType(t)} />
          ))}
        </div>
      </div>

      {/* Status + direction filters */}
      <div className="px-4 mb-4 flex gap-2">
        {STATUSES.map((s) => (
          <FilterChip key={s} label={s} active={status === s} onClick={() => setStatus(s)} />
        ))}
        <div className="flex-1" />
        <FilterChip label="↑ Out" active={direction === "Outflow"} onClick={() => setDirection(direction === "Outflow" ? "All" : "Outflow")} />
        <FilterChip label="↓ In"  active={direction === "Inflow"}  onClick={() => setDirection(direction === "Inflow"  ? "All" : "Inflow")}  />
      </div>

      {/* Content */}
      <div className="px-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-12 rounded-2xl"
            style={{ background: "#122438", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-3xl mb-2">⚠️</p>
            <p className="font-semibold text-white">Failed to load</p>
            <p className="text-sm mt-1" style={{ color: "#7fa8c9" }}>Check your connection and try again.</p>
          </div>
        ) : obligations.length === 0 ? (
          <div className="text-center py-12 rounded-2xl"
            style={{ background: "#122438", border: "1px solid rgba(59,130,246,0.08)" }}>
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold text-white">No obligations found</p>
            <p className="text-sm mt-1" style={{ color: "#7fa8c9" }}>
              {search ? "Try a different search term" : "Add your first due or receivable"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-medium" style={{ color: "#4a6d8a" }}>{obligations.length} obligation{obligations.length !== 1 ? "s" : ""}</p>
            {obligations.map((o) => <ObligationCard key={o.id} o={o} />)}
          </div>
        )}
      </div>
    </div>
  );
}
