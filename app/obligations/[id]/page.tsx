"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { formatINR, formatDate } from "@/lib/format";
import { useRouter } from "next/navigation";

const ALERT_COLORS: Record<string, string> = {
  Overdue: "#C0392B", Upcoming: "#F39C12", Open: "#5B9BD5",
  Cleared: "#27AE60", Planned: "#4a7fa5", Partial: "#5B9BD5",
};

export default function ObligationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [obligation, setObligation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/obligations/${id}`)
      .then((r) => r.json())
      .then(setObligation)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-4 text-blue-300 text-center">Loading...</div>;
  if (!obligation || obligation.error)
    return <div className="p-4 text-red-400">Obligation not found.</div>;

  const paidPct = obligation.originalAmount > 0
    ? Math.round((obligation.paidSoFar / obligation.originalAmount) * 100)
    : 0;

  const statusColor = ALERT_COLORS[obligation.status] || "#5B9BD5";
  const alertColor = ALERT_COLORS[obligation.alert] || "#4a7fa5";

  async function handleDelete() {
    if (!confirm("Delete this obligation and all its payments?")) return;
    await fetch(`/api/obligations/${id}`, { method: "DELETE" });
    router.push("/obligations");
    router.refresh();
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
          style={{ backgroundColor: "#1a2f45" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono" style={{ color: "#5B9BD5" }}>{obligation.refId}</span>
            <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold"
              style={{ backgroundColor: alertColor }}>{obligation.alert}</span>
          </div>
          <h1 className="text-base font-bold text-white truncate">{obligation.item}</h1>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "#1a2f45" }}>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xs text-blue-300">Total</div>
            <div className="text-base font-bold text-white">{formatINR(obligation.originalAmount)}</div>
          </div>
          <div>
            <div className="text-xs text-blue-300">Paid</div>
            <div className="text-base font-bold" style={{ color: "#27AE60" }}>{formatINR(obligation.paidSoFar)}</div>
          </div>
          <div>
            <div className="text-xs text-blue-300">Remaining</div>
            <div className="text-base font-bold" style={{ color: obligation.remaining > 0 ? "#F39C12" : "#27AE60" }}>
              {formatINR(obligation.remaining)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-blue-300 mb-1">
            <span>Progress</span><span>{paidPct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#243b52" }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${paidPct}%`, backgroundColor: statusColor }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-blue-300 text-xs">Type</span>
            <div className="text-white">{obligation.type}</div>
          </div>
          <div>
            <span className="text-blue-300 text-xs">Direction</span>
            <div style={{ color: obligation.direction === "Inflow" ? "#27AE60" : "#C0392B" }}>
              {obligation.direction}
            </div>
          </div>
          <div>
            <span className="text-blue-300 text-xs">Due Date</span>
            <div className="text-white">{formatDate(obligation.dueDate)}</div>
          </div>
          <div>
            <span className="text-blue-300 text-xs">Status</span>
            <div style={{ color: statusColor }}>{obligation.status}</div>
          </div>
          {obligation.notes && (
            <div className="col-span-2">
              <span className="text-blue-300 text-xs">Notes</span>
              <div className="text-white text-sm">{obligation.notes}</div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/pay?obligationId=${id}`}
          className="flex-1 py-3 rounded-xl text-center text-sm font-semibold min-h-[44px] flex items-center justify-center"
          style={{ backgroundColor: "#5B9BD5", color: "#fff" }}>
          Record Payment
        </Link>
        <button onClick={handleDelete}
          className="px-4 py-3 rounded-xl text-sm font-semibold min-h-[44px]"
          style={{ backgroundColor: "#1a2f45", color: "#C0392B" }}>
          Delete
        </button>
      </div>

      {/* Payment History */}
      <section>
        <h2 className="text-sm font-semibold text-blue-300 uppercase tracking-wide mb-2">
          Payment History ({obligation.transactions?.length || 0})
        </h2>
        {!obligation.transactions?.length ? (
          <p className="text-sm text-blue-400 text-center py-4">No payments recorded.</p>
        ) : (
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {obligation.transactions.map((txn: any) => (
              <div key={txn.id} className="rounded-lg p-3 flex items-center justify-between"
                style={{ backgroundColor: "#1a2f45" }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-white">{txn.mode}</span>
                  <span className="text-xs text-blue-300">{formatDate(txn.paymentDate)}</span>
                  {txn.notes && <span className="text-xs text-blue-400">{txn.notes}</span>}
                </div>
                <span className="text-sm font-bold" style={{ color: "#27AE60" }}>
                  {formatINR(txn.amountPaid)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
