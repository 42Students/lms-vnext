/** No DB10 log-alert SQL may execute before W01 registers/replays all draft tables. */
export function logAlertsRuntimeEnabled() {
  return process.env.DB10_LOG_ALERTS_READY === "DB10_VERIFIED";
}
