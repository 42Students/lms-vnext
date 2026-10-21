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

/** Configuration status only: a configured Telegram notifier is not proof
 * that Telegram accepted or delivered the next alert. Expose this distinction
 * to the operator rather than declaring an unpersisted report successful. */
export function logAlertOperationalStatus(){
 const persistenceReady=logAlertsRuntimeEnabled();
 const notifierConfigured=Boolean(process.env.TELEGRAM_ALERT_BOT_TOKEN &&
  process.env.TELEGRAM_ALERT_CHAT_ID);
 return {
  persistenceReady,
  notifierConfigured,
  cloudPollConfigured:cloudLogPollConfigured(),
  status:!notifierConfigured?"ALERT_DELIVERY_NOT_CONFIGURED" as const:
   !persistenceReady?"PERSISTENCE_NOT_READY" as const:"READY_TO_ATTEMPT" as const,
  deliveryConfirmed:false as const,
 };
}
