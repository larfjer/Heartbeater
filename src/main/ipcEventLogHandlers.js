/**
 * IPC handlers for the Event Logger
 *
 * Exposes event logging and querying functionality to the renderer process
 */

import { ipcMain } from "electron";
import eventLogger, { EventLevel, EventCategory } from "./eventLogger.js";

export default function setupEventLogHandlers() {
  /**
   * Log an event from the renderer process
   */
  ipcMain.handle("events:log", (event, eventData) => {
    try {
      const eventId = eventLogger.log(eventData);
      return { success: true, eventId };
    } catch (error) {
      console.error("Error logging event:", error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Query events by time interval
   */
  ipcMain.handle(
    "events:query-by-time",
    (event, startTime, endTime, filters) => {
      try {
        const events = eventLogger.queryByTimeInterval(
          startTime,
          endTime,
          filters,
        );
        return { success: true, events };
      } catch (error) {
        console.error("Error querying events by time:", error);
        return { success: false, error: error.message };
      }
    },
  );

  /**
   * Query events by group ID
   */
  ipcMain.handle("events:query-by-group", (event, groupId, options) => {
    try {
      const events = eventLogger.queryByGroup(groupId, options);
      return { success: true, events };
    } catch (error) {
      console.error("Error querying events by group:", error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Query events by device ID
   */
  ipcMain.handle("events:query-by-device", (event, deviceId, options) => {
    try {
      const events = eventLogger.queryByDevice(deviceId, options);
      return { success: true, events };
    } catch (error) {
      console.error("Error querying events by device:", error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Get recent events
   */
  ipcMain.handle("events:get-recent", (event, limit, filters) => {
    try {
      const events = eventLogger.getRecentEvents(limit, filters);
      return { success: true, events };
    } catch (error) {
      console.error("Error getting recent events:", error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Get event statistics
   */
  ipcMain.handle(
    "events:get-statistics",
    (event, startTime, endTime, groupId) => {
      try {
        const statistics = eventLogger.getStatistics(
          startTime,
          endTime,
          groupId,
        );
        return { success: true, statistics };
      } catch (error) {
        console.error("Error getting event statistics:", error);
        return { success: false, error: error.message };
      }
    },
  );

  /**
   * Get time range of available events
   */
  ipcMain.handle("events:get-time-range", () => {
    try {
      const timeRange = eventLogger.getTimeRange();
      return { success: true, timeRange };
    } catch (error) {
      console.error("Error getting event time range:", error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Prune old events
   */
  ipcMain.handle("events:prune", (event, beforeDate) => {
    try {
      const deletedCount = eventLogger.pruneEvents(beforeDate);
      return { success: true, deletedCount };
    } catch (error) {
      console.error("Error pruning events:", error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Get available event levels
   */
  ipcMain.handle("events:get-levels", () => {
    return { success: true, levels: EventLevel };
  });

  /**
   * Get available event categories
   */
  ipcMain.handle("events:get-categories", () => {
    return { success: true, categories: EventCategory };
  });
}
