/**
 * Logger utility for application-wide logging with timestamps
 */
import { nowIso } from "./timeUtils.js";
import { formatMessage } from "./loggingUtils.js";

export const log = {
  info: (message, ...args) => {
    const timestamp = nowIso();
    const formatted = formatMessage(message, args[0]);
    console.log(`[${timestamp}] [INFO] ${formatted}`, ...args.slice(1));
  },
  error: (message, ...args) => {
    const timestamp = nowIso();
    const formatted = formatMessage(message, args[0]);
    console.error(`[${timestamp}] [ERROR] ${formatted}`, ...args.slice(1));
  },
  debug: (message, ...args) => {
    const timestamp = nowIso();
    const formatted = formatMessage(message, args[0]);
    console.log(`[${timestamp}] [DEBUG] ${formatted}`, ...args.slice(1));
  },
};
