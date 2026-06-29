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

  const accents = {
    default: "",
    income: "stat-card-income",
    expense: "stat-card-expense",
    balance: "stat-card-balance",
  };

  return (
    <div className={`stat-card ${accents[variant]}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {title}
      </p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${colors[variant]}`}>
        {value}
      </p>
      {subtitle ? (
        <p className="mt-1.5 text-xs text-zinc-500">{subtitle}</p>
      ) : null}
    </div>
  );
}
