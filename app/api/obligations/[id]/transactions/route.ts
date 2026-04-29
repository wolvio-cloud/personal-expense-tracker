import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const transactions = await prisma.transaction.findMany({
      where: { obligationId: parseInt(id) },
      orderBy: { paymentDate: "desc" },
    });
    return NextResponse.json(transactions);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
