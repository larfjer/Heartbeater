import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Device, ScannedDevice, PingAvailabilityEvent } from "@/types/api";

// App-wide state interface
interface AppState {
  // Scanned devices from network scan
  currentScannedDevices: ScannedDevice[];
  setCurrentScannedDevices: (devices: ScannedDevice[]) => void;

  // Device selection for group modal
  selectedDeviceForGroup: Device | null;
  setSelectedDeviceForGroup: (device: Device | null) => void;

  // Group selection state (for add to group modal)
  selectedGroupIds: Set<string>;
  originalGroupIds: Set<string>;
  setSelectedGroupIds: (ids: Set<string>) => void;
  setOriginalGroupIds: (ids: Set<string>) => void;
  toggleGroupSelection: (groupId: string) => void;
  hasGroupSelectionChanged: () => boolean;

  // Manual device modal state
  selectedGroupIdsForManualDevice: Set<string>;
  setSelectedGroupIdsForManualDevice: (ids: Set<string>) => void;
  toggleGroupSelectionForManualDevice: (groupId: string) => void;

  // Currently selected group for connectivity monitoring
  activeMonitoringGroupId: string | null;
  setActiveMonitoringGroupId: (groupId: string | null) => void;

  // Real-time ping events
  latestPingEvents: Map<string, PingAvailabilityEvent>;
  updatePingEvent: (event: PingAvailabilityEvent) => void;

  // Modal visibility state
  modals: {
    addToGroup: boolean;
    addDeviceManually: boolean;
  };
  openModal: (modalName: "addToGroup" | "addDeviceManually") => void;
  closeModal: (modalName: "addToGroup" | "addDeviceManually") => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Scanned devices
  const [currentScannedDevices, setCurrentScannedDevices] = useState<
    ScannedDevice[]
  >([]);

  // Device selection for group modal
  const [selectedDeviceForGroup, setSelectedDeviceForGroup] =
    useState<Device | null>(null);

  // Group selection state
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    new Set(),
  );
  const [originalGroupIds, setOriginalGroupIds] = useState<Set<string>>(
    new Set(),
  );

  // Manual device modal group selection
  const [selectedGroupIdsForManualDevice, setSelectedGroupIdsForManualDevice] =
    useState<Set<string>>(new Set());

  // Active monitoring group
  const [activeMonitoringGroupId, setActiveMonitoringGroupId] = useState<
    string | null
  >(null);

  // Ping events
  const [latestPingEvents, setLatestPingEvents] = useState<
    Map<string, PingAvailabilityEvent>
  >(new Map());

  // Modal state
  const [modals, setModals] = useState({
    addToGroup: false,
    addDeviceManually: false,
  });

  // Group selection helpers
  const toggleGroupSelection = useCallback((groupId: string) => {
    setSelectedGroupIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  const hasGroupSelectionChanged = useCallback(() => {
    if (selectedGroupIds.size !== originalGroupIds.size) return true;
    for (const id of selectedGroupIds) {
      if (!originalGroupIds.has(id)) return true;
    }
    return false;
  }, [selectedGroupIds, originalGroupIds]);

  const toggleGroupSelectionForManualDevice = useCallback((groupId: string) => {
    setSelectedGroupIdsForManualDevice((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  // Ping event updater
  const updatePingEvent = useCallback((event: PingAvailabilityEvent) => {
    setLatestPingEvents((prev) => {
      const newMap = new Map(prev);
      newMap.set(event.deviceId, event);
      return newMap;
    });
  }, []);

  // Modal helpers
  const openModal = useCallback(
    (modalName: "addToGroup" | "addDeviceManually") => {
      setModals((prev) => ({ ...prev, [modalName]: true }));
    },
    [],
  );

  const closeModal = useCallback(
    (modalName: "addToGroup" | "addDeviceManually") => {
      setModals((prev) => ({ ...prev, [modalName]: false }));
    },
    [],
  );

  const value: AppState = {
    currentScannedDevices,
    setCurrentScannedDevices,
    selectedDeviceForGroup,
    setSelectedDeviceForGroup,
    selectedGroupIds,
    originalGroupIds,
    setSelectedGroupIds,
    setOriginalGroupIds,
    toggleGroupSelection,
    hasGroupSelectionChanged,
    selectedGroupIdsForManualDevice,
    setSelectedGroupIdsForManualDevice,
    toggleGroupSelectionForManualDevice,
    activeMonitoringGroupId,
    setActiveMonitoringGroupId,
    latestPingEvents,
    updatePingEvent,
    modals,
    openModal,
    closeModal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppState {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
