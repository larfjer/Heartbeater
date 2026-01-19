import type { TabId } from "../../App";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: "group-connectivity", label: "Group Connectivity", icon: "hub" },
  { id: "history", label: "History", icon: "history" },
  { id: "device-scan", label: "Device Scan", icon: "radar" },
  { id: "device-group", label: "Device Groups", icon: "group" },
];

interface HeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="app-bar">
      <div className="app-bar-brand">
        <span className="material-icons">monitor_heart</span>
        <h1>Heartbeater</h1>
      </div>
      <nav className="tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onTabChange(tab.id);
              }
            }}
          >
            <span className="material-icons tab-icon">{tab.icon}</span>
            {tab.label}
          </div>
        ))}
      </nav>
    </header>
  );
}
