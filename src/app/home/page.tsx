import Link from "next/link";

const features = [
  {
    title: "Dashboard",
    desc: "KPIs, monthly trends, category pie charts, and budget alerts",
    href: "/dashboard",
    color: "bg-blue-600/20 border-blue-500/30 text-blue-300",
  },
  {
    title: "Records",
    desc: "Search, filter, paginate, and export transactions as CSV",
    href: "/records",
    color: "bg-green-600/20 border-green-500/30 text-green-300",
  },
  {
    title: "Budgets",
    desc: "Set monthly category limits and track spending with progress bars",
    href: "/budgets",
    color: "bg-yellow-600/20 border-yellow-500/30 text-yellow-300",
  },
  {
    title: "Analytics",
    desc: "Advanced transaction explorer with date-range filters (analyst+)",
    href: "/analytics",
    color: "bg-purple-600/20 border-purple-500/30 text-purple-300",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 p-6 md:p-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">
          Personal Finance Dashboard
        </h1>
        <p className="max-w-2xl text-gray-400">
          Full-stack app with role-based access, real-time analytics, budget
          tracking, and CSV import/export. Built with Next.js, FastAPI, and
          MongoDB.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`card border transition hover:scale-[1.02] ${f.color}`}
          >
            <h2 className="text-lg font-semibold text-white">{f.title}</h2>
            <p className="mt-1 text-sm text-gray-400">{f.desc}</p>
          </Link>
        ))}
      </div>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Architecture</h2>
        <div className="grid gap-3 text-sm text-gray-400 sm:grid-cols-3">
          <div className="rounded-lg bg-white/5 p-4">
            <p className="font-medium text-white">Frontend</p>
            <p className="mt-1">Next.js 16 · React 19 · Recharts · Tailwind</p>
          </div>
          <div className="rounded-lg bg-white/5 p-4">
            <p className="font-medium text-white">Backend</p>
            <p className="mt-1">FastAPI · JWT cookies · RBAC · MongoDB aggregations</p>
          </div>
          <div className="rounded-lg bg-white/5 p-4">
            <p className="font-medium text-white">Roles</p>
            <p className="mt-1">Viewer (own data) · Analyst (read-all) · Admin (full CRUD)</p>
          </div>
        </div>
      </section>
    </div>
  );
}
