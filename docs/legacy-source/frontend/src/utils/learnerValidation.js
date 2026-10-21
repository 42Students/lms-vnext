/**
 * Learner module — input and route param validation.
 * Reject invalid values before calling APIs.
 */

/**
 * Valid numeric ID (positive integer string or number).
 * Strict: rejects trailing garbage like "123abc".
 * @param {*} jobId - From router.query.jobId
 * @returns {{ valid: boolean, value?: number }}
 */
export function validateJobId(jobId) {
  if (jobId == null || jobId === "") return { valid: false };
  const str = String(jobId).trim();
  if (!/^\d+$/.test(str)) return { valid: false };
  const n = Number(str);
  if (!Number.isFinite(n) || n < 1 || n !== Math.floor(n)) return { valid: false };
  return { valid: true, value: n };
}

/**
 * Valid course identifier: numeric ID or slug (e.g. crs-xxx).
 * Enforces safe slug pattern for non-numeric IDs.
 * @param {*} courseId - From router.query.courseId
 */
export function validateCourseId(courseId) {
  if (courseId == null || courseId === "") return { valid: false };
  if (typeof courseId !== "string") return { valid: false };
  const trimmed = courseId.trim();
  if (!trimmed) return { valid: false };
  // Strict numeric check
  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    if (n > 0) return { valid: true, value: n, isSlug: false };
    return { valid: false };
  }
  // Slug: allow alphanumeric, hyphens, underscores only
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: true, value: trimmed, isSlug: true };
  }
  return { valid: false };
}

/**
 * Ensure value is a finite positive number for IDs.
 * Returns null for 0, negative, or non-numeric values.
 */
export function safeId(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}
