export function trackerAdminRuntimeEnabled() {
  return process.env.DB10_TRACKER_READY === "DB10_VERIFIED";
}
