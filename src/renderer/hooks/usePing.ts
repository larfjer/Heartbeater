import { useState, useEffect, useCallback, useRef } from "react";
import type {
  PingStatus,
  PingMetrics,
  PingConfig,
  PingAvailabilityEvent,
  PingStatusUpdate,
} from "@/types/api";

interface DevicePingState {
  status: PingStatus | null;
  metrics: PingMetrics | null;
  lastEvent: PingAvailabilityEvent | null;
}

interface UsePingReturn {
  deviceStates: Map<string, DevicePingState>;
  activePingCount: number;
  loading: boolean;
  error: string | null;
  startPing: (
    deviceId: string,
    ip: string,
    intervalMs: number,
    config?: PingConfig,
  ) => Promise<boolean>;
  stopPing: (deviceId: string) => Promise<boolean>;
  stopAllPings: () => Promise<boolean>;
  getDeviceStatus: (deviceId: string) => DevicePingState | undefined;
  refreshStatus: (deviceId: string) => Promise<void>;
}

export function usePing(): UsePingReturn {
  const [deviceStates, setDeviceStates] = useState<
    Map<string, DevicePingState>
  >(new Map());
  const [activePingCount, setActivePingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Set up IPC event listeners
  useEffect(() => {
    mountedRef.current = true;

    // Handle availability changed events
    const handleAvailabilityChanged = (event: PingAvailabilityEvent) => {
      if (!mountedRef.current) return;

      setDeviceStates((prev) => {
        const newMap = new Map(prev);
        const currentState = newMap.get(event.deviceId) || {
          status: null,
          metrics: null,
          lastEvent: null,
        };
        newMap.set(event.deviceId, {
          ...currentState,
          lastEvent: event,
        });
        return newMap;
      });
    };

    // Handle status updated events
    const handleStatusUpdated = (event: PingStatusUpdate) => {
      if (!mountedRef.current) return;

      setDeviceStates((prev) => {
        const newMap = new Map(prev);
        const currentState = newMap.get(event.deviceId) || {
          status: null,
          metrics: null,
          lastEvent: null,
        };
        newMap.set(event.deviceId, {
          ...currentState,
          metrics: event.metrics,
        });
        return newMap;
      });
    };

    // Subscribe to events
    if (!window.api) {
      return;
    }
    window.api.ping.onAvailabilityChanged(handleAvailabilityChanged);
    window.api.ping.onStatusUpdated(handleStatusUpdated);

    // Load initial active ping count
    const loadActivePings = async () => {
      try {
        const response = await window.api.ping.getActivePingCount();
        if (response.success && response.data) {
          setActivePingCount(response.data.count);
        }
      } catch {
        // Ignore errors on initial load
      }
    };
    loadActivePings();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const startPing = useCallback(
    async (
      deviceId: string,
      ip: string,
      intervalMs: number,
      config?: PingConfig,
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const response = await window.api.ping.start(
          deviceId,
          ip,
          intervalMs,
          config,
        );
        if (response.success) {
          // Update device state
          setDeviceStates((prev) => {
            const newMap = new Map(prev);
            newMap.set(deviceId, {
              status: { isRunning: true, deviceId, ip, intervalMs },
              metrics: null,
              lastEvent: null,
            });
            return newMap;
          });
          setActivePingCount((prev) => prev + 1);
          return true;
        }
        setError(response.error || "Failed to start ping");
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const stopPing = useCallback(async (deviceId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.ping.stop(deviceId);
      if (response.success) {
        setDeviceStates((prev) => {
          const newMap = new Map(prev);
          const currentState = newMap.get(deviceId);
          if (currentState) {
            newMap.set(deviceId, {
              ...currentState,
              status: { ...currentState.status!, isRunning: false },
            });
          }
          return newMap;
        });
        setActivePingCount((prev) => Math.max(0, prev - 1));
        return true;
      }
      setError(response.error || "Failed to stop ping");
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const stopAllPings = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.ping.stopAll();
      if (response.success) {
        setDeviceStates((prev) => {
          const newMap = new Map(prev);
          for (const [deviceId, state] of newMap) {
            if (state.status?.isRunning) {
              newMap.set(deviceId, {
                ...state,
                status: { ...state.status, isRunning: false },
              });
            }
          }
          return newMap;
        });
        setActivePingCount(0);
        return true;
      }
      setError(response.error || "Failed to stop all pings");
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDeviceStatus = useCallback(
    (deviceId: string): DevicePingState | undefined => {
      return deviceStates.get(deviceId);
    },
    [deviceStates],
  );

  const refreshStatus = useCallback(async (deviceId: string): Promise<void> => {
    try {
      const [statusResponse, metricsResponse] = await Promise.all([
        window.api.ping.getDetailedStatus(deviceId),
        window.api.ping.getStatusMetrics(deviceId),
      ]);

      setDeviceStates((prev) => {
        const newMap = new Map(prev);
        const currentState = newMap.get(deviceId) || {
          status: null,
          metrics: null,
          lastEvent: null,
        };
        newMap.set(deviceId, {
          ...currentState,
          status: statusResponse.success
            ? statusResponse.data || null
            : currentState.status,
          metrics: metricsResponse.success
            ? metricsResponse.data || null
            : currentState.metrics,
        });
        return newMap;
      });
    } catch {
      // Ignore refresh errors
    }
  }, []);

  return {
    deviceStates,
    activePingCount,
    loading,
    error,
    startPing,
    stopPing,
    stopAllPings,
    getDeviceStatus,
    refreshStatus,
  };
}
