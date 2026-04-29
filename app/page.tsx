export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeObligation, ALERT_META } from "@/lib/obligations";
import { formatINR, formatShortDate } from "@/lib/format";

async function getDashboard() {
  const [accounts, obligations, recentTxns] = await Promise.all([
    prisma.account.findMany({ orderBy: { balance: "desc" } }),
    prisma.obligation.findMany({ include: { transactions: true } }),
    prisma.transaction.findMany({
      orderBy: { paymentDate: "desc" },
      take: 5,
      include: { obligation: true },
    }),
  ]);

  const computed = obligations.map(computeObligation);
  const cashAvailable = accounts.reduce((s, a) => s + a.balance, 0);
  const outflows = computed.filter((o) => o.direction === "Outflow");
  const inflows = computed.filter((o) => o.direction === "Inflow");
  const totalOutflows = outflows.reduce((s, o) => s + o.originalAmount, 0);
  const totalInflows = inflows.reduce((s, o) => s + o.originalAmount, 0);
  const netPosition = cashAvailable + totalInflows - totalOutflows;
  const overdue = computed.filter((o) => o.alert === "Overdue");
  const upcoming = computed.filter((o) => o.alert === "Upcoming");
  const cleared = computed.filter((o) => o.status === "Cleared");
  const partial = computed.filter((o) => o.status === "Partial");

  return {
    accounts,
    kpis: {
      cashAvailable, totalOutflows, totalInflows, netPosition,
      overdueAmount: overdue.reduce((s, o) => s + o.remaining, 0),
      upcomingAmount: upcoming.reduce((s, o) => s + o.remaining, 0),
    },
    statusCounts: { overdue: overdue.length, upcoming: upcoming.length, cleared: cleared.length, partial: partial.length },
    actionItems: { overdue, upcoming },
    recentTransactions: recentTxns,
  };
}

import React from "react";

// ── KPI card icons ──────────────────────────────────────────────────────────
const KPI_ICONS: Record<string, React.ReactElement> = {
  cash: <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
  net: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  out: <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
  in: <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18m-6 4v1a3 3 0 003 3h4a3 3 0 003-3V7a3 3 0 00-3-3h-4a3 3 0 00-3 3v1" />,
  overdue: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  upcoming: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
};

function Icon({ d }: { d: React.ReactElement }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      {d}
    </svg>
  );
}

function KPICard({ label, value, iconKey, color, delay }: {
  label: string; value: string; iconKey: string; color: string; delay: number;
}): React.ReactElement {
  return (
    <div className={`rounded-2xl p-4 flex flex-col gap-3 animate-fade-up-delay-${delay}`}
      style={{
        background: "linear-gradient(135deg, #122438 0%, #0f1e30 100%)",
        border: "1px solid rgba(59,130,246,0.1)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
      }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7fa8c9" }}>{label}</span>
        <span style={{ color, opacity: 0.8 }}><Icon d={KPI_ICONS[iconKey]} /></span>
      </div>
      <span className="text-2xl font-bold num leading-none" style={{ color }}>{value}</span>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ActionCard({ item, borderColor }: { item: any; borderColor: string }) {
  const meta = ALERT_META[item.alert as keyof typeof ALERT_META];
  const paidPct = item.paidPct ?? 0;
  return (
    <Link href={`/obligations/${item.id}`} className="card-press block">
      <div className="rounded-xl p-3.5 flex gap-3"
        style={{ background: "#122438", border: `1px solid ${borderColor}30`, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: borderColor }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono font-semibold" style={{ color: "#3b82f6" }}>{item.refId}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: meta.bg, color: meta.color }}>{item.alert}</span>
          </div>
          <p className="text-sm font-semibold text-white truncate">{item.item}</p>
          {item.dueDate && (
            <p className="text-xs mt-0.5" style={{ color: "#7fa8c9" }}>Due {formatShortDate(item.dueDate)}</p>
          )}
          {paidPct > 0 && (
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#1a3149" }}>
              <div className="h-full rounded-full bar-fill" style={{ width: `${paidPct}%`, backgroundColor: borderColor }} />
            </div>
          )}
        </div>
        <div className="flex flex-col items-end justify-between shrink-0">
          <span className="text-sm font-bold num" style={{ color: borderColor }}>{formatINR(item.remaining)}</span>
          <span className="text-xs" style={{ color: "#4a6d8a" }}>{paidPct}% paid</span>
        </div>
      </div>
    </Link>
  );
}

export default async function Dashboard() {
  let data;
  try {
    data = await getDashboard();
  } catch {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-3 text-center">
        <div className="text-4xl">⚠️</div>
        <p className="font-semibold text-white">Failed to load dashboard</p>
        <p className="text-sm" style={{ color: "#7fa8c9" }}>Check the database connection.</p>
      </div>
    );
  }

  const { accounts, kpis, statusCounts, actionItems, recentTransactions } = data;

  return (
    <div className="max-w-2xl mx-auto pb-nav">
      {/* Accounts strip */}
      <div className="px-4 pt-4 pb-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2.5">
          {accounts.map((a, i) => (
            <div key={a.id}
              className={`shrink-0 rounded-xl px-3.5 py-2.5 animate-fade-up-delay-${i + 1}`}
              style={{ background: "#122438", border: "1px solid rgba(59,130,246,0.12)", minWidth: "130px" }}>
              <div className="text-xs mb-1" style={{ color: "#7fa8c9" }}>{a.type} · {a.name}</div>
              <div className="text-sm font-bold num text-white">{formatINR(a.balance)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="px-4 pt-2 grid grid-cols-2 gap-3">
        <KPICard label="Cash Available"  value={formatINR(kpis.cashAvailable)}  iconKey="cash"    color="#22c55e" delay={1} />
        <KPICard label="Net Position"    value={formatINR(kpis.netPosition)}    iconKey="net"     color={kpis.netPosition >= 0 ? "#22c55e" : "#ef4444"} delay={2} />
        <KPICard label="Total Outflows"  value={formatINR(kpis.totalOutflows)}  iconKey="out"     color="#ef4444" delay={3} />
        <KPICard label="Total Inflows"   value={formatINR(kpis.totalInflows)}   iconKey="in"      color="#22c55e" delay={4} />
        <KPICard label="Overdue"         value={formatINR(kpis.overdueAmount)}  iconKey="overdue" color="#ef4444" delay={5} />
        <KPICard label="Upcoming 7d"     value={formatINR(kpis.upcomingAmount)} iconKey="upcoming" color="#f59e0b" delay={5} />
      </div>

      {/* Status pill bar */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl px-4 py-3 flex items-center justify-around"
          style={{ background: "#122438", border: "1px solid rgba(59,130,246,0.1)" }}>
          {[
            { n: statusCounts.overdue, label: "Overdue", color: "#ef4444" },
            { n: statusCounts.upcoming, label: "Upcoming", color: "#f59e0b" },
            { n: statusCounts.cleared, label: "Cleared", color: "#22c55e" },
            { n: statusCounts.partial, label: "Partial", color: "#3b82f6" },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-2.5">
              {i > 0 && <div className="w-px h-6" style={{ backgroundColor: "rgba(59,130,246,0.15)" }} />}
              <div className="text-center">
                <div className="text-xl font-bold num" style={{ color: s.color }}>{s.n}</div>
                <div className="text-xs" style={{ color: "#7fa8c9" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue */}
      {actionItems.overdue.length > 0 && (
        <div className="px-4 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#ef4444" }} />
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#ef4444" }}>
              Overdue · {actionItems.overdue.length}
            </h2>
          </div>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {actionItems.overdue.map((item: any) => (
              <ActionCard key={item.id} item={item} borderColor="#ef4444" />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {actionItems.upcoming.length > 0 && (
        <div className="px-4 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#f59e0b" }}>
              Upcoming 7 Days · {actionItems.upcoming.length}
            </h2>
          </div>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {actionItems.upcoming.map((item: any) => (
              <ActionCard key={item.id} item={item} borderColor="#f59e0b" />
            ))}
          </div>
        </div>
      )}

      {/* Recent Payments */}
      <div className="px-4 pt-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#7fa8c9" }}>
            Recent Payments
          </h2>
          <Link href="/obligations" className="text-xs font-semibold" style={{ color: "#3b82f6" }}>View all →</Link>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 rounded-2xl" style={{ background: "#122438", border: "1px solid rgba(59,130,246,0.1)" }}>
            <p className="text-3xl mb-2">💳</p>
            <p className="text-sm font-medium text-white">No payments recorded</p>
            <p className="text-xs mt-1" style={{ color: "#7fa8c9" }}>Tap + to record your first payment</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {recentTransactions.map((txn: any) => (
              <div key={txn.id} className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: "#122438", border: "1px solid rgba(59,130,246,0.08)" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(34,197,94,0.12)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{txn.obligation?.item}</p>
                    <p className="text-xs" style={{ color: "#7fa8c9" }}>{txn.mode} · {formatShortDate(txn.paymentDate)}</p>
                  </div>
                </div>
                <span className="text-sm font-bold num ml-3 shrink-0" style={{ color: "#22c55e" }}>
                  {formatINR(txn.amountPaid)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link href="/pay"
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          boxShadow: "0 4px 20px rgba(59,130,246,0.5)",
        }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16" />
        </svg>
      </Link>
    </div>
  );
}
