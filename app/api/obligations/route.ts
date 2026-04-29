import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeObligation } from "@/lib/obligations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const direction = searchParams.get("direction");
    const search = searchParams.get("search")?.trim().toLowerCase();

    const obligations = await prisma.obligation.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(direction ? { direction } : {}),
      },
      include: { transactions: { orderBy: { paymentDate: "desc" } } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    let computed = obligations.map(computeObligation);

    if (status) computed = computed.filter((o) => o.status === status);
    if (search) {
      computed = computed.filter(
        (o) =>
          o.item.toLowerCase().includes(search) ||
          o.refId.toLowerCase().includes(search) ||
          (o.notes?.toLowerCase().includes(search) ?? false)
      );
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

    const parsed = parseFloat(originalAmount);
    if (isNaN(parsed) || parsed <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    const obligation = await prisma.obligation.create({
      data: {
        refId: refId.trim().toUpperCase(),
        month,
        type,
        item: item.trim(),
        originalAmount: parsed,
        dueDate: dueDate ? new Date(dueDate) : null,
        direction,
        notes: notes?.trim() || null,
        isRecurring: Boolean(isRecurring),
      },
      include: { transactions: true },
    });

    return NextResponse.json(computeObligation(obligation), { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    const msg = String(err);
    if (msg.includes("Unique constraint") || msg.includes("UNIQUE")) {
      return NextResponse.json({ error: "Ref ID already exists. Use a different ID." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create obligation" }, { status: 500 });
  }
}
