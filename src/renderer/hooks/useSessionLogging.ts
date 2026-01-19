import { useState, useCallback } from "react";

interface UseSessionLoggingReturn {
  activeSessionGroupId: string | null;
  loading: boolean;
  error: string | null;
  startSession: (groupId: string, groupName: string) => Promise<boolean>;
  stopSession: (groupId: string) => Promise<boolean>;
  isSessionActive: (groupId: string) => boolean;
}

export function useSessionLogging(): UseSessionLoggingReturn {
  const [activeSessionGroupId, setActiveSessionGroupId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(
    async (groupId: string, groupName: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      if (!window.api) {
        setError("API not available");
        setLoading(false);
        return false;
      }
      try {
        const response = await window.api.logging.startSession(
          groupId,
          groupName,
        );
        if (response.success) {
          setActiveSessionGroupId(groupId);
          return true;
        }
        setError(response.error || "Failed to start session");
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

  const stopSession = useCallback(async (groupId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.logging.stopSession(groupId);
      if (response.success) {
        setActiveSessionGroupId(null);
        return true;
      }
      setError(response.error || "Failed to stop session");
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const isSessionActive = useCallback(
    (groupId: string): boolean => {
      return activeSessionGroupId === groupId;
    },
    [activeSessionGroupId],
  );

  return {
    activeSessionGroupId,
    loading,
    error,
    startSession,
    stopSession,
    isSessionActive,
  };
}
