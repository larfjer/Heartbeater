import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "filled" | "outlined" | "text" | "tonal";
type ButtonSize = "small" | "medium" | "large";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: "start" | "end";
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "filled",
  size = "medium",
  icon,
  iconPosition = "start",
  loading = false,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = {
    filled: "md-button",
    outlined: "md-button md-button-outlined",
    text: "md-button md-button-text",
    tonal: "md-button md-button-tonal",
  }[variant];

  const sizeClass = {
    small: "md-button-small",
    medium: "",
    large: "md-button-large",
  }[size];

  const classes = [
    variantClass,
    sizeClass,
    fullWidth ? "button-full-width" : "",
    loading ? "md-button-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && (
        <span className="material-icons md-button-spinner">sync</span>
      )}
      {icon && iconPosition === "start" && !loading && (
        <span className="material-icons">{icon}</span>
      )}
      {children}
      {icon && iconPosition === "end" && !loading && (
        <span className="material-icons">{icon}</span>
      )}
    </button>
  );
}
