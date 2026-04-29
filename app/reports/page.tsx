"use client";

import { useState, useEffect } from "react";
import { formatINR } from "@/lib/format";

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#243b52" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function ReportsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/monthly?month=${month}`)
      .then((r) => r.json())
      .then(setReport)
      .finally(() => setLoading(false));
  }, [month]);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Reports</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: "#1a2f45", color: "#e8f0fe", border: "1px solid #243b52" }}
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-blue-300">Loading...</div>
      ) : !report ? (
        <div className="text-center py-8 text-blue-400">No data available.</div>
      ) : (
        <>
          {/* Summary Card */}
          <section className="rounded-xl p-4 space-y-4" style={{ backgroundColor: "#1a2f45" }}>
            <h2 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Monthly Summary</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-blue-300">Total Due</div>
                <div className="text-lg font-bold text-white">{formatINR(report.summary.totalDue)}</div>
              </div>
              <div>
                <div className="text-xs text-blue-300">Total Paid</div>
                <div className="text-lg font-bold" style={{ color: "#27AE60" }}>{formatINR(report.summary.totalPaid)}</div>
              </div>
              <div>
                <div className="text-xs text-blue-300">Remaining</div>
                <div className="text-lg font-bold" style={{ color: "#F39C12" }}>{formatINR(report.summary.totalRemaining)}</div>
              </div>
              <div>
                <div className="text-xs text-blue-300">% Complete</div>
                <div className="text-lg font-bold" style={{ color: "#5B9BD5" }}>{report.summary.percentComplete}%</div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-blue-300 mb-1">
                <span>Overall Progress</span>
                <span>{report.summary.percentComplete}%</span>
              </div>
              <ProgressBar value={report.summary.totalPaid} max={report.summary.totalDue} color="#5B9BD5" />
            </div>
          </section>

          {/* Category Breakdown */}
          <section>
            <h2 className="text-sm font-semibold text-blue-300 uppercase tracking-wide mb-3">Category Breakdown</h2>
            <div className="space-y-3">
              {report.breakdown.map((row: {
                type: string; count: number; totalDue: number;
                paid: number; remaining: number; percentDone: number;
              }) => (
                <div key={row.type} className="rounded-xl p-4 space-y-2"
                  style={{ backgroundColor: "#1a2f45" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{row.type}</span>
                    <span className="text-xs text-blue-300">{row.count} items</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-blue-300">Due</div>
                      <div className="text-white font-medium">{formatINR(row.totalDue)}</div>
                    </div>
                    <div>
                      <div className="text-blue-300">Paid</div>
                      <div style={{ color: "#27AE60" }} className="font-medium">{formatINR(row.paid)}</div>
                    </div>
                    <div>
                      <div className="text-blue-300">Left</div>
                      <div style={{ color: "#F39C12" }} className="font-medium">{formatINR(row.remaining)}</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-blue-300 mb-1">
                      <span>Progress</span>
                      <span>{row.percentDone}%</span>
                    </div>
                    <ProgressBar value={row.paid} max={row.totalDue} color="#5B9BD5" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
