import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const adapter = new PrismaBetterSqlite3({ url: path.resolve(process.cwd(), "dev.db") });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Clear existing data
  await prisma.transaction.deleteMany();
  await prisma.obligation.deleteMany();
  await prisma.account.deleteMany();

  // Seed accounts (4 accounts)
  await prisma.account.createMany({
    data: [
      { name: "HDFC Bank", type: "Bank", balance: 245600, notes: "Primary salary account" },
      { name: "ICICI Bank", type: "Bank", balance: 82000, notes: "Secondary account" },
      { name: "Cash", type: "Cash", balance: 15000, notes: "Cash on hand" },
      { name: "Paytm Wallet", type: "Wallet", balance: 0, notes: "Digital wallet" },
    ],
  });

  const april = "2026-04";

  // Seed obligations (19 total: 3 CC, 4 PP, 8 PE, 4 PC)
  await prisma.obligation.createMany({
    data: [
      // Credit Cards (3)
      {
        refId: "CC-001",
        month: april,
        type: "Credit Card",
        item: "HDFC Credit Card April Bill",
        originalAmount: 45000,
        dueDate: new Date("2026-04-15"),
        direction: "Outflow",
        notes: "Monthly CC bill",
        isRecurring: true,
      },
      {
        refId: "CC-002",
        month: april,
        type: "Credit Card",
        item: "SBI Credit Card April Bill",
        originalAmount: 28000,
        dueDate: new Date("2026-04-20"),
        direction: "Outflow",
        notes: "Monthly CC bill",
        isRecurring: true,
      },
      {
        refId: "CC-003",
        month: april,
        type: "Credit Card",
        item: "ICICI Credit Card April Bill",
        originalAmount: 18500,
        dueDate: new Date("2026-04-25"),
        direction: "Outflow",
        notes: "Monthly CC bill",
        isRecurring: true,
      },

      // Payment Pending (4)
      {
        refId: "PP-001",
        month: april,
        type: "Payment Pending",
        item: "Home Loan EMI April",
        originalAmount: 42000,
        dueDate: new Date("2026-04-05"),
        direction: "Outflow",
        notes: "HDFC home loan EMI",
        isRecurring: true,
      },
      {
        refId: "PP-002",
        month: april,
        type: "Payment Pending",
        item: "Car Loan EMI April",
        originalAmount: 18500,
        dueDate: new Date("2026-04-07"),
        direction: "Outflow",
        notes: "ICICI car loan EMI",
        isRecurring: true,
      },
      {
        refId: "PP-003",
        month: april,
        type: "Payment Pending",
        item: "Personal Loan EMI",
        originalAmount: 12000,
        dueDate: new Date("2026-04-10"),
        direction: "Outflow",
        notes: "Bajaj Finance",
        isRecurring: true,
      },
      {
        refId: "PP-004",
        month: april,
        type: "Payment Pending",
        item: "Insurance Premium",
        originalAmount: 8541,
        dueDate: new Date("2026-04-30"),
        direction: "Outflow",
        notes: "LIC annual premium",
        isRecurring: false,
      },

      // Planned Expenses (8)
      {
        refId: "PE-001",
        month: april,
        type: "Planned Expense",
        item: "Grocery & Household",
        originalAmount: 15000,
        dueDate: null,
        direction: "Outflow",
        notes: "Monthly groceries",
        isRecurring: true,
      },
      {
        refId: "PE-002",
        month: april,
        type: "Planned Expense",
        item: "Electricity Bill",
        originalAmount: 4500,
        dueDate: new Date("2026-04-22"),
        direction: "Outflow",
        notes: "BESCOM bill",
        isRecurring: true,
      },
      {
        refId: "PE-003",
        month: april,
        type: "Planned Expense",
        item: "Mobile & Internet",
        originalAmount: 2500,
        dueDate: new Date("2026-04-18"),
        direction: "Outflow",
        notes: "Airtel + Jio",
        isRecurring: true,
      },
      {
        refId: "PE-004",
        month: april,
        type: "Planned Expense",
        item: "Kids School Fees",
        originalAmount: 25000,
        dueDate: new Date("2026-04-08"),
        direction: "Outflow",
        notes: "Q1 school fees",
        isRecurring: false,
      },
      {
        refId: "PE-005",
        month: april,
        type: "Planned Expense",
        item: "OTT Subscriptions",
        originalAmount: 1500,
        dueDate: null,
        direction: "Outflow",
        notes: "Netflix + Prime + Hotstar",
        isRecurring: true,
      },
      {
        refId: "PE-006",
        month: april,
        type: "Planned Expense",
        item: "Fuel & Transport",
        originalAmount: 8000,
        dueDate: null,
        direction: "Outflow",
        notes: "Monthly fuel",
        isRecurring: true,
      },
      {
        refId: "PE-007",
        month: april,
        type: "Planned Expense",
        item: "Medical & Pharmacy",
        originalAmount: 3000,
        dueDate: null,
        direction: "Outflow",
        notes: "Monthly medicines",
        isRecurring: false,
      },
      {
        refId: "PE-008",
        month: april,
        type: "Planned Expense",
        item: "Home Maintenance",
        originalAmount: 5000,
        dueDate: null,
        direction: "Outflow",
        notes: "Repairs and upkeep",
        isRecurring: false,
      },

      // Pending Credits (4)
      {
        refId: "PC-001",
        month: april,
        type: "Pending Credit",
        item: "Salary — April",
        originalAmount: 180000,
        dueDate: new Date("2026-04-30"),
        direction: "Inflow",
        notes: "Monthly salary credit",
        isRecurring: true,
      },
      {
        refId: "PC-002",
        month: april,
        type: "Pending Credit",
        item: "Freelance Payment — Client A",
        originalAmount: 45000,
        dueDate: new Date("2026-04-20"),
        direction: "Inflow",
        notes: "Project milestone payment",
        isRecurring: false,
      },
      {
        refId: "PC-003",
        month: april,
        type: "Pending Credit",
        item: "Rental Income",
        originalAmount: 18000,
        dueDate: new Date("2026-04-05"),
        direction: "Inflow",
        notes: "Flat rental",
        isRecurring: true,
      },
      {
        refId: "PC-004",
        month: april,
        type: "Pending Credit",
        item: "Interest & Dividends",
        originalAmount: 295000,
        dueDate: null,
        direction: "Inflow",
        notes: "FD interest + stock dividends",
        isRecurring: false,
      },
    ],
  });

  console.log("Seed data loaded successfully.");
  console.log("Accounts: 4 | Obligations: 19 (3 CC, 4 PP, 8 PE, 4 PC)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
