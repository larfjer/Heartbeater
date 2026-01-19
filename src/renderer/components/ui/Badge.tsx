import type { ReactNode } from "react";

type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "subtle";
type BadgeSize = "small" | "medium";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: string;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = "neutral",
  size = "medium",
  icon,
  children,
  className = "",
}: BadgeProps) {
  const variantClass = {
    success: "badge badge-success",
    warning: "badge badge-warning",
    error: "badge badge-error",
    info: "badge badge-info",
    neutral: "badge",
    subtle: "badge badge-subtle",
  }[variant];

  const sizeClass = {
    small: "badge-small",
    medium: "",
  }[size];

  const classes = [variantClass, sizeClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {icon && <span className="material-icons badge-icon">{icon}</span>}
      {children}
    </span>
  );
}

// Status-specific badges
interface StatusBadgeProps {
  online: boolean;
  className?: string;
}

export function StatusBadge({ online, className = "" }: StatusBadgeProps) {
  return (
    <Badge
      variant={online ? "success" : "error"}
      icon={online ? "check_circle" : "cancel"}
      className={className}
    >
      {online ? "Online" : "Offline"}
    </Badge>
  );
}

interface LatencyBadgeProps {
  latency: number;
  threshold?: number;
  className?: string;
}

export function LatencyBadge({
  latency,
  threshold = 100,
  className = "",
}: LatencyBadgeProps) {
  const variant =
    latency <= threshold
      ? "success"
      : latency <= threshold * 2
        ? "warning"
        : "error";
  return (
    <Badge variant={variant} className={className}>
      {latency.toFixed(0)}ms
    </Badge>
  );
}

interface GroupBadgeProps {
  count: number;
  className?: string;
}

export function GroupBadge({ count, className = "" }: GroupBadgeProps) {
  if (count === 0) return null;
  return (
    <Badge variant="info" size="small" className={className}>
      {count} group{count !== 1 ? "s" : ""}
    </Badge>
  );
}
