"use client";

import axios from "axios";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Session = { loggedIn: boolean; role: string | null };

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get("/api/auth/session", {
          withCredentials: true,
        });
        if (!cancelled) {
          setSession({
            loggedIn: Boolean(data.loggedIn),
            role: data.role ?? null,
          });
        }
      } catch {
        if (!cancelled) setSession({ loggedIn: false, role: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const isAdmin = session?.role?.toLowerCase() === "admin";

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-white/10 text-white"
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    }`;

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await axios.get("/api/logout", { withCredentials: true });
      setSession({ loggedIn: false, role: null });
      router.push("/auth/login");
      router.refresh();
    } catch {
      setSession({ loggedIn: false, role: null });
      router.push("/auth/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/home" className="text-lg font-semibold tracking-tight text-white">
          Finance
        </Link>
        <div className="flex flex-wrap items-center gap-1">
          <Link href="/home" className={linkClass("/home")}>
            Home
          </Link>
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
          </Link>
          <Link href="/records" className={linkClass("/records")}>
            Records
          </Link>
          {session !== null && isAdmin ? (
            <>
              <Link href="/users" className={linkClass("/users")}>
                Users
              </Link>
              <Link href="/record/add" className={linkClass("/record/add")}>
                Add record
              </Link>
            </>
          ) : null}
          {session !== null && session.loggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 text-gray-400 hover:bg-white/5 hover:text-white`}
            >
              {loggingOut ? "Logging out…" : "Logout"}
            </button>
          ) : null}
          {session !== null && !session.loggedIn ? (
            <Link href="/auth/login" className={linkClass("/auth/login")}>
              Login
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
