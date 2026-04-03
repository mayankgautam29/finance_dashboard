"use client";

import apiClient from "@/lib/apiClient";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiClient.get("/api/logout");
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.log("Logout failed");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <button
        onClick={handleLogout}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
      >
        Logout
      </button>
    </div>
  );
}