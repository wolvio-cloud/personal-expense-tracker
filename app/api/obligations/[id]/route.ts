import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeObligation } from "@/lib/obligations";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const obligation = await prisma.obligation.findUnique({
      where: { id: parseInt(id) },
      include: { transactions: { orderBy: { paymentDate: "desc" } } },
    });
    if (!obligation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(computeObligation(obligation));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch obligation" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { refId, month, type, item, originalAmount, dueDate, direction, notes, isRecurring } = body;

    const obligation = await prisma.obligation.update({
      where: { id: parseInt(id) },
      data: {
        ...(refId !== undefined && { refId }),
        ...(month !== undefined && { month }),
        ...(type !== undefined && { type }),
        ...(item !== undefined && { item }),
        ...(originalAmount !== undefined && { originalAmount: parseFloat(originalAmount) }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(direction !== undefined && { direction }),
        ...(notes !== undefined && { notes }),
        ...(isRecurring !== undefined && { isRecurring: Boolean(isRecurring) }),
      },
      include: { transactions: { orderBy: { paymentDate: "desc" } } },
    });

    return NextResponse.json(computeObligation(obligation));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update obligation" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id);
    // Atomic deletion — transactions first, then obligation
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { obligationId: numId } }),
      prisma.obligation.delete({ where: { id: numId } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete obligation" }, { status: 500 });
  }
}
