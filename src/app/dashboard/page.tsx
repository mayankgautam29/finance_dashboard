"use client";

import apiClient from "@/lib/apiClient";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import {
  DashboardSummary,
  formatCurrency,
} from "@/types/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PIE_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params: Record<string, string> = {};
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();
      const res = await apiClient.get<DashboardSummary>(
        "/api/dashboard/summary",
        { params },
      );
      setData(res.data);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      if (err.response?.status === 401) {
        router.replace("/auth/login");
        return;
      }
      setError(err.response?.data?.message || "Could not load dashboard");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error) {
    return (
      <div className="mx-auto max-w-6xl p-8 text-white">
        <p className="text-red-400">{error}</p>
        <Button onClick={fetchData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-6xl p-8 text-gray-400">
        Loading dashboard…
      </div>
    );
  }

  const isAdmin = data.role.toLowerCase() === "admin";
  const isAnalystOrAdmin =
    data.role.toLowerCase() === "analyst" || isAdmin;
  const chartData = data.monthlyBreakdown.map((m) => ({
    month: m.label,
    income: m.income,
    expense: m.expenses,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="dashboard-title">Finance Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">
            Income, expenses, trends, and budget alerts
          </p>
        </div>
        <span className="badge">{data.role}</span>
      </div>

      <div className="card flex flex-wrap items-end gap-4">
        <div>
          <label className="label">From</label>
          <input
            type="date"
            className="input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">To</label>
          <input
            type="date"
            className="input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setStartDate("");
            setEndDate("");
          }}
        >
          Clear filters
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Income"
          value={formatCurrency(data.totalIncome)}
          variant="income"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(data.totalExpenses)}
          variant="expense"
        />
        <StatCard
          title="Net Balance"
          value={formatCurrency(data.netBalance)}
          variant="balance"
          subtitle={data.netBalance >= 0 ? "In the green" : "Over budget"}
        />
      </div>

      {data.budgetAlerts.length > 0 ? (
        <div className="card border-yellow-500/30">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-yellow-400">
              Budget Alerts
            </h2>
            <Link href="/budgets" className="text-sm text-blue-400 hover:underline">
              Manage budgets →
            </Link>
          </div>
          <div className="space-y-3">
            {data.budgetAlerts.map((a) => (
              <div
                key={`${a.category}-${a.month}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 px-4 py-3"
              >
                <div>
                  <span className="font-medium">{a.category}</span>
                  <span className="ml-2 text-xs text-gray-500">{a.month}</span>
                </div>
                <div className="text-sm">
                  <span className={a.exceeded ? "text-red-400" : "text-yellow-400"}>
                    {formatCurrency(a.spent)} / {formatCurrency(a.limit)}
                  </span>
                  <span className="ml-2 text-gray-500">({a.percentUsed}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {isAnalystOrAdmin && chartData.length > 0 ? (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Monthly Trends</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    border: "1px solid #374151",
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {isAnalystOrAdmin && data.categoryBreakdown.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">Expense by Category</h2>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(props) => {
                      const name = String(props.name ?? "");
                      const pct = ((props.percent ?? 0) * 100).toFixed(0);
                      return `${name} ${pct}%`;
                    }}
                  >
                    {data.categoryBreakdown.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatCurrency(Number(v))}
                    contentStyle={{
                      backgroundColor: "#171717",
                      border: "1px solid #374151",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">Category Breakdown</h2>
            <div className="max-h-[260px] space-y-2 overflow-y-auto">
              {data.categoryBreakdown.map((c) => (
                <div
                  key={c.category}
                  className="flex justify-between border-b border-gray-800 py-2 text-sm"
                >
                  <span>{c.category}</span>
                  <span className="text-red-400">{formatCurrency(c.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {isAdmin && data.usersOverview ? (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Users Overview</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-gray-400">
                  <th className="py-2">User</th>
                  <th className="py-2">Income</th>
                  <th className="py-2">Expenses</th>
                  <th className="py-2">Net</th>
                </tr>
              </thead>
              <tbody>
                {data.usersOverview.map((u) => (
                  <tr key={u._id} className="border-b border-gray-800/50">
                    <td className="py-2 font-medium">{u._id}</td>
                    <td className="py-2 text-green-400">
                      {formatCurrency(u.totalIncome)}
                    </td>
                    <td className="py-2 text-red-400">
                      {formatCurrency(u.totalExpense)}
                    </td>
                    <td className="py-2">
                      {formatCurrency(u.totalIncome - u.totalExpense)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Recent Transactions</h2>
        {data.recentTransactions.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {data.recentTransactions.map((r) => (
              <div
                key={r._id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{r.username || "—"}</span>
                  <span className="ml-2 text-gray-500">{r.category}</span>
                </div>
                <span
                  className={
                    r.type === "income" ? "text-green-400" : "text-red-400"
                  }
                >
                  {r.type === "income" ? "+" : "-"}
                  {formatCurrency(r.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
