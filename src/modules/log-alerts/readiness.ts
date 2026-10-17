/** No DB10 log-alert SQL may execute before W01 registers/replays all draft tables. */
export function logAlertsRuntimeEnabled() {
  return process.env.DB10_LOG_ALERTS_READY === "DB10_VERIFIED";
}

/** Explicit opt-in only. The operator still must verify IAM and the CronJob. */
export function cloudLogPollConfigured(): boolean {
  return process.env.LOG_ALERT_CLOUD_POLL_ENABLED === "true" &&
    Boolean(process.env.GOOGLE_CLOUD_PROJECT) &&
    Boolean(process.env.LOG_ALERT_K8S_NAMESPACE || !process.env.APP_ENV || process.env.APP_ENV === "development");
}
