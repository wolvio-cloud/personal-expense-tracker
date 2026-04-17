import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeObligation } from "@/lib/obligations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const direction = searchParams.get("direction");

    const obligations = await prisma.obligation.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(direction ? { direction } : {}),
      },
      include: { transactions: true },
      orderBy: { createdAt: "desc" },
    });

    let computed = obligations.map(computeObligation);

    if (status) {
      computed = computed.filter((o) => o.status === status);
    }

    return NextResponse.json(computed);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch obligations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refId, month, type, item, originalAmount, dueDate, direction, notes, isRecurring } = body;

    if (!refId || !month || !type || !item || !originalAmount || !direction) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const obligation = await prisma.obligation.create({
      data: {
        refId,
        month,
        type,
        item,
        originalAmount: parseFloat(originalAmount),
        dueDate: dueDate ? new Date(dueDate) : null,
        direction,
        notes: notes || null,
        isRecurring: Boolean(isRecurring),
      },
      include: { transactions: true },
    });

    return NextResponse.json(computeObligation(obligation), { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create obligation" }, { status: 500 });
  }
}
