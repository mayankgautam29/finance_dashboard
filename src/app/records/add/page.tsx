"use client";

import apiClient from "@/lib/apiClient";
import { useEffect, useState } from "react";

type Me = { username?: string; name?: string; role?: string };

export default function AddRec() {
  const [amount, setAmount] = useState<number | "">("");
  const [type, setType] = useState("income");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get<Me>("/api/auth/me");
        if (cancelled || !data) return;
        const un = data.username || data.name || "";
        setUsername(un);
        setRole(String(data.role || "").toLowerCase());
      } catch {
        /* not logged in — user can still type username */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await apiClient.post("/api/records/add", {
        amount: Number(amount),
        type,
        category,
        note,
        username: username.trim(),
      });

      alert("Record added successfully");
      setAmount("");
      setType("income");
      setCategory("");
      setNote("");
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to add record";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === "admin";
  /** Only lock owner username for logged-in non-admins (after /me). If /me fails, leave editable so submit can surface auth errors. */
  const ownerFieldReadOnly = !isAdmin && !!role;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
      <div className="card w-full max-w-md">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Add New Record
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Record is stored for the user whose username you enter (must exist
            in the database).
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Owner username</label>
            <input
              type="text"
              placeholder="Registered username or display name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input w-full"
              required
              readOnly={ownerFieldReadOnly}
              title={
                isAdmin
                  ? "Admin: any registered user"
                  : ownerFieldReadOnly
                    ? "You can only add records for yourself"
                    : "Sign in to add a record, or enter a username after logging in"
              }
            />
            {!isAdmin && (
              <p className="text-gray-500 text-xs mt-1">
                Prefilled from your account. Only admins can choose another
                user.
              </p>
            )}
          </div>
          <div>
            <label className="label">Amount</label>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value === "" ? "" : Number(e.target.value),
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
