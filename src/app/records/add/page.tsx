"use client";

import { useState } from "react";
import axios from "axios";

export default function AddRec() {
  const [amount, setAmount] = useState<number | "">("");
  const [type, setType] = useState("income");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await axios.post("/api/records/add", {
        amount: Number(amount),
        type,
        category,
        note,
      });

      alert("Record added successfully");
      setAmount("");
      setType("income");
      setCategory("");
      setNote("");
    } catch (error: any) {
      console.log(error);
      alert("Failed to add record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
      <div className="card w-full max-w-md">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Add New Record
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Track your income and expenses efficiently
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Amount</label>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input w-full"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <input
              type="text"
              placeholder="e.g. Food, Rent, Salary"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="label">Note</label>
            <input
              type="text"
              placeholder="Optional note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input w-full"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Adding Record..." : "Add Record"}
          </button>

        </form>
      </div>
    </div>
  );
}