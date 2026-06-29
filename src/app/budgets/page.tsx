"use client";

import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/Toast";
import { Budget, currentMonth, formatCurrency } from "@/types/api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function BudgetsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [month, setMonth] = useState(currentMonth());
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ budgets: Budget[] }>("/api/budgets", {
        params: { month },
      });
      setBudgets(res.data.budgets);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err.response?.status === 401) {
        router.replace("/auth/login");
        return;
      }
      showToast("Failed to load budgets", "error");
    } finally {
      setLoading(false);
    }
  }, [month, router, showToast]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !limit) return;
    try {
      await apiClient.post("/api/budgets", {
        category: category.trim(),
        month,
        limit: parseFloat(limit),
      });
      setCategory("");
      setLimit("");
      showToast("Budget created", "success");
      fetchBudgets();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || "Could not create budget", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this budget?")) return;
    try {
      await apiClient.delete(`/api/budgets/${id}`);
      showToast("Budget deleted", "success");
      fetchBudgets();
    } catch {
      showToast("Delete failed", "error");
    }
  };

  return (
    <div className="page-shell mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Budgets"
        subtitle="Set monthly spending limits per category and track progress"
      />

      <div className="card">
        <label className="label">Month</label>
        <input
          type="month"
          className="input"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      <form onSubmit={handleCreate} className="card space-y-4">
        <h2 className="text-lg font-semibold">Add Budget</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Category</label>
            <input
              className="input w-full"
              placeholder="e.g. Food, Transport"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Monthly limit (₹)</label>
            <input
              type="number"
              min="1"
              step="1"
              className="input w-full"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              required
            />
          </div>
        </div>
        <Button type="submit" variant="primary">
          Create budget
        </Button>
      </form>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Active budgets</h2>
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : budgets.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No budgets for {month}. Create one above.
          </p>
        ) : (
          <div className="space-y-4">
            {budgets.map((b) => (
              <div
                key={b._id}
                className="rounded-lg border border-gray-800 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{b.category}</span>
                  <Button variant="danger" onClick={() => handleDelete(b._id)}>
                    Delete
                  </Button>
                </div>
                <div className="mb-2 flex justify-between text-sm text-gray-400">
                  <span>
                    {formatCurrency(b.spent)} of {formatCurrency(b.limit)}
                  </span>
                  <span className={b.exceeded ? "text-red-400" : ""}>
                    {b.percentUsed}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      b.exceeded
                        ? "bg-red-500"
                        : b.percentUsed >= 80
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {b.exceeded
                    ? `Over by ${formatCurrency(b.spent - b.limit)}`
                    : `${formatCurrency(b.remaining)} remaining`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
