import util from "util";
import { nowIso } from "./timeUtils.js";

export function withLogContext(context = {}) {
  return (level, message, meta = {}) => {
    const timestamp = nowIso();
    const payload = { timestamp, message, ...context, ...meta };
    return { level, payload };
  };
}

export function formatMessage(message, meta = {}) {
  if (typeof message === "string") return message;
  return `${util.inspect(message)} ${JSON.stringify(meta)}`;
}

export default { withLogContext, formatMessage };
