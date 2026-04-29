import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeObligation } from "@/lib/obligations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

    const obligations = await prisma.obligation.findMany({
      where: { month },
      include: { transactions: true },
    });

    const computed = obligations.map(computeObligation);

    const totalDue = computed.reduce((s, o) => s + o.originalAmount, 0);
    const totalPaid = computed.reduce((s, o) => s + o.paidSoFar, 0);
    const totalRemaining = computed.reduce((s, o) => s + o.remaining, 0);
    const percentComplete = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

    const types = ["Credit Card", "Payment Pending", "Planned Expense", "Pending Credit"];
    const breakdown = types.map((type) => {
      const group = computed.filter((o) => o.type === type);
      const due = group.reduce((s, o) => s + o.originalAmount, 0);
      const paid = group.reduce((s, o) => s + o.paidSoFar, 0);
      const remaining = group.reduce((s, o) => s + o.remaining, 0);
      return {
        type,
        totalDue: due,
        paid,
        remaining,
        count: group.length,
        percentDone: due > 0 ? Math.round((paid / due) * 100) : 0,
      };
    });

    return NextResponse.json({
      month,
      summary: { totalDue, totalPaid, totalRemaining, percentComplete },
      breakdown,
      obligations: computed,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}
