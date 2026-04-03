"use client";

import apiClient from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setError("");
      const res = await apiClient.get("/api/dashboard");
      setData(res.data.data);
      setRole(res.data.role);
    } catch (e: any) {
      if (e.response?.status === 401) {
        router.replace("/auth/login");
        return;
      }
      setError(
        e.response?.data?.message ||
          e.response?.data?.error ||
          "Could not load dashboard",
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="p-10 text-white">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) return <div className="text-white p-10">Loading...</div>;

  const isAdmin = role.toLowerCase() === "admin";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Finance Dashboard</h1>
        <span className="bg-gray-800 px-4 py-1 rounded-full text-sm">
          {role}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card title="Income" value={data.totalIncome} color="green" />
        <Card title="Expense" value={data.totalExpense} color="red" />
        <Card title="Balance" value={data.netBalance} color="blue" />
      </div>
      {Array.isArray(data.trends) && data.trends.length > 0 ? (
        <div className="glass w-full min-w-0">
          <h2 className="text-xl mb-4">Monthly Trends</h2>

          <div className="h-[320px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.trends}
                margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  stroke="#4b5563"
                />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  stroke="#4b5563"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    border: "1px solid #374151",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "#e5e7eb" }}
                  itemStyle={{ color: "#e5e7eb" }}
                />

                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />

                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="glass text-center text-gray-500 py-10">
          No trend data available
        </div>
      )}

      {data.categories && (
        <div className="glass">
          <h2 className="text-xl mb-4">Expense Insights</h2>

          {data.categories.map((c: any) => (
            <div
              key={c._id}
              className="flex justify-between border-b border-gray-800 py-2"
            >
              <span>{c._id}</span>
              <span className="text-red-400">₹{c.total}</span>
            </div>
          ))}
        </div>
      )}
      {isAdmin && data.usersData && (
        <div className="glass">
          <h2 className="text-xl mb-4">Users Overview</h2>
          {data.usersData.map((u: any) => (
            <div
              key={u._id}
              className="flex justify-between border-b border-gray-800 py-2"
            >
              <span>{u._id}</span>
              <span className="text-green-400">+₹{u.totalIncome}</span>
              <span className="text-red-400">-₹{u.totalExpense}</span>
            </div>
          ))}
        </div>
      )}

      <div className="glass">
        <h2 className="text-xl mb-4">Recent Transactions</h2>
        <div className="flex justify-between text-gray-500 text-xs mb-2 px-1">
          <span>User</span>
          <span>Category</span>
          <span>Amount</span>
        </div>

        {data.recent.map((r: any) => (
          <div
            key={r._id}
            className="flex justify-between py-2 border-b border-gray-800"
          >
            <span className="font-medium">{r.username || "—"}</span>
            <span>{r.category}</span>
            <span
              className={
                r.type === "income" ? "text-green-400" : "text-red-400"
              }
            >
              ₹{r.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const Card = ({ title, value, color }: any) => (
  <div className="glass p-6">
    <p className="text-gray-400">{title}</p>
    <h2 className={`text-2xl font-bold text-${color}-400`}>₹{value}</h2>
  </div>
);
