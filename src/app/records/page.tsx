"use client";

import apiClient from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const fetchRecords = async () => {
    try {
      const res = await apiClient.get("/api/records", {
        params: { search, type, category, page },
      });

      setRecords(res.data.data);
      setRole(res.data.role);
      setPages(res.data.pagination.pages);
    } catch (e: any) {
      if (e.response?.status === 401) {
        router.replace("/auth/login");
        return;
      }
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [search, type, category, page]);

  const isAdmin = role.toLowerCase() === "admin";

  const handleEdit = (r: any) => {
    setEditingId(r._id);
    setEditData(r);
  };

  const handleSave = async () => {
    await apiClient.put(`/api/records/${editingId}`, editData);
    setEditingId(null);
    fetchRecords();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    await apiClient.delete(`/api/records/${id}`);
    fetchRecords();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Records</h1>
          <p className="text-gray-400 text-sm">
            Manage and filter all financial entries
          </p>
        </div>

        <span className="badge">{role}</span>
      </div>
      <div className="card flex flex-wrap gap-4 mb-6 items-center">
        <input
          placeholder="Search category or note..."
          className="input w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select className="input" onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <input
          placeholder="Category"
          className="input"
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 text-gray-400 text-sm px-4 py-3 border-b border-gray-800">
          <span>User</span>
          <span>Amount</span>
          <span>Type</span>
          <span>Category</span>
          <span>Date</span>
          <span>Note</span>
          <span className="text-right">Actions</span>
        </div>
        {records.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No records found
          </div>
        ) : (
          records.map((r) => (
            <div
              key={r._id}
              className="grid grid-cols-7 items-center px-4 py-3 border-b border-gray-800 hover:bg-[#111]"
            >
              <span className="font-medium">{r.username || "You"}</span>

              {editingId === r._id ? (
                <>
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

                  <span>{r.type}</span>

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
                    <Btn onClick={handleSave} variant="success">
                      Save
                    </Btn>
                    <Btn onClick={() => setEditingId(null)}>Cancel</Btn>
                  </div>
                </>
              ) : (
                <>
                  <span
                    className={
                      r.type === "income" ? "text-green-400" : "text-red-400"
                    }
                  >
                    ₹{r.amount}
                  </span>

                  <span className="capitalize">{r.type}</span>

                  <span>{r.category}</span>

                  <span>{new Date(r.date).toLocaleDateString()}</span>

                  <span className="truncate">{r.note || "-"}</span>

                  <div className="flex justify-end gap-2">
                    {isAdmin && (
                      <>
                        <Btn onClick={() => handleEdit(r)} variant="warning">
                          Edit
                        </Btn>
                        <Btn
                          onClick={() => handleDelete(r._id)}
                          variant="danger"
                        >
                          Delete
                        </Btn>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-3 py-1 rounded ${
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

type Variant = "default" | "success" | "warning" | "danger";

const Btn = ({
  children,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: Variant;
}) => {
  const styles: Record<Variant, string> = {
    default: "bg-gray-700 hover:bg-gray-600",
    success: "bg-green-600 hover:bg-green-700",
    warning: "bg-yellow-500 text-black hover:bg-yellow-600",
    danger: "bg-red-600 hover:bg-red-700",
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded text-sm ${styles[variant]}`}
    >
      {children}
    </button>
  );
};
