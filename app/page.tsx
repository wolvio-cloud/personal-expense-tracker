export const dynamic = "force-dynamic";

import { formatINR, formatDate } from "@/lib/format";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeObligation } from "@/lib/obligations";

async function getDashboard() {
  const [accounts, obligations, recentTxns] = await Promise.all([
    prisma.account.findMany(),
    prisma.obligation.findMany({ include: { transactions: true } }),
    prisma.transaction.findMany({
      orderBy: { paymentDate: "desc" },
      take: 5,
      include: { obligation: true },
    }),
  ]);

  const computed = obligations.map(computeObligation);
  const cashAvailable = accounts.reduce((sum, a) => sum + a.balance, 0);
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
    kpis: {
      cashAvailable,
      totalOutflows,
      totalInflows,
      netPosition,
      overdueAmount: overdue.reduce((s, o) => s + o.remaining, 0),
      upcomingAmount: upcoming.reduce((s, o) => s + o.remaining, 0),
    },
    statusCounts: { overdue: overdue.length, upcoming: upcoming.length, cleared: cleared.length, partial: partial.length },
    actionItems: { overdue, upcoming },
    recentTransactions: recentTxns,
  };
}

function KPICard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-1" style={{ backgroundColor: "#1a2f45" }}>
      <span className="text-xs text-blue-300 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-xl font-bold truncate" style={{ color: color || "#e8f0fe" }}>{value}</span>
    </div>
  );
}

function AlertBadge({ alert }: { alert: string }) {
  const colors: Record<string, string> = {
    Overdue: "#C0392B", Upcoming: "#F39C12", Cleared: "#27AE60",
    Partial: "#5B9BD5", Open: "#5B9BD5", Planned: "#4a7fa5",
  };
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
      style={{ backgroundColor: colors[alert] || "#4a7fa5" }}>
      {alert}
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ObligationCard({ item, color }: { item: any; color: string }) {
  return (
    <Link href={`/obligations/${item.id}`}>
      <div className="rounded-lg p-3 border-l-4 flex items-center justify-between active:opacity-80"
        style={{ backgroundColor: "#1a2f45", borderColor: color }}>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-mono" style={{ color: "#5B9BD5" }}>{item.refId}</span>
          <span className="text-sm font-medium text-white truncate">{item.item}</span>
          {item.dueDate && (
            <span className="text-xs text-blue-300">Due {formatDate(item.dueDate)}</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
          <span className="text-sm font-bold" style={{ color }}>{formatINR(item.remaining)}</span>
          <AlertBadge alert={item.alert} />
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
    return <div className="p-4 text-red-400">Failed to load dashboard data.</div>;
  }

  const { kpis, statusCounts, actionItems, recentTransactions } = data;

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <section>
        <div className="grid grid-cols-2 gap-3">
          <KPICard label="Cash Available" value={formatINR(kpis.cashAvailable)} color="#27AE60" />
          <KPICard label="Net Position" value={formatINR(kpis.netPosition)}
            color={kpis.netPosition >= 0 ? "#27AE60" : "#C0392B"} />
          <KPICard label="Total Outflows" value={formatINR(kpis.totalOutflows)} color="#C0392B" />
          <KPICard label="Total Inflows" value={formatINR(kpis.totalInflows)} color="#27AE60" />
          <KPICard label="Overdue" value={formatINR(kpis.overdueAmount)} color="#C0392B" />
          <KPICard label="Upcoming (7d)" value={formatINR(kpis.upcomingAmount)} color="#F39C12" />
        </div>
      </section>

      <section>
        <div className="rounded-xl p-3 flex items-center justify-around text-center"
          style={{ backgroundColor: "#1a2f45" }}>
          {[
            { count: statusCounts.overdue, label: "Overdue", color: "#C0392B" },
            { count: statusCounts.upcoming, label: "Upcoming", color: "#F39C12" },
            { count: statusCounts.cleared, label: "Cleared", color: "#27AE60" },
            { count: statusCounts.partial, label: "Partial", color: "#5B9BD5" },
          ].map((s, i) => (
            <>
              {i > 0 && <div key={`sep-${i}`} className="w-px h-8 bg-blue-800" />}
              <div key={s.label}>
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.count}</div>
                <div className="text-xs text-blue-300">{s.label}</div>
              </div>
            </>
          ))}
        </div>
      </section>

      {actionItems.overdue.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-2">
            Overdue ({actionItems.overdue.length})
          </h2>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {actionItems.overdue.map((item: any) => (
              <ObligationCard key={item.id} item={item} color="#C0392B" />
            ))}
          </div>
        </section>
      )}

      {actionItems.upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-2">
            Upcoming — Next 7 Days ({actionItems.upcoming.length})
          </h2>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {actionItems.upcoming.map((item: any) => (
              <ObligationCard key={item.id} item={item} color="#F39C12" />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Recent Payments</h2>
          <Link href="/obligations" className="text-xs" style={{ color: "#5B9BD5" }}>View all</Link>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-blue-400 text-center py-6">No payments yet.</p>
        ) : (
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {recentTransactions.map((txn: any) => (
              <div key={txn.id} className="rounded-lg p-3 flex items-center justify-between"
                style={{ backgroundColor: "#1a2f45" }}>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium text-white truncate">{txn.obligation?.item}</span>
                  <span className="text-xs text-blue-300">{txn.mode} · {formatDate(txn.paymentDate)}</span>
                </div>
                <span className="text-sm font-bold ml-3" style={{ color: "#27AE60" }}>
                  {formatINR(txn.amountPaid)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link href="/pay"
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform"
        style={{ backgroundColor: "#5B9BD5" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16" />
        </svg>
      </Link>
    </div>
  );
}
