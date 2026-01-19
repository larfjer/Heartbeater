// Device Types
export interface Device {
  id: string;
  name: string;
  ip: string;
  mac?: string;
  manufacturer?: string;
  friendlyName?: string;
  hostname?: string;
}

export interface ScannedDevice {
  ip: string;
  mac: string;
  name?: string;
  manufacturer?: string;
  hostname?: string;
}

// Group Types
export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroupWithDevices extends Group {
  devices: Device[];
}

// Ping Types
export interface PingConfig {
  timeout?: number;
  retries?: number;
  jitterSamples?: number;
}

export interface PingStatus {
  isRunning: boolean;
  deviceId: string;
  ip?: string;
  intervalMs?: number;
  lastPing?: PingResult;
}

export interface PingResult {
  alive: boolean;
  time?: number;
  packetLoss?: number;
}

export interface PingMetrics {
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  jitter: number;
  packetLoss: number;
  totalPings: number;
  successfulPings: number;
}

export interface PingAvailabilityEvent {
  deviceId: string;
  ip: string;
  alive: boolean;
  time?: number;
  timestamp: string;
}

export interface PingStatusUpdate {
  deviceId: string;
  metrics: PingMetrics;
}

// Session & History Types
export interface Session {
  filename: string;
  groupName: string;
  startTime: string;
  endTime?: string;
}

export interface SessionData {
  groupName: string;
  startTime: string;
  endTime?: string;
  devices: SessionDeviceData[];
}

export interface SessionDeviceData {
  deviceId: string;
  deviceName: string;
  ip: string;
  pings: SessionPingEntry[];
}

export interface SessionPingEntry {
  timestamp: string;
  alive: boolean;
  time?: number;
}

// Event Types
export interface EventData {
  level: "info" | "warn" | "error" | "debug";
  category: string;
  message: string;
  deviceId?: string;
  groupId?: string;
  metadata?: Record<string, unknown>;
}

export interface EventQuery {
  startTime?: string;
  endTime?: string;
  level?: string;
  category?: string;
  deviceId?: string;
  groupId?: string;
  limit?: number;
}

export interface EventStatistics {
  totalEvents: number;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
}

// API Response Types
export interface ApiResponse<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface DevicesResponse extends ApiResponse {
  devices?: Device[];
}

export interface GroupsResponse extends ApiResponse {
  groups?: Group[];
}

export interface SessionsResponse extends ApiResponse {
  sessions?: Session[];
}

export interface ScanResponse extends ApiResponse {
  devices?: ScannedDevice[];
}

// Window API Interface
export interface WindowApi {
  scanNetwork: () => Promise<ScanResponse>;
  scanDeviceDetails: (ip: string) => Promise<ApiResponse<ScannedDevice>>;

  storage: {
    // Devices
    addDevice: (
      device: Omit<Device, "id">,
    ) => Promise<ApiResponse<{ id: string }>>;
    updateDeviceFriendlyName: (
      deviceId: string,
      name: string,
    ) => Promise<ApiResponse>;
    getDevice: (deviceId: string) => Promise<ApiResponse<Device>>;
    getDeviceByMac: (mac: string) => Promise<ApiResponse<Device>>;
    getAllDevices: () => Promise<DevicesResponse>;
    getDeviceDisplayName: (
      deviceId: string,
    ) => Promise<ApiResponse<{ displayName: string }>>;
    removeDevice: (deviceId: string) => Promise<ApiResponse>;

    // Groups
    createGroup: (
      name: string,
      description?: string,
    ) => Promise<ApiResponse<{ id: string }>>;
    updateGroup: (
      groupId: string,
      name: string,
      description?: string,
    ) => Promise<ApiResponse>;
    getGroup: (groupId: string) => Promise<ApiResponse<Group>>;
    getAllGroups: () => Promise<GroupsResponse>;
    deleteGroup: (groupId: string) => Promise<ApiResponse>;

    // Relationships
    addDeviceToGroup: (
      deviceId: string,
      groupId: string,
    ) => Promise<ApiResponse>;
    removeDeviceFromGroup: (
      deviceId: string,
      groupId: string,
    ) => Promise<ApiResponse>;
    getDevicesInGroup: (groupId: string) => Promise<DevicesResponse>;
    getGroupsForDevice: (deviceId: string) => Promise<GroupsResponse>;
  };

  ping: {
    start: (
      deviceId: string,
      ip: string,
      intervalMs: number,
      config?: PingConfig,
    ) => Promise<ApiResponse>;
    stop: (deviceId: string) => Promise<ApiResponse>;
    stopAll: () => Promise<ApiResponse>;
    getStatus: (deviceId: string) => Promise<ApiResponse<PingStatus>>;
    getActivePingCount: () => Promise<ApiResponse<{ count: number }>>;
    getActivePings: () => Promise<ApiResponse<PingStatus[]>>;
    getDetailedStatus: (deviceId: string) => Promise<ApiResponse<PingStatus>>;
    getStatusMetrics: (deviceId: string) => Promise<ApiResponse<PingMetrics>>;
    onAvailabilityChanged: (
      callback: (event: PingAvailabilityEvent) => void,
    ) => void;
    onStatusUpdated: (callback: (event: PingStatusUpdate) => void) => void;
  };

  logging: {
    startSession: (groupId: string, groupName: string) => Promise<ApiResponse>;
    stopSession: (groupId: string) => Promise<ApiResponse>;
  };

  events: {
    log: (eventData: EventData) => Promise<ApiResponse>;
    queryByTime: (
      start: string,
      end: string,
      filters?: Partial<EventQuery>,
    ) => Promise<ApiResponse<EventData[]>>;
    queryByGroup: (
      groupId: string,
      options?: Partial<EventQuery>,
    ) => Promise<ApiResponse<EventData[]>>;
    queryByDevice: (
      deviceId: string,
      options?: Partial<EventQuery>,
    ) => Promise<ApiResponse<EventData[]>>;
    getRecent: (
      limit: number,
      filters?: Partial<EventQuery>,
    ) => Promise<ApiResponse<EventData[]>>;
    getStatistics: (
      start: string,
      end: string,
      groupId?: string,
    ) => Promise<ApiResponse<EventStatistics>>;
    getTimeRange: () => Promise<ApiResponse<{ start: string; end: string }>>;
    prune: (
      beforeDate: string,
    ) => Promise<ApiResponse<{ deletedCount: number }>>;
    getLevels: () => Promise<ApiResponse<string[]>>;
    getCategories: () => Promise<ApiResponse<string[]>>;
  };

  history: {
    getSessions: (groupName: string) => Promise<SessionsResponse>;
    getSessionData: (filename: string) => Promise<ApiResponse<SessionData>>;
  };
}

// Extend Window interface
declare global {
  interface Window {
    api: WindowApi;
  }
}

export {};
