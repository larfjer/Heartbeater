interface IconProps {
  name: string;
  size?: "small" | "medium" | "large";
  className?: string;
}

export function Icon({ name, size = "medium", className = "" }: IconProps) {
  const sizeClass = {
    small: "md-icon-small",
    medium: "",
    large: "md-icon-large",
  }[size];

  return (
    <span className={`material-icons ${sizeClass} ${className}`}>{name}</span>
  );
}

// Common icon presets
export const Icons = {
  // Navigation
  menu: "menu",
  close: "close",
  back: "arrow_back",
  forward: "arrow_forward",
  expand: "expand_more",
  collapse: "expand_less",

  // Actions
  add: "add",
  edit: "edit",
  delete: "delete",
  save: "save",
  refresh: "refresh",
  search: "search",
  filter: "filter_list",
  sort: "sort",

  // Status
  check: "check",
  error: "error",
  warning: "warning",
  info: "info",
  success: "check_circle",
  pending: "pending",

  // Connectivity
  online: "wifi",
  offline: "wifi_off",
  signal: "signal_cellular_alt",
  network: "hub",
  radar: "radar",

  // Devices
  device: "devices",
  computer: "computer",
  phone: "phone_android",
  router: "router",

  // Groups
  group: "group",
  folder: "folder",

  // Time/History
  history: "history",
  schedule: "schedule",
  timer: "timer",

  // Charts
  chart: "show_chart",
  analytics: "analytics",

  // App specific
  heartbeat: "monitor_heart",
  ping: "network_ping",
  latency: "speed",
  jitter: "graphic_eq",
} as const;
