import type { ReactNode } from "react";
import type { TabId } from "../../App";

interface TabContentProps {
  id: TabId;
  activeTab: TabId;
  children: ReactNode;
}

export function TabContent({ id, activeTab, children }: TabContentProps) {
  const isActive = id === activeTab;

  return (
    <div
      id={id}
      className={`tab-content ${isActive ? "active" : ""}`}
      role="tabpanel"
      aria-hidden={!isActive}
    >
      {isActive && children}
    </div>
  );
}
