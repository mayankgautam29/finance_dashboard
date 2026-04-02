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
    <div className="flex h-screen items-center justify-center bg-black text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-8 rounded-xl shadow-lg w-96 flex flex-col gap-4"
      >
        <h2 className="text-xl font-bold text-center">Add Record</h2>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
          className="p-2 rounded bg-gray-800 outline-none"
          required
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="p-2 rounded bg-gray-800"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input
          type="text"
          placeholder="Category (e.g. food, rent)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-2 rounded bg-gray-800 outline-none"
          required
        />
        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="p-2 rounded bg-gray-800 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 p-2 rounded font-semibold"
        >
          {loading ? "Adding..." : "Add Record"}
        </button>
      </form>
    </div>
  );
}