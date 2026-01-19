import { useState, useCallback } from "react";
import type { Session, SessionData } from "@/types/api";

interface UseHistoryReturn {
  sessions: Session[];
  currentSession: SessionData | null;
  loading: boolean;
  error: string | null;
  loadSessions: (groupName: string) => Promise<void>;
  loadSessionData: (filename: string) => Promise<SessionData | null>;
  clearCurrentSession: () => void;
}

export function useHistory(): UseHistoryReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionData | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async (groupName: string): Promise<void> => {
    setLoading(true);
    setError(null);
    if (!window.api) {
      setError("API not available");
      setLoading(false);
      return;
    }
    try {
      const response = await window.api.history.getSessions(groupName);
      if (response.success && response.sessions) {
        setSessions(response.sessions);
      } else {
        setError(response.error || "Failed to load sessions");
        setSessions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSessionData = useCallback(
    async (filename: string): Promise<SessionData | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await window.api.history.getSessionData(filename);
        if (response.success && response.data) {
          setCurrentSession(response.data);
          return response.data;
        }
        setError(response.error || "Failed to load session data");
        return null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  return {
    sessions,
    currentSession,
    loading,
    error,
    loadSessions,
    loadSessionData,
    clearCurrentSession,
  };
}
