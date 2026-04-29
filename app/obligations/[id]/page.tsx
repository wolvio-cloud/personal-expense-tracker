"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { formatINR, formatDate, formatShortDate } from "@/lib/format";
import { useRouter } from "next/navigation";
import { ALERT_META, STATUS_META, AlertType, StatusType } from "@/lib/obligations";

export default function ObligationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [obligation, setObligation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deletingTxnId, setDeletingTxnId] = useState<number | null>(null);
  const router = useRouter();

  function load() {
    fetch(`/api/obligations/${id}`)
      .then((r) => r.json())
      .then(setObligation)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-3">
        <div className="skeleton h-8 w-1/2" />
        <div className="skeleton h-36 w-full" style={{ borderRadius: "16px" }} />
        <div className="skeleton h-48 w-full" style={{ borderRadius: "16px" }} />
      </div>
    );
  }

  if (!obligation || obligation.error) {
    return (
      <div className="p-6 text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="font-semibold text-white">Obligation not found</p>
        <Link href="/obligations" className="text-sm mt-2 block" style={{ color: "#3b82f6" }}>← Back to list</Link>
      </div>
    );
  }

  const alertMeta = ALERT_META[obligation.alert as AlertType] ?? ALERT_META.Planned;
  const statusMeta = STATUS_META[obligation.status as StatusType] ?? STATUS_META.Pending;
  const paidPct = obligation.paidPct ?? 0;

  async function handleDelete() {
    if (!confirm("Delete this obligation and all its payments? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/obligations/${id}`, { method: "DELETE" });
    router.push("/obligations");
    router.refresh();
  }

  async function handleDeleteTxn(txnId: number) {
    if (!confirm("Remove this payment?")) return;
    setDeletingTxnId(txnId);
    await fetch(`/api/transactions/${txnId}`, { method: "DELETE" });
    setDeletingTxnId(null);
    load();
  }

  return (
    <div className="max-w-2xl mx-auto pb-nav">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#122438", border: "1px solid rgba(59,130,246,0.12)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#7fa8c9" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono font-bold" style={{ color: "#3b82f6" }}>{obligation.refId}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: alertMeta.bg, color: alertMeta.color }}>{obligation.alert}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-auto"
              style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}>{obligation.status}</span>
          </div>
          <h1 className="text-base font-bold text-white truncate">{obligation.item}</h1>
        </div>
      </div>

      {/* Amount Hero */}
      <div className="px-4 py-2">
        <div className="rounded-2xl p-5"
          style={{ background: "linear-gradient(135deg, #122438 0%, #0f1e30 100%)", border: "1px solid rgba(59,130,246,0.12)" }}>
          {/* Big remaining number */}
          <div className="text-center mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#7fa8c9" }}>Remaining</div>
            <div className="text-4xl font-bold num" style={{ color: obligation.remaining > 0 ? "#f59e0b" : "#22c55e" }}>
              {formatINR(obligation.remaining)}
            </div>
          </div>

          {/* Paid / Total row */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className="text-xs" style={{ color: "#4a6d8a" }}>Paid</div>
              <div className="text-lg font-bold num" style={{ color: "#22c55e" }}>{formatINR(obligation.paidSoFar)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs" style={{ color: "#4a6d8a" }}>Total</div>
              <div className="text-lg font-bold num text-white">{formatINR(obligation.originalAmount)}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5" style={{ color: "#4a6d8a" }}>
              <span>Progress</span><span className="num">{paidPct}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "#1a3149" }}>
              <div className="h-full rounded-full bar-fill"
                style={{ width: `${paidPct}%`, background: paidPct === 100 ? "#22c55e" : "linear-gradient(90deg, #3b82f6, #60a5fa)" }} />
            </div>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4"
            style={{ borderTop: "1px solid rgba(59,130,246,0.1)" }}>
            <div>
              <div className="text-xs mb-0.5" style={{ color: "#4a6d8a" }}>Type</div>
              <div className="text-sm text-white">{obligation.type}</div>
            </div>
            <div>
              <div className="text-xs mb-0.5" style={{ color: "#4a6d8a" }}>Direction</div>
              <div className="text-sm font-semibold"
                style={{ color: obligation.direction === "Inflow" ? "#22c55e" : "#ef4444" }}>
                {obligation.direction === "Inflow" ? "↓ Inflow" : "↑ Outflow"}
              </div>
            </div>
            <div>
              <div className="text-xs mb-0.5" style={{ color: "#4a6d8a" }}>Due Date</div>
              <div className="text-sm text-white">{formatDate(obligation.dueDate)}</div>
            </div>
            <div>
              <div className="text-xs mb-0.5" style={{ color: "#4a6d8a" }}>Month</div>
              <div className="text-sm text-white">{obligation.month}</div>
            </div>
            {obligation.notes && (
              <div className="col-span-2">
                <div className="text-xs mb-0.5" style={{ color: "#4a6d8a" }}>Notes</div>
                <div className="text-sm text-white">{obligation.notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-2 flex gap-2">
        <Link href={`/pay?obligationId=${id}`}
          className="flex-1 py-3.5 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "#fff", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Record Payment
        </Link>
        <button onClick={handleDelete} disabled={deleting}
          className="px-4 py-3.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
          {deleting ? <span className="spinner" /> : "Delete"}
        </button>
      </div>

      {/* Payment History */}
      <div className="px-4 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#7fa8c9" }}>
          Payment History ({obligation.transactions?.length || 0})
        </h2>
        {!obligation.transactions?.length ? (
          <div className="text-center py-8 rounded-2xl"
            style={{ background: "#122438", border: "1px solid rgba(59,130,246,0.08)" }}>
            <p className="text-2xl mb-2">💳</p>
            <p className="text-sm font-medium text-white">No payments yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {obligation.transactions.map((txn: any) => (
              <div key={txn.id} className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                style={{ background: "#122438", border: "1px solid rgba(59,130,246,0.08)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(34,197,94,0.12)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{txn.mode}</div>
                  <div className="text-xs" style={{ color: "#7fa8c9" }}>{formatDate(txn.paymentDate)}</div>
                  {txn.notes && <div className="text-xs mt-0.5 truncate" style={{ color: "#4a6d8a" }}>{txn.notes}</div>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold num" style={{ color: "#22c55e" }}>{formatINR(txn.amountPaid)}</span>
                  <button onClick={() => handleDeleteTxn(txn.id)}
                    disabled={deletingTxnId === txn.id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
                    style={{ background: "rgba(239,68,68,0.1)" }}>
                    {deletingTxnId === txn.id ? (
                      <span className="spinner" style={{ width: "12px", height: "12px" }} />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
