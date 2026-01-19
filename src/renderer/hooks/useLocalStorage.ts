import { useState, useEffect, useCallback } from "react";

type StorageValue<T> = T | null;

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Update localStorage when value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Setter function that handles both direct values and updater functions
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const newValue = value instanceof Function ? value(prev) : value;
      return newValue;
    });
  }, []);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// Specific hooks for common stored values
export function usePingInterval(): [number, (value: number) => void] {
  const [interval, setInterval] = useLocalStorage<number>("pingInterval", 1000);
  return [interval, setInterval];
}

export function usePingTimeout(): [number, (value: number) => void] {
  const [timeout, setTimeout] = useLocalStorage<number>("pingTimeout", 5000);
  return [timeout, setTimeout];
}

export function useLatencyThreshold(): [number, (value: number) => void] {
  const [threshold, setThreshold] = useLocalStorage<number>(
    "latencyThreshold",
    100,
  );
  return [threshold, setThreshold];
}

export function useJitterThreshold(): [number, (value: number) => void] {
  const [threshold, setThreshold] = useLocalStorage<number>(
    "jitterThreshold",
    50,
  );
  return [threshold, setThreshold];
}

export function useSelectedGroup(): [
  StorageValue<string>,
  (value: StorageValue<string>) => void,
] {
  const [groupId, setGroupId] = useLocalStorage<StorageValue<string>>(
    "selectedGroup",
    null,
  );
  return [groupId, setGroupId];
}
