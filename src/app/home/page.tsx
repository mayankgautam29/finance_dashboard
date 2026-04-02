import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8 text-white">
      <div className="glass mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Home</h1>
        <p className="text-gray-400">
          Track income and expenses from the dashboard or records list.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
          >
            Dashboard
          </Link>
          <Link
            href="/records"
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold hover:bg-gray-700"
          >
            Records
          </Link>
        </div>
      </div>
    </div>
  );
}
