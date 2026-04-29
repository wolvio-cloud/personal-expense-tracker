import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeObligation } from "@/lib/obligations";

export async function GET() {
  try {
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

    const overdueAmount = overdue.reduce((s, o) => s + o.remaining, 0);
    const upcomingAmount = upcoming.reduce((s, o) => s + o.remaining, 0);

    return NextResponse.json({
      kpis: {
        cashAvailable,
        totalOutflows,
        totalInflows,
        netPosition,
        overdueAmount,
        upcomingAmount,
      },
      statusCounts: {
        overdue: overdue.length,
        upcoming: upcoming.length,
        cleared: cleared.length,
        partial: partial.length,
      },
      actionItems: {
        overdue,
        upcoming,
      },
      recentTransactions: recentTxns,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
