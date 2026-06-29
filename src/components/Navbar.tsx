"use client";

import apiClient from "@/lib/apiClient";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Session = { loggedIn: boolean; role: string | null };

const NAV_LINKS = [
  { href: "/home", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/records", label: "Records" },
  { href: "/budgets", label: "Budgets" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const isAuthPage = pathname.startsWith("/auth");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get("/api/auth/session");
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

  const role = session?.role?.toLowerCase() ?? "";
  const isAdmin = role === "admin";
  const isAnalystOrAdmin = role === "analyst" || isAdmin;

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
      pathname === href
        ? "bg-white/10 text-white shadow-sm shadow-black/20"
        : "text-zinc-400 hover:bg-white/5 hover:text-white"
    }`;

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await apiClient.get("/api/logout");
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
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
        isAuthPage
          ? "border-transparent bg-transparent"
          : "border-white/8 bg-[#050505]/80"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <Link href="/home" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-sm font-bold text-emerald-400 transition group-hover:border-emerald-400/40 group-hover:bg-emerald-500/15">
            F
          </span>
          <span className="text-base font-semibold tracking-tight text-white">
            Finance
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
          {session !== null && isAnalystOrAdmin ? (
            <Link href="/analytics" className={linkClass("/analytics")}>
              Analytics
            </Link>
          ) : null}
          {session !== null && isAdmin ? (
            <>
              <Link href="/users" className={linkClass("/users")}>
                Users
              </Link>
              <Link href="/records/add" className={linkClass("/records/add")}>
                Add record
              </Link>
            </>
          ) : null}

          {session?.loggedIn && session.role ? (
            <span className="badge ml-1 hidden sm:inline-flex">{session.role}</span>
          ) : null}

          {session !== null && session.loggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="ml-1 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              {loggingOut ? "Logging out…" : "Logout"}
            </button>
          ) : null}
          {session !== null && !session.loggedIn ? (
            <Link
              href="/auth/login"
              className="ml-1 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              Login
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
