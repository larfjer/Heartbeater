/**
 * Logger utility for application-wide logging with timestamps
 */

export const log = {
  info: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, ...args);
  },
  error: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, ...args);
  },
  debug: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [DEBUG] ${message}`, ...args);
  },
};
