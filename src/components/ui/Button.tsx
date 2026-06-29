type Variant = "default" | "primary" | "success" | "warning" | "danger";

const styles: Record<Variant, string> = {
  default:
    "bg-white/8 border border-white/10 text-zinc-200 hover:bg-white/12 hover:border-white/15",
  primary:
    "bg-white text-zinc-950 hover:bg-zinc-100 shadow-sm shadow-black/30",
  success: "bg-emerald-600/90 text-white hover:bg-emerald-500 border border-emerald-500/30",
  warning: "bg-amber-500/90 text-zinc-950 hover:bg-amber-400 border border-amber-400/30",
  danger: "bg-red-600/90 text-white hover:bg-red-500 border border-red-500/30",
};

export function Button({
  children,
  onClick,
  variant = "default",
  disabled,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: Variant;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
