import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { nowIso, parseIso } from "./timeUtils.js";

// Lazy electron app reference; set via initialize(app) to avoid import-time side-effects
let _electronApp = null;

class SessionLogger {
  constructor() {
    this.activeSessions = new Map(); // groupId -> { db, insertStmt, filename }
    this.logsDir = null;
  }

  initialize(appInstance = null) {
    if (appInstance) {
      _electronApp = appInstance;
      this.logsDir = path.join(_electronApp.getPath("userData"), "logs");
      if (!fs.existsSync(this.logsDir)) {
        try {
          fs.mkdirSync(this.logsDir, { recursive: true });
        } catch (error) {
          console.error(
            "[SessionLogger] Failed to create logs directory:",
            error,
          );
        }
      }
      console.log(
        "[SessionLogger] Initialized logs directory: " + this.logsDir,
      );
    }
  }

  _ensureLogsDir() {
    if (this.logsDir) return this.logsDir;

    // Do not attempt to require electron at import time; require initialize(app)
    throw new Error(
      "SessionLogger not initialized: call initialize(app) before using",
    );
  }

  startSession(groupId, groupName) {
    try {
      const logsDir = this._ensureLogsDir();

      // Close existing session for this group if exists
      this.stopSession(groupId);

      // Use centralized ISO timestamp and derive compact sortable label
      const timestamp = nowIso()
        .replace(/[-:]/g, "")
        .replace("T", "-")
        .slice(0, 15);
      const sanitizedGroupName = (groupName || groupId)
        .toString()
        .replace(/[^a-z0-9_\-.]/gi, "_");
      const filename = `timeseries_${sanitizedGroupName}_${timestamp}.db`;
      const dbPath = path.join(logsDir, filename);

      const db = new Database(dbPath);

      // Create table
      db.exec(`
                CREATE TABLE IF NOT EXISTS pings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp_utc TEXT NOT NULL,
                    timestamp_local TEXT NOT NULL,
                    target TEXT NOT NULL,
                    latency_ms INTEGER,
                    status TEXT NOT NULL,
                    jitter_cv REAL
                )
            `);

      // Prepare insert statement for better performance
      const insertStmt = db.prepare(`
                INSERT INTO pings (timestamp_utc, timestamp_local, target, latency_ms, status, jitter_cv)
                VALUES (@timestamp_utc, @timestamp_local, @target, @latency_ms, @status, @jitter_cv)
            `);

      this.activeSessions.set(groupId, { db, insertStmt, filename });
      console.log(
        `[SessionLogger] Started logging for group ${groupId} to ${dbPath}`,
      );
      return filename;
    } catch (error) {
      console.error(
        `[SessionLogger] Failed to start session for group ${groupId}:`,
        error,
      );
      throw error;
    }
  }

  logPing(groupId, data) {
    const session = this.activeSessions.get(groupId);
    if (!session) return; // Logging might be disabled or session ended

    try {
      session.insertStmt.run({
        timestamp_utc: data.timestamp_utc,
        timestamp_local: data.timestamp_local,
        target: data.target,
        latency_ms: data.latency_ms,
        status: data.status || "unknown",
        jitter_cv: data.jitter_cv || null,
      });
    } catch (error) {
      console.error(
        `[SessionLogger] Error writing to log for group ${groupId}:`,
        error,
      );
    }
  }

  stopSession(groupId) {
    const session = this.activeSessions.get(groupId);
    if (session) {
      try {
        session.db.close();
        console.log(`[SessionLogger] Closed session for group ${groupId}`);
      } catch (error) {
        console.error(
          `[SessionLogger] Error closing session for group ${groupId}:`,
          error,
        );
      }
      this.activeSessions.delete(groupId);
    }
  }

  getAvailableSessions(groupName) {
    try {
      const logsDir = this._ensureLogsDir();
      const files = fs.readdirSync(logsDir);
      const sanitizedGroupName = (groupName || "")
        .toString()
        .replace(/[^a-z0-9_\-.]/gi, "_");
      const prefix = `timeseries_${sanitizedGroupName}_`;

      console.log("prefix: ", prefix);
      return files
        .filter((file) => file.startsWith(prefix) && file.endsWith(".db"))
        .map((file) => {
          const timestampStr = file.replace(prefix, "").replace(".db", "");

          // Calculate duration from database
          let durationSeconds = 0;
          try {
            const dbPath = path.join(logsDir, file);
            const db = new Database(dbPath, { readonly: true });
            const firstRow = db
              .prepare(
                "SELECT timestamp_utc FROM pings ORDER BY id ASC LIMIT 1",
              )
              .get();
            const lastRow = db
              .prepare(
                "SELECT timestamp_utc FROM pings ORDER BY id DESC LIMIT 1",
              )
              .get();
            db.close();

            if (firstRow && lastRow) {
              const startTime =
                parseIso(firstRow.timestamp_utc)?.getTime() || 0;
              const endTime = parseIso(lastRow.timestamp_utc)?.getTime() || 0;
              durationSeconds = Math.floor((endTime - startTime) / 1000);
            }
          } catch (e) {
            console.error(
              `[SessionLogger] Error calculating duration for ${file}:`,
              e,
            );
          }

          return {
            filename: file,
            timestamp: timestampStr,
            durationSeconds: durationSeconds,
          };
        })
        .sort((a, b) => b.filename.localeCompare(a.filename)); // Newest first
    } catch (error) {
      console.error(`[SessionLogger] Error listing sessions:`, error);
      return [];
    }
  }

  getSessionData(filename) {
    try {
      const logsDir = this._ensureLogsDir();
      const dbPath = path.join(logsDir, filename);

      if (!fs.existsSync(dbPath)) {
        throw new Error("Session file not found");
      }

      const db = new Database(dbPath, { readonly: true });
      const pings = db.prepare("SELECT * FROM pings ORDER BY id ASC").all();
      db.close();
      return pings;
    } catch (error) {
      console.error(`[SessionLogger] Error reading session data:`, error);
      throw error;
    }
  }
}

export default new SessionLogger();
