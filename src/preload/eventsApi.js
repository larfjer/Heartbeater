/**
 * Event Logger API for Preload
 *
 * Provides type-safe access to the event logging system from the renderer process.
 * Events are stored globally and support cross-session analysis.
 */

const { ipcRenderer } = require("electron");

/**
 * Event severity levels
 */
const EventLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
};

/**
 * Event categories for filtering
 */
const EventCategory = {
  DEVICE: "device",
  GROUP: "group",
  PING: "ping",
  SYSTEM: "system",
  SCAN: "scan",
  USER: "user",
};

const eventsApi = {
  /**
   * Log an event
   * @param {Object} eventData - Event data
   * @param {string} eventData.level - Event severity (debug, info, warning, error, critical)
   * @param {string} eventData.category - Event category (device, group, ping, system, scan, user)
   * @param {string} eventData.eventType - Specific event type
   * @param {string} eventData.message - Human-readable message
   * @param {string} [eventData.groupId] - Associated group ID
   * @param {string} [eventData.groupName] - Associated group name
   * @param {string} [eventData.deviceId] - Associated device ID
   * @param {string} [eventData.deviceIp] - Associated device IP
   * @param {string} [eventData.source] - Event source identifier
   * @param {string} [eventData.sessionId] - Session identifier
   * @param {Object} [eventData.metadata] - Additional event data
   */
  log: (eventData) => ipcRenderer.invoke("events:log", eventData),

  /**
   * Query events by time interval
   * @param {string} startTime - ISO8601 start timestamp
   * @param {string} endTime - ISO8601 end timestamp
   * @param {Object} [filters] - Optional filters (groupId, deviceId, category, level, eventType, source, limit, offset)
   */
  queryByTime: (startTime, endTime, filters) =>
    ipcRenderer.invoke("events:query-by-time", startTime, endTime, filters),

  /**
   * Query events by group ID
   * @param {string} groupId - Group ID to filter by
   * @param {Object} [options] - Query options (limit, offset)
   */
  queryByGroup: (groupId, options) =>
    ipcRenderer.invoke("events:query-by-group", groupId, options),

  /**
   * Query events by device ID
   * @param {string} deviceId - Device ID to filter by
   * @param {Object} [options] - Query options (limit, offset)
   */
  queryByDevice: (deviceId, options) =>
    ipcRenderer.invoke("events:query-by-device", deviceId, options),

  /**
   * Get recent events
   * @param {number} [limit=100] - Number of events to retrieve
   * @param {Object} [filters] - Optional filters (groupId, category, level)
   */
  getRecent: (limit, filters) =>
    ipcRenderer.invoke("events:get-recent", limit, filters),

  /**
   * Get event statistics for a time period
   * @param {string} startTime - ISO8601 start timestamp
   * @param {string} endTime - ISO8601 end timestamp
   * @param {string} [groupId] - Optional group ID filter
   */
  getStatistics: (startTime, endTime, groupId) =>
    ipcRenderer.invoke("events:get-statistics", startTime, endTime, groupId),

  /**
   * Get the time range of available events
   * @returns {Promise<{earliest: string, latest: string}>}
   */
  getTimeRange: () => ipcRenderer.invoke("events:get-time-range"),

  /**
   * Delete events older than a specified date
   * @param {string} beforeDate - ISO8601 timestamp
   */
  prune: (beforeDate) => ipcRenderer.invoke("events:prune", beforeDate),

  /**
   * Get available event levels
   */
  getLevels: () => ipcRenderer.invoke("events:get-levels"),

  /**
   * Get available event categories
   */
  getCategories: () => ipcRenderer.invoke("events:get-categories"),
};

module.exports = {
  eventsApi,
  EventLevel,
  EventCategory,
};
