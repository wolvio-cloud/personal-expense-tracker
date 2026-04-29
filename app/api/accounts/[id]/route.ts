import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { balance, notes, name, type } = body;

    const account = await prisma.account.update({
      where: { id: parseInt(id) },
      data: {
        ...(balance !== undefined && { balance: parseFloat(balance) }),
        ...(notes !== undefined && { notes }),
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
      },
    });
    return NextResponse.json(account);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
