"use client";

import apiClient from "@/lib/apiClient";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get("/api/users");
      setUsers(res.data.data);
      setForbidden(false);
    } catch (e: any) {
      if (e.response?.status === 403) setForbidden(true);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: any) => {
    setEditingId(user._id);
    setEditData({
      role: user.role,
      isActive: user.isActive ?? true,
    });
  };

  const handleSave = async () => {
    try {
      await apiClient.put(`/api/users/${editingId}`, editData);
      setEditingId(null);
      fetchUsers();
    } catch {
      // 403 handled by list refetch; keep edit mode if transient error
    }
  };

  if (forbidden) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8 text-white">
        <div className="glass mx-auto max-w-lg space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Admins only</h1>
          <p className="text-gray-400 text-sm">
            You need an administrator account to view and edit users.
          </p>
          <Link
            href="/home"
            className="inline-block rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-700"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">User Management</h1>
        <p className="text-gray-400 text-sm">
          Admin control panel for managing users
        </p>
      </div>
      <div className="card overflow-hidden">
        <div className="grid grid-cols-5 px-4 py-3 text-gray-400 border-b border-gray-800">
          <span>Username</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        {users.map((u) => (
          <div
            key={u._id}
            className="grid grid-cols-5 px-4 py-3 border-b border-gray-800 hover:bg-[#111]"
          >
            <span>{u.username}</span>
            <span>{u.email}</span>
            {editingId === u._id ? (
              <select
                className="input"
                value={editData.role}
                onChange={(e) =>
                  setEditData({ ...editData, role: e.target.value })
                }
              >
                <option value="Viewer">Viewer</option>
                <option value="Analyst">Analyst</option>
                <option value="Admin">Admin</option>
              </select>
            ) : (
              <span>{u.role}</span>
            )}
            {editingId === u._id ? (
              <select
                className="input"
                value={editData.isActive ? "active" : "inactive"}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    isActive: e.target.value === "active",
                  })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            ) : (
              <span
                className={
                  u.isActive ? "text-green-400" : "text-red-400"
                }
              >
                {u.isActive !== false ? "Active" : "Inactive"}
              </span>
            )}
            <div className="flex justify-end gap-2">
              {editingId === u._id ? (
                <>
                  <Btn onClick={handleSave} variant="success">
                    Save
                  </Btn>
                  <Btn onClick={() => setEditingId(null)}>
                    Cancel
                  </Btn>
                </>
              ) : (
                <Btn onClick={() => handleEdit(u)} variant="warning">
                  Edit
                </Btn>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


type Variant = "default" | "success" | "warning";

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