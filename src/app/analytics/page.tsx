"use client";

import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Transaction, formatCurrency } from "@/types/api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AnalyticsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params: Record<string, string> = {};
      if (type) params.type = type;
      if (category) params.category = category;
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();
      const res = await apiClient.get<Transaction[]>("/api/transactions", {
        params,
      });
      setTransactions(res.data);
    } catch (e: unknown) {
      const err = e as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (err.response?.status === 401) {
        router.replace("/auth/login");
        return;
      }
      if (err.response?.status === 403) {
        setError("Analytics requires analyst or admin role.");
        return;
      }
      setError(err.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [type, category, startDate, endDate, router]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics Explorer</h1>
        <p className="mt-1 text-sm text-gray-400">
          Filter and inspect all transactions (analyst & admin)
        </p>
      </div>

      {error ? (
        <div className="card text-red-400">{error}</div>
      ) : (
        <>
          <div className="card flex flex-wrap gap-4">
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input
              className="input"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Button variant="primary" onClick={fetchTransactions}>
              Apply
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card text-center">
              <p className="text-sm text-gray-400">Results</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-400">Income</p>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-400">Expenses</p>
              <p className="text-2xl font-bold text-red-400">
                {formatCurrency(totalExpense)}
              </p>
            </div>
          </div>

          <div className="card overflow-x-auto">
            {loading ? (
              <p className="text-gray-500 py-8 text-center">Loading…</p>
            ) : transactions.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">
                No transactions match your filters
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left text-gray-400">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t._id} className="border-b border-gray-800/50">
                      <td className="py-2 pr-4">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-4">{t.category}</td>
                      <td className="py-2 pr-4 capitalize">{t.type}</td>
                      <td
                        className={`py-2 pr-4 font-medium ${
                          t.type === "income" ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="py-2 text-gray-400 truncate max-w-[200px]">
                        {t.note || t.description || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
