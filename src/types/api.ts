export type UserRole = "viewer" | "analyst" | "admin";

export interface DashboardSummary {
  role: string;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  monthlyBreakdown: {
    month: string;
    income: number;
    expenses: number;
    label: string;
  }[];
  categoryBreakdown: { category: string; amount: number }[];
  recentTransactions: Transaction[];
  budgetAlerts: BudgetAlert[];
  usersOverview: UserOverview[] | null;
}

export interface Transaction {
  _id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  note?: string;
  description?: string;
  username?: string;
}

export interface Budget {
  _id: string;
  category: string;
  month: string;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  exceeded: boolean;
}

export interface BudgetAlert {
  category: string;
  month: string;
  limit: number;
  spent: number;
  percentUsed: number;
  exceeded: boolean;
}

export interface UserOverview {
  _id: string;
  totalIncome: number;
  totalExpense: number;
}

export interface RecordItem {
  _id: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  note?: string;
  username?: string;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
