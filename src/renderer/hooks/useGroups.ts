import { useState, useEffect, useCallback } from "react";
import type {
  Group,
  Device,
  GroupsResponse,
  DevicesResponse,
  ApiResponse,
} from "@/types/api";

interface UseGroupsReturn {
  groups: Group[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createGroup: (name: string, description?: string) => Promise<string | null>;
  updateGroup: (
    groupId: string,
    name: string,
    description?: string,
  ) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  getGroup: (groupId: string) => Promise<Group | null>;
  getDevicesInGroup: (groupId: string) => Promise<Device[]>;
  getGroupsForDevice: (deviceId: string) => Promise<Group[]>;
  addDeviceToGroup: (deviceId: string, groupId: string) => Promise<boolean>;
  removeDeviceFromGroup: (
    deviceId: string,
    groupId: string,
  ) => Promise<boolean>;
}

export function useGroups(): UseGroupsReturn {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!window.api) {
      setError("API not available");
      setLoading(false);
      return;
    }
    try {
      const response: GroupsResponse = await window.api.storage.getAllGroups();
      if (response.success && response.groups) {
        setGroups(response.groups);
      } else {
        setError(response.error || "Failed to fetch groups");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createGroup = useCallback(
    async (name: string, description?: string): Promise<string | null> => {
      try {
        const response: ApiResponse<{ id: string }> =
          await window.api.storage.createGroup(name, description);
        if (response.success && response.data) {
          await refresh();
          return response.data.id;
        }
        setError(response.error || "Failed to create group");
        return null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [refresh],
  );

  const updateGroup = useCallback(
    async (
      groupId: string,
      name: string,
      description?: string,
    ): Promise<boolean> => {
      try {
        const response = await window.api.storage.updateGroup(
          groupId,
          name,
          description,
        );
        if (response.success) {
          await refresh();
          return true;
        }
        setError(response.error || "Failed to update group");
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      }
    },
    [refresh],
  );

  const deleteGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      try {
        const response = await window.api.storage.deleteGroup(groupId);
        if (response.success) {
          await refresh();
          return true;
        }
        setError(response.error || "Failed to delete group");
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      }
    },
    [refresh],
  );

  const getGroup = useCallback(
    async (groupId: string): Promise<Group | null> => {
      try {
        const response = await window.api.storage.getGroup(groupId);
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      } catch {
        return null;
      }
    },
    [],
  );

  const getDevicesInGroup = useCallback(
    async (groupId: string): Promise<Device[]> => {
      try {
        const response: DevicesResponse =
          await window.api.storage.getDevicesInGroup(groupId);
        if (response.success && response.devices) {
          return response.devices;
        }
        return [];
      } catch {
        return [];
      }
    },
    [],
  );

  const getGroupsForDevice = useCallback(
    async (deviceId: string): Promise<Group[]> => {
      try {
        const response: GroupsResponse =
          await window.api.storage.getGroupsForDevice(deviceId);
        if (response.success && response.groups) {
          return response.groups;
        }
        return [];
      } catch {
        return [];
      }
    },
    [],
  );

  const addDeviceToGroup = useCallback(
    async (deviceId: string, groupId: string): Promise<boolean> => {
      try {
        const response = await window.api.storage.addDeviceToGroup(
          deviceId,
          groupId,
        );
        if (response.success) {
          await refresh();
          return true;
        }
        setError(response.error || "Failed to add device to group");
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      }
    },
    [refresh],
  );

  const removeDeviceFromGroup = useCallback(
    async (deviceId: string, groupId: string): Promise<boolean> => {
      try {
        const response = await window.api.storage.removeDeviceFromGroup(
          deviceId,
          groupId,
        );
        if (response.success) {
          await refresh();
          return true;
        }
        setError(response.error || "Failed to remove device from group");
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      }
    },
    [refresh],
  );

  return {
    groups,
    loading,
    error,
    refresh,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroup,
    getDevicesInGroup,
    getGroupsForDevice,
    addDeviceToGroup,
    removeDeviceFromGroup,
  };
}
