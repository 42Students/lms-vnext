/** Avoid rendering another course's title while the requested route is bootstrapping. */
export function matchesSelectedCourseRoute(selectedCourse, routeIdentifier) {
  if (!selectedCourse || routeIdentifier == null) return false;
  const route = String(routeIdentifier);
  if (!route || route === "undefined") return false;
  const candidates = [selectedCourse.slug, selectedCourse.id];
  return candidates.some((value) => value != null && String(value) === route);
}

/** Browser-side role boundary for the shared Faculty/Learner course layout. */
export function canDisplayCourseContext(userType, loggedIn, routeRoot) {
  if (!loggedIn) return false;
  if (routeRoot === "teacher") return userType === "FACULTY";
  if (routeRoot === "learn") return userType === "LEARNER";
  return true; // Other course workspaces retain their own role/route policy.
}
