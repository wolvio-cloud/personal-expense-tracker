"use client";

import { useState, useEffect } from "react";
import { formatINR } from "@/lib/format";

const CATEGORY_COLORS: Record<string, string> = {
  "Credit Card":    "#ef4444",
  "Payment Pending":"#f59e0b",
  "Planned Expense":"#3b82f6",
  "Pending Credit": "#22c55e",
};

const CATEGORY_ICONS: Record<string, string> = {
  "Credit Card":    "💳",
  "Payment Pending":"⏳",
  "Planned Expense":"📋",
  "Pending Credit": "💰",
};

interface BreakdownRow {
  type: string; count: number; totalDue: number;
  paid: number; remaining: number; percentDone: number;
}

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ background: "#122438", border: "1px solid rgba(59,130,246,0.1)" }}>
      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7fa8c9" }}>{label}</div>
      <div className="text-2xl font-bold num" style={{ color }}>{value}</div>
      {sub && <div className="text-xs" style={{ color: "#4a6d8a" }}>{sub}</div>}
    </div>
  );
}

function HorizontalBar({ paid, due, color }: { paid: number; due: number; color: string }) {
  const pct = due > 0 ? Math.min(100, Math.round((paid / due) * 100)) : 0;
  return (
    <div className="relative h-4 rounded-full overflow-hidden" style={{ background: "#1a3149" }}>
      <div className="absolute inset-y-0 left-0 rounded-full bar-fill flex items-center justify-end pr-2"
        style={{ width: `${Math.max(pct, 0)}%`, backgroundColor: color, minWidth: pct > 0 ? "28px" : 0 }}>
        {pct >= 15 && (
          <span className="text-xs font-bold text-white num">{pct}%</span>
        )}
      </div>
      {pct < 15 && pct > 0 && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold num" style={{ color: "#7fa8c9" }}>{pct}%</span>
      )}
    </div>
  );
}

export default function ReportsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/reports/monthly?month=${month}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setReport)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [month]);

  return (
    <div className="max-w-2xl mx-auto pb-nav">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Reports</h1>
          <p className="text-xs mt-0.5" style={{ color: "#7fa8c9" }}>Monthly financial overview</p>
        </div>
        <input
          type="month" value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: "#122438", color: "#e8f3ff", border: "1px solid rgba(59,130,246,0.15)" }}
        />
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : error ? (
        <div className="px-4 text-center py-12 rounded-2xl mx-4"
          style={{ background: "#122438", border: "1px solid rgba(239,68,68,0.15)" }}>
          <p className="text-3xl mb-2">⚠️</p>
          <p className="font-semibold text-white">Failed to load report</p>
        </div>
      ) : !report ? (
        <div className="px-4 text-center py-12" />
      ) : (
        <>
          {/* Summary KPI grid */}
          <div className="px-4 grid grid-cols-2 gap-3">
            <StatCard label="Total Due"   value={formatINR(report.summary.totalDue)}       color="#e8f3ff" />
            <StatCard label="Total Paid"  value={formatINR(report.summary.totalPaid)}      color="#22c55e" />
            <StatCard label="Remaining"   value={formatINR(report.summary.totalRemaining)} color="#f59e0b" />
            <StatCard label="Completed"   value={`${report.summary.percentComplete}%`}     color="#3b82f6"
              sub={`${report.summary.totalPaid > 0 ? "of total cleared" : "nothing paid yet"}`} />
          </div>

          {/* Overall progress */}
          <div className="px-4 mt-4">
            <div className="rounded-2xl p-4"
              style={{ background: "#122438", border: "1px solid rgba(59,130,246,0.1)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#7fa8c9" }}>Overall Progress</span>
                <span className="text-sm font-bold num" style={{ color: "#3b82f6" }}>{report.summary.percentComplete}%</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: "#1a3149" }}>
                <div className="h-full rounded-full bar-fill"
                  style={{
                    width: `${report.summary.percentComplete}%`,
                    background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                  }} />
              </div>
              <div className="flex justify-between text-xs mt-2" style={{ color: "#4a6d8a" }}>
                <span>{formatINR(report.summary.totalPaid)} paid</span>
                <span>{formatINR(report.summary.totalDue)} total</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="px-4 mt-5">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#7fa8c9" }}>
              Category Breakdown
            </h2>
            <div className="space-y-3">
              {report.breakdown.map((row: BreakdownRow) => {
                const color = CATEGORY_COLORS[row.type] ?? "#3b82f6";
                const icon = CATEGORY_ICONS[row.type] ?? "📌";
                if (row.count === 0) return null;
                return (
                  <div key={row.type} className="rounded-2xl p-4"
                    style={{ background: "#122438", border: "1px solid rgba(59,130,246,0.08)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <span className="text-sm font-bold text-white">{row.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
                          {row.count} item{row.count !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs font-bold num" style={{ color }}>{row.percentDone}%</span>
                      </div>
                    </div>

                    {/* Bar */}
                    <HorizontalBar paid={row.paid} due={row.totalDue} color={color} />

                    {/* Amounts */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {[
                        { label: "Due",       val: row.totalDue,  c: "#e8f3ff" },
                        { label: "Paid",      val: row.paid,      c: "#22c55e" },
                        { label: "Remaining", val: row.remaining, c: row.remaining > 0 ? "#f59e0b" : "#22c55e" },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <div className="text-xs mb-0.5" style={{ color: "#4a6d8a" }}>{s.label}</div>
                          <div className="text-xs font-bold num" style={{ color: s.c }}>{formatINR(s.val)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
