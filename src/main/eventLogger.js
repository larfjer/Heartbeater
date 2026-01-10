/**
 * Event Logger Module
 *
 * A global, persistent event log for cross-session analysis.
 * Supports:
 * - Time interval lookups (ISO8601 timestamps)
 * - Group identification for events from pingWorker threads and other processes
 * - Cross-session event tracking
 *
 * Event types include: device status changes, group operations, system events, etc.
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { app } from "electron";

/**
 * Event severity levels
 */
export const EventLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
};

/**
 * Event categories for filtering
 */
export const EventCategory = {
  DEVICE: "device",
  GROUP: "group",
  PING: "ping",
  SYSTEM: "system",
  SCAN: "scan",
  USER: "user",
};

class EventLogger {
  constructor() {
    this.db = null;
    this.insertStmt = null;
    this.logsDir = null;
    this.dbPath = null;
  }

  /**
   * Initialize the event logger database
   * Should be called after app is ready
   */
  initialize() {
    if (this.db) return; // Already initialized

    try {
      this.logsDir = path.join(app.getPath("userData"), "logs");

      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }

      // Single global event log database
      this.dbPath = path.join(this.logsDir, "events.db");
      this.db = new Database(this.dbPath);

      // Create events table with comprehensive schema
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TEXT NOT NULL,
          level TEXT NOT NULL,
          category TEXT NOT NULL,
          event_type TEXT NOT NULL,
          message TEXT NOT NULL,
          group_id TEXT,
          group_name TEXT,
          device_id TEXT,
          device_ip TEXT,
          source TEXT,
          session_id TEXT,
          metadata TEXT,
          CONSTRAINT valid_level CHECK (level IN ('debug', 'info', 'warning', 'error', 'critical')),
          CONSTRAINT valid_category CHECK (category IN ('device', 'group', 'ping', 'system', 'scan', 'user'))
        );

        CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
        CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id);
        CREATE INDEX IF NOT EXISTS idx_events_device_id ON events(device_id);
        CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
        CREATE INDEX IF NOT EXISTS idx_events_level ON events(level);
        CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
      `);

      // Prepare insert statement for better performance
      this.insertStmt = this.db.prepare(`
        INSERT INTO events (
          timestamp, level, category, event_type, message,
          group_id, group_name, device_id, device_ip,
          source, session_id, metadata
        ) VALUES (
          @timestamp, @level, @category, @event_type, @message,
          @group_id, @group_name, @device_id, @device_ip,
          @source, @session_id, @metadata
        )
      `);

      console.log(`[EventLogger] Initialized at ${this.dbPath}`);
    } catch (error) {
      console.error(`[EventLogger] Failed to initialize:`, error);
      throw error;
    }
  }

  /**
   * Log an event
   * @param {Object} event - Event data
   * @param {string} event.level - Event severity level (debug, info, warning, error, critical)
   * @param {string} event.category - Event category (device, group, ping, system, scan, user)
   * @param {string} event.eventType - Specific event type (e.g., 'status_change', 'started', 'stopped')
   * @param {string} event.message - Human-readable event message
   * @param {string} [event.groupId] - Associated group ID (for group-initiated events)
   * @param {string} [event.groupName] - Associated group name
   * @param {string} [event.deviceId] - Associated device ID
   * @param {string} [event.deviceIp] - Associated device IP address
   * @param {string} [event.source] - Event source (e.g., 'pingWorker', 'scanner', 'main')
   * @param {string} [event.sessionId] - Session identifier for tracking related events
   * @param {Object} [event.metadata] - Additional event-specific data
   * @returns {number} The inserted event ID
   */
  log(event) {
    if (!this.db) {
      console.warn("[EventLogger] Not initialized, cannot log event");
      return null;
    }

    try {
      const timestamp = new Date().toISOString();

      const result = this.insertStmt.run({
        timestamp,
        level: event.level || EventLevel.INFO,
        category: event.category || EventCategory.SYSTEM,
        event_type: event.eventType || "unknown",
        message: event.message || "",
        group_id: event.groupId || null,
        group_name: event.groupName || null,
        device_id: event.deviceId || null,
        device_ip: event.deviceIp || null,
        source: event.source || null,
        session_id: event.sessionId || null,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      });

      return result.lastInsertRowid;
    } catch (error) {
      console.error("[EventLogger] Failed to log event:", error);
      return null;
    }
  }

  // Convenience methods for different log levels
  debug(category, eventType, message, context = {}) {
    return this.log({
      level: EventLevel.DEBUG,
      category,
      eventType,
      message,
      ...context,
    });
  }

  info(category, eventType, message, context = {}) {
    return this.log({
      level: EventLevel.INFO,
      category,
      eventType,
      message,
      ...context,
    });
  }

  warning(category, eventType, message, context = {}) {
    return this.log({
      level: EventLevel.WARNING,
      category,
      eventType,
      message,
      ...context,
    });
  }

  error(category, eventType, message, context = {}) {
    return this.log({
      level: EventLevel.ERROR,
      category,
      eventType,
      message,
      ...context,
    });
  }

  critical(category, eventType, message, context = {}) {
    return this.log({
      level: EventLevel.CRITICAL,
      category,
      eventType,
      message,
      ...context,
    });
  }

  /**
   * Query events by time interval
   * @param {string} startTime - ISO8601 start timestamp
   * @param {string} endTime - ISO8601 end timestamp
   * @param {Object} [filters] - Optional filters
   * @param {string} [filters.groupId] - Filter by group ID
   * @param {string} [filters.deviceId] - Filter by device ID
   * @param {string} [filters.category] - Filter by category
   * @param {string} [filters.level] - Filter by minimum level
   * @param {string} [filters.eventType] - Filter by event type
   * @param {string} [filters.source] - Filter by source
   * @param {number} [filters.limit] - Maximum number of results
   * @param {number} [filters.offset] - Offset for pagination
   * @returns {Array} Array of events matching the criteria
   */
  queryByTimeInterval(startTime, endTime, filters = {}) {
    if (!this.db) {
      console.warn("[EventLogger] Not initialized, cannot query events");
      return [];
    }

    try {
      let query = `
        SELECT * FROM events
        WHERE timestamp >= @startTime AND timestamp <= @endTime
      `;
      const params = { startTime, endTime };

      if (filters.groupId) {
        query += " AND group_id = @groupId";
        params.groupId = filters.groupId;
      }

      if (filters.deviceId) {
        query += " AND device_id = @deviceId";
        params.deviceId = filters.deviceId;
      }

      if (filters.category) {
        query += " AND category = @category";
        params.category = filters.category;
      }

      if (filters.level) {
        const levels = ["debug", "info", "warning", "error", "critical"];
        const minLevelIndex = levels.indexOf(filters.level);
        if (minLevelIndex >= 0) {
          const validLevels = levels.slice(minLevelIndex);
          query += ` AND level IN (${validLevels.map((l) => `'${l}'`).join(", ")})`;
        }
      }

      if (filters.eventType) {
        query += " AND event_type = @eventType";
        params.eventType = filters.eventType;
      }

      if (filters.source) {
        query += " AND source = @source";
        params.source = filters.source;
      }

      query += " ORDER BY timestamp DESC";

      if (filters.limit) {
        query += " LIMIT @limit";
        params.limit = filters.limit;
      }

      if (filters.offset) {
        query += " OFFSET @offset";
        params.offset = filters.offset;
      }

      const stmt = this.db.prepare(query);
      const rows = stmt.all(params);

      // Parse metadata JSON for each row
      return rows.map((row) => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));
    } catch (error) {
      console.error("[EventLogger] Failed to query events:", error);
      return [];
    }
  }

  /**
   * Query events by group ID
   * @param {string} groupId - Group ID to filter by
   * @param {Object} [options] - Query options
   * @param {number} [options.limit] - Maximum results
   * @param {number} [options.offset] - Offset for pagination
   * @returns {Array} Array of events for the group
   */
  queryByGroup(groupId, options = {}) {
    if (!this.db) return [];

    try {
      let query = `
        SELECT * FROM events
        WHERE group_id = @groupId
        ORDER BY timestamp DESC
      `;
      const params = { groupId };

      if (options.limit) {
        query += " LIMIT @limit";
        params.limit = options.limit;
      }

      if (options.offset) {
        query += " OFFSET @offset";
        params.offset = options.offset;
      }

      const stmt = this.db.prepare(query);
      const rows = stmt.all(params);

      return rows.map((row) => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));
    } catch (error) {
      console.error("[EventLogger] Failed to query by group:", error);
      return [];
    }
  }

  /**
   * Query events by device ID
   * @param {string} deviceId - Device ID to filter by
   * @param {Object} [options] - Query options
   * @returns {Array} Array of events for the device
   */
  queryByDevice(deviceId, options = {}) {
    if (!this.db) return [];

    try {
      let query = `
        SELECT * FROM events
        WHERE device_id = @deviceId
        ORDER BY timestamp DESC
      `;
      const params = { deviceId };

      if (options.limit) {
        query += " LIMIT @limit";
        params.limit = options.limit;
      }

      if (options.offset) {
        query += " OFFSET @offset";
        params.offset = options.offset;
      }

      const stmt = this.db.prepare(query);
      const rows = stmt.all(params);

      return rows.map((row) => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));
    } catch (error) {
      console.error("[EventLogger] Failed to query by device:", error);
      return [];
    }
  }

  /**
   * Get recent events
   * @param {number} [limit=100] - Number of events to retrieve
   * @param {Object} [filters] - Optional filters
   * @returns {Array} Array of recent events
   */
  getRecentEvents(limit = 100, filters = {}) {
    if (!this.db) return [];

    try {
      let query = "SELECT * FROM events WHERE 1=1";
      const params = {};

      if (filters.groupId) {
        query += " AND group_id = @groupId";
        params.groupId = filters.groupId;
      }

      if (filters.category) {
        query += " AND category = @category";
        params.category = filters.category;
      }

      if (filters.level) {
        const levels = ["debug", "info", "warning", "error", "critical"];
        const minLevelIndex = levels.indexOf(filters.level);
        if (minLevelIndex >= 0) {
          const validLevels = levels.slice(minLevelIndex);
          query += ` AND level IN (${validLevels.map((l) => `'${l}'`).join(", ")})`;
        }
      }

      query += " ORDER BY timestamp DESC LIMIT @limit";
      params.limit = limit;

      const stmt = this.db.prepare(query);
      const rows = stmt.all(params);

      return rows.map((row) => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));
    } catch (error) {
      console.error("[EventLogger] Failed to get recent events:", error);
      return [];
    }
  }

  /**
   * Get event statistics for a time period
   * @param {string} startTime - ISO8601 start timestamp
   * @param {string} endTime - ISO8601 end timestamp
   * @param {string} [groupId] - Optional group ID filter
   * @returns {Object} Event statistics
   */
  getStatistics(startTime, endTime, groupId = null) {
    if (!this.db) return null;

    try {
      let whereClause =
        "WHERE timestamp >= @startTime AND timestamp <= @endTime";
      const params = { startTime, endTime };

      if (groupId) {
        whereClause += " AND group_id = @groupId";
        params.groupId = groupId;
      }

      // Total events by level
      const levelStats = this.db
        .prepare(
          `SELECT level, COUNT(*) as count FROM events ${whereClause} GROUP BY level`,
        )
        .all(params);

      // Total events by category
      const categoryStats = this.db
        .prepare(
          `SELECT category, COUNT(*) as count FROM events ${whereClause} GROUP BY category`,
        )
        .all(params);

      // Total events by event type
      const typeStats = this.db
        .prepare(
          `SELECT event_type, COUNT(*) as count FROM events ${whereClause} GROUP BY event_type ORDER BY count DESC LIMIT 20`,
        )
        .all(params);

      // Total count
      const totalCount = this.db
        .prepare(`SELECT COUNT(*) as count FROM events ${whereClause}`)
        .get(params);

      return {
        total: totalCount?.count || 0,
        byLevel: Object.fromEntries(levelStats.map((r) => [r.level, r.count])),
        byCategory: Object.fromEntries(
          categoryStats.map((r) => [r.category, r.count]),
        ),
        topEventTypes: typeStats,
      };
    } catch (error) {
      console.error("[EventLogger] Failed to get statistics:", error);
      return null;
    }
  }

  /**
   * Get the time range of available events
   * @returns {Object} Object with earliest and latest timestamps
   */
  getTimeRange() {
    if (!this.db) return null;

    try {
      const result = this.db
        .prepare(
          `SELECT MIN(timestamp) as earliest, MAX(timestamp) as latest FROM events`,
        )
        .get();

      return result;
    } catch (error) {
      console.error("[EventLogger] Failed to get time range:", error);
      return null;
    }
  }

  /**
   * Delete events older than a specified date
   * @param {string} beforeDate - ISO8601 timestamp, events before this will be deleted
   * @returns {number} Number of deleted events
   */
  pruneEvents(beforeDate) {
    if (!this.db) return 0;

    try {
      const result = this.db
        .prepare("DELETE FROM events WHERE timestamp < @beforeDate")
        .run({ beforeDate });

      console.log(
        `[EventLogger] Pruned ${result.changes} events before ${beforeDate}`,
      );
      return result.changes;
    } catch (error) {
      console.error("[EventLogger] Failed to prune events:", error);
      return 0;
    }
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      try {
        this.db.close();
        console.log("[EventLogger] Database closed");
      } catch (error) {
        console.error("[EventLogger] Error closing database:", error);
      }
      this.db = null;
      this.insertStmt = null;
    }
  }
}

// Export a singleton instance
const eventLogger = new EventLogger();
export default eventLogger;

// Also export the class for testing purposes
export { EventLogger };
