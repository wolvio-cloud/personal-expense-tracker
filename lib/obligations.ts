import { Obligation, Transaction } from "@/app/generated/prisma/client";

export type ObligationWithTransactions = Obligation & {
  transactions: Transaction[];
};

export type ComputedObligation = ObligationWithTransactions & {
  paidSoFar: number;
  remaining: number;
  status: "Cleared" | "Partial" | "Pending";
  alert: "Overdue" | "Upcoming" | "Open" | "Planned";
};

export function computeObligation(o: ObligationWithTransactions): ComputedObligation {
  const paidSoFar = o.transactions.reduce((sum, t) => sum + t.amountPaid, 0);
  const remaining = o.originalAmount - paidSoFar;

  let status: "Cleared" | "Partial" | "Pending";
  if (remaining <= 0) status = "Cleared";
  else if (paidSoFar > 0) status = "Partial";
  else status = "Pending";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysOut = new Date(today);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

  let alert: "Overdue" | "Upcoming" | "Open" | "Planned";
  if (!o.dueDate) {
    alert = o.direction === "Inflow" ? "Open" : "Planned";
  } else {
    const due = new Date(o.dueDate);
    due.setHours(0, 0, 0, 0);
    if (remaining > 0 && due < today) alert = "Overdue";
    else if (remaining > 0 && due <= sevenDaysOut) alert = "Upcoming";
    else alert = o.direction === "Inflow" ? "Open" : "Planned";
  }

  return { ...o, paidSoFar, remaining, status, alert };
}
