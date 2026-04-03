"use client";

import apiClient from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await apiClient.get("/api/logout");
      } finally {
        router.push("/auth/login");
        router.refresh();
      }
    })();
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-[#0a0a0a] text-gray-400">
      Signing out…
    </div>
  );
}
