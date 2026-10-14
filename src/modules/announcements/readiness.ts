export function announcementsRuntimeEnabled() {
  return process.env.DB10_ANNOUNCEMENTS_READY === "DB10_VERIFIED";
}

/** Read request-time visibility from server logic, outside the React render body. */
export function announcementVisibilityEpochMs() {
  return Date.now();
}
