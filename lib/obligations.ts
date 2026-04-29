import { Obligation, Transaction } from "@/app/generated/prisma/client";

export type ObligationWithTransactions = Obligation & {
  transactions: Transaction[];
};

export type AlertType = "Overdue" | "Upcoming" | "Open" | "Planned" | "Cleared";
export type StatusType = "Cleared" | "Partial" | "Pending";

export type ComputedObligation = ObligationWithTransactions & {
  paidSoFar: number;
  remaining: number;
  status: StatusType;
  alert: AlertType;
  paidPct: number;
};

export function computeObligation(o: ObligationWithTransactions): ComputedObligation {
  const paidSoFar = o.transactions.reduce((sum, t) => sum + t.amountPaid, 0);
  const remaining = Math.max(0, o.originalAmount - paidSoFar);
  const paidPct = o.originalAmount > 0
    ? Math.min(100, Math.round((paidSoFar / o.originalAmount) * 100))
    : 0;

  let status: StatusType;
  if (remaining <= 0) status = "Cleared";
  else if (paidSoFar > 0) status = "Partial";
  else status = "Pending";

  let alert: AlertType;
  if (status === "Cleared") {
    alert = "Cleared";
  } else if (!o.dueDate) {
    alert = o.direction === "Inflow" ? "Open" : "Planned";
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysOut = new Date(today);
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
    const due = new Date(o.dueDate);
    due.setHours(0, 0, 0, 0);

    if (due < today) alert = "Overdue";
    else if (due <= sevenDaysOut) alert = "Upcoming";
    else alert = o.direction === "Inflow" ? "Open" : "Planned";
  }

  return { ...o, paidSoFar, remaining, status, alert, paidPct };
}

export const ALERT_META: Record<AlertType, { color: string; bg: string; label: string }> = {
  Overdue:  { color: "#ef4444", bg: "rgba(239,68,68,0.15)",   label: "Overdue"  },
  Upcoming: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  label: "Upcoming" },
  Cleared:  { color: "#22c55e", bg: "rgba(34,197,94,0.15)",   label: "Cleared"  },
  Open:     { color: "#60a5fa", bg: "rgba(96,165,250,0.15)",  label: "Open"     },
  Planned:  { color: "#7fa8c9", bg: "rgba(127,168,201,0.15)", label: "Planned"  },
};

export const STATUS_META: Record<StatusType, { color: string; bg: string }> = {
  Cleared: { color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  Partial: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  Pending: { color: "#7fa8c9", bg: "rgba(127,168,201,0.10)" },
};
