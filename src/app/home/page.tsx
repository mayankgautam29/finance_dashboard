import Link from "next/link";

const features = [
  {
    title: "Dashboard",
    desc: "KPIs, monthly trends, category charts, and budget alerts",
    href: "/dashboard",
    accent: "from-emerald-500/20 to-transparent border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  {
    title: "Records",
    desc: "Search, filter, paginate, and export transactions as CSV",
    href: "/records",
    accent: "from-blue-500/20 to-transparent border-blue-500/20",
    dot: "bg-blue-400",
  },
  {
    title: "Budgets",
    desc: "Monthly category limits with live spending progress",
    href: "/budgets",
    accent: "from-amber-500/20 to-transparent border-amber-500/20",
    dot: "bg-amber-400",
  },
  {
    title: "Analytics",
    desc: "Transaction explorer with date-range filters",
    href: "/analytics",
    accent: "from-violet-500/20 to-transparent border-violet-500/20",
    dot: "bg-violet-400",
  },
];

export default function HomePage() {
  return (
    <div className="page-shell space-y-10">
      <section className="space-y-4 pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
          Personal finance
        </p>
        <h1 className="page-title max-w-2xl">Your money, one dashboard.</h1>
        <p className="page-subtitle">
          Track income and expenses, set budgets, and explore analytics — with
          role-based access for teams.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/dashboard"
            className="btn-primary inline-flex items-center px-5 py-2.5 text-sm"
          >
            Open dashboard
          </Link>
          <Link
            href="/records"
            className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-white/15 hover:bg-white/8"
          >
            View records
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`card card-interactive group relative overflow-hidden border bg-gradient-to-br ${f.accent}`}
          >
            <span
              className={`mb-3 inline-block h-2 w-2 rounded-full ${f.dot} shadow-[0_0_12px_currentColor] opacity-80`}
            />
            <h2 className="text-lg font-semibold text-white group-hover:text-white">
              {f.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
              {f.desc}
            </p>
            <span className="mt-4 inline-block text-xs font-medium text-zinc-500 transition group-hover:text-emerald-400/90">
              Open →
            </span>
          </Link>
        ))}
      </div>

      <section className="card">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Stack
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Frontend", value: "Next.js 16 · React 19 · Recharts" },
            { label: "Backend", value: "FastAPI · JWT · MongoDB" },
            { label: "Access", value: "Viewer · Analyst · Admin" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/6 bg-black/25 p-4"
            >
              <p className="text-sm font-medium text-zinc-200">{item.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
