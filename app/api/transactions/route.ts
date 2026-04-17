import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { obligationId, paymentDate, amountPaid, mode, notes } = body;

    if (!obligationId || !amountPaid || !mode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const obligation = await prisma.obligation.findUnique({
      where: { id: parseInt(obligationId) },
    });
    if (!obligation) {
      return NextResponse.json({ error: "Obligation not found" }, { status: 404 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        obligationId: parseInt(obligationId),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        amountPaid: parseFloat(amountPaid),
        mode,
        notes: notes || null,
      },
      include: { obligation: true },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
