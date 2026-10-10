export function courseDisplayRuntimeEnabled() {
  return process.env.DB05_COURSE_DISPLAY_READY === "DB05_VERIFIED";
}
