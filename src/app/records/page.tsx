"use client";

import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/Toast";
import { RecordItem, formatCurrency } from "@/types/api";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function RecordsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<RecordItem>>({});
  const [importing, setImporting] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await apiClient.get("/api/records", {
        params: { search, type, category, page },
      });
      setRecords(res.data.data);
      setRole(res.data.role);
      setPages(res.data.pagination.pages);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err.response?.status === 401) {
        router.replace("/auth/login");
        return;
      }
      showToast("Failed to load records", "error");
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [search, type, category, page]);

  const isAdmin = role.toLowerCase() === "admin";

  const handleSave = async () => {
    try {
      await apiClient.put(`/api/records/${editingId}`, editData);
      setEditingId(null);
      showToast("Record updated", "success");
      fetchRecords();
    } catch {
      showToast("Update failed", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    try {
      await apiClient.delete(`/api/records/${id}`);
      showToast("Record deleted", "success");
      fetchRecords();
    } catch {
      showToast("Delete failed", "error");
    }
  };

  const handleExport = async () => {
    try {
      const res = await apiClient.get("/api/export/transactions", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast("Export downloaded", "success");
    } catch {
      showToast("Export failed", "error");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiClient.post("/api/export/transactions/import", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast(res.data.message, "success");
      if (res.data.errors?.length) {
        showToast(`${res.data.errors.length} row(s) had errors`, "error");
      }
      fetchRecords();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || "Import failed", "error");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Records</h1>
          <p className="text-sm text-gray-400">
            Search, filter, export, and manage financial entries
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge">{role}</span>
          <Button onClick={handleExport}>Export CSV</Button>
          {isAdmin ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
              />
              <Button
                variant="primary"
                disabled={importing}
                onClick={() => fileInputRef.current?.click()}
              >
                {importing ? "Importing…" : "Import CSV"}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="card mb-6 flex flex-wrap gap-4">
        <input
          placeholder="Search category or note…"
          className="input w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input
          placeholder="Category"
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      <div className="card overflow-x-auto">
        <div className="grid min-w-[700px] grid-cols-7 gap-2 border-b border-gray-800 px-4 py-3 text-sm text-gray-400">
          <span>User</span>
          <span>Amount</span>
          <span>Type</span>
          <span>Category</span>
          <span>Date</span>
          <span>Note</span>
          <span className="text-right">Actions</span>
        </div>
        {records.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No records found</div>
        ) : (
          records.map((r) => (
            <div
              key={r._id}
              className="grid min-w-[700px] grid-cols-7 items-center gap-2 border-b border-gray-800 px-4 py-3 hover:bg-white/[0.02]"
            >
              {editingId === r._id ? (
                <>
                  <span className="font-medium">{r.username || "You"}</span>
                  <input
                    className="input"
                    value={editData.amount}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        amount: Number(e.target.value),
                      })
                    }
                  />
                  <span className="capitalize">{r.type}</span>
                  <input
                    className="input"
                    value={editData.category}
                    onChange={(e) =>
                      setEditData({ ...editData, category: e.target.value })
                    }
                  />
                  <span>{new Date(r.date).toLocaleDateString()}</span>
                  <input
                    className="input"
                    value={editData.note}
                    onChange={(e) =>
                      setEditData({ ...editData, note: e.target.value })
                    }
                  />
                  <div className="flex justify-end gap-2">
                    <Button onClick={handleSave} variant="success">
                      Save
                    </Button>
                    <Button onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                  <span className="font-medium">{r.username || "You"}</span>
                  <span
                    className={
                      r.type === "income" ? "text-green-400" : "text-red-400"
                    }
                  >
                    {formatCurrency(r.amount)}
                  </span>
                  <span className="capitalize">{r.type}</span>
                  <span>{r.category}</span>
                  <span>{new Date(r.date).toLocaleDateString()}</span>
                  <span className="truncate">{r.note || "—"}</span>
                  <div className="flex justify-end gap-2">
                    {isAdmin ? (
                      <>
                        <Button
                          onClick={() => {
                            setEditingId(r._id);
                            setEditData(r);
                          }}
                          variant="warning"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(r._id)}
                          variant="danger"
                        >
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`rounded px-3 py-1 text-sm ${
              page === i + 1 ? "bg-white text-black" : "bg-gray-800"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
