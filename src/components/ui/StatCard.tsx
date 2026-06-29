export function StatCard({
  title,
  value,
  subtitle,
  variant = "default",
}: {
  title: string;
  value: string;
  subtitle?: string;
  variant?: "default" | "income" | "expense" | "balance";
}) {
  const colors = {
    default: "text-white",
    income: "text-green-400",
    expense: "text-red-400",
    balance: "text-blue-400",
  };

  return (
    <div className="card">
      <p className="text-sm text-gray-400">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${colors[variant]}`}>{value}</p>
      {subtitle ? (
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      ) : null}
    </div>
  );
}
