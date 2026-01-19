import { useState } from "react";
import { AppProvider } from "./context/AppContext";
import { Header } from "./components/layout/Header";
import { TabContent } from "./components/layout/TabContent";
import { GroupConnectivityPage } from "./pages/GroupConnectivityPage";
import { HistoryPage } from "./pages/HistoryPage";
import { DeviceScanPage } from "./pages/DeviceScanPage";
import { DeviceGroupsPage } from "./pages/DeviceGroupsPage";

export type TabId =
  | "group-connectivity"
  | "history"
  | "device-scan"
  | "device-group";

function App() {
  const [activeTab, setActiveTab] = useState<TabId>("group-connectivity");

  return (
    <AppProvider>
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container">
        <TabContent id="group-connectivity" activeTab={activeTab}>
          <GroupConnectivityPage />
        </TabContent>
        <TabContent id="history" activeTab={activeTab}>
          <HistoryPage />
        </TabContent>
        <TabContent id="device-scan" activeTab={activeTab}>
          <DeviceScanPage />
        </TabContent>
        <TabContent id="device-group" activeTab={activeTab}>
          <DeviceGroupsPage />
        </TabContent>
      </main>
    </AppProvider>
  );
}

export default App;
