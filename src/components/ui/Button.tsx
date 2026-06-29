type Variant = "default" | "primary" | "success" | "warning" | "danger";

const styles: Record<Variant, string> = {
  default: "bg-gray-700 hover:bg-gray-600 text-white",
  primary: "bg-white text-black hover:bg-gray-200",
  success: "bg-green-600 hover:bg-green-700 text-white",
  warning: "bg-yellow-500 text-black hover:bg-yellow-600",
  danger: "bg-red-600 hover:bg-red-700 text-white",
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
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
