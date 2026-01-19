interface LoadingProps {
  size?: "small" | "medium" | "large";
  message?: string;
  className?: string;
}

export function Loading({
  size = "medium",
  message,
  className = "",
}: LoadingProps) {
  const sizeClass = {
    small: "loading-small",
    medium: "",
    large: "loading-large",
  }[size];

  return (
    <div className={`loading ${sizeClass} ${className}`}>
      <span className="material-icons loading-spinner">sync</span>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="loading-overlay">
      <Loading size="large" message={message} />
    </div>
  );
}

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: "text" | "rectangular" | "circular";
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = "1em",
  variant = "text",
  className = "",
}: SkeletonProps) {
  const style = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  const variantClass = {
    text: "skeleton-text",
    rectangular: "skeleton-rectangular",
    circular: "skeleton-circular",
  }[variant];

  return (
    <div className={`skeleton ${variantClass} ${className}`} style={style} />
  );
}
