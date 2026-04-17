import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(accounts);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}
