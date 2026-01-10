import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { app } from "electron";

class SessionLogger {
  constructor() {
    this.activeSessions = new Map(); // groupId -> { db, insertStmt, filename }
    this.logsDir = null;
  }

  _ensureLogsDir() {
    if (this.logsDir) return this.logsDir;

    this.logsDir = path.join(app.getPath("userData"), "logs");
    console.log(`[SessionLogger] Initializing logs directory: ${this.logsDir}`);

    if (!fs.existsSync(this.logsDir)) {
      try {
        fs.mkdirSync(this.logsDir, { recursive: true });
        console.log(`[SessionLogger] Created logs directory`);
      } catch (err) {
        console.error(`[SessionLogger] Failed to create logs directory:`, err);
      }
    }
    return this.logsDir;
  }

  startSession(groupId) {
    try {
      const logsDir = this._ensureLogsDir();

      // Close existing session for this group if exists
      this.stopSession(groupId);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `session_${groupId}_${timestamp}.db`;
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
}

export default new SessionLogger();
