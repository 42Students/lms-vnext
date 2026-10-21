/** Fetch and validate a learner's course without accepting a stale/empty API payload. */
export async function loadLearnerCourse(identifier, { getCourseBySlug, getCourse, signal }) {
  if (typeof identifier !== "string" || !identifier.trim()) throw new Error("Invalid course identifier");
  const numeric = /^\d+$/.test(identifier);
  if (numeric && (!Number.isSafeInteger(Number(identifier)) || Number(identifier) <= 0)) {
    throw new Error("Invalid course identifier");
  }
  const response = numeric
    ? await getCourse({ courseId: Number(identifier) }, { signal })
    : await getCourseBySlug(identifier, { signal });
  if (signal?.aborted) throw new Error("Course request canceled");
  const course = response?.data?.data;
  if (!course || typeof course !== "object" || course.id == null) {
    throw new Error("Course not found");
  }
  return { course, numeric };
}

/** Preserve existing query and tab when migrating a legacy numeric course link. */
export function learnerCourseCanonicalHref(asPath, identifier, slug) {
  if (typeof slug !== "string" || !slug.trim()) return null;
  const [pathname, ...query] = String(asPath).split("?");
  const parts = pathname.split("/");
  const index = parts.indexOf(String(identifier));
  if (index < 0) return null;
  parts[index] = encodeURIComponent(slug);
  return parts.join("/") + (query.length ? `?${query.join("?")}` : "");
}
