import { cn } from "../../utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({ children, className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "bg-brand-600 hover:bg-brand-700 text-white focus:ring-brand-500": variant === "primary",
          "bg-gray-800 hover:bg-gray-700 text-gray-200 focus:ring-gray-500": variant === "secondary",
          "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500": variant === "danger",
          "hover:bg-gray-800 text-gray-400 hover:text-gray-200": variant === "ghost",
          "border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white bg-transparent": variant === "outline",
        },
        {
          "px-2.5 py-1.5 text-xs": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-6 py-3 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
