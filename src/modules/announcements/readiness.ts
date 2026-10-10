export function announcementsRuntimeEnabled() {
  return process.env.DB10_ANNOUNCEMENTS_READY === "DB10_VERIFIED";
}
