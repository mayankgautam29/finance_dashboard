"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get("/api/dashboard");
      setData(res.data.data);
    };
    fetchData();
  }, []);

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* 🔥 TOP CARDS */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-green-600 p-4 rounded-lg">
          <p>Total Income</p>
          <h2 className="text-xl font-bold">₹{data.totalIncome}</h2>
        </div>

        <div className="bg-red-600 p-4 rounded-lg">
          <p>Total Expense</p>
          <h2 className="text-xl font-bold">₹{data.totalExpense}</h2>
        </div>

        <div className="bg-blue-600 p-4 rounded-lg">
          <p>Net Balance</p>
          <h2 className="text-xl font-bold">₹{data.netBalance}</h2>
        </div>
      </div>

      {/* 🔥 CATEGORY */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Category Breakdown</h2>
        {data.categories.map((c: any) => (
          <div key={c._id} className="flex justify-between">
            <span>{c._id}</span>
            <span>₹{c.total}</span>
          </div>
        ))}
      </div>

      {/* 🔥 RECENT */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Recent Transactions</h2>
        {data.recent.map((r: any) => (
          <div key={r._id} className="flex justify-between border-b py-2">
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