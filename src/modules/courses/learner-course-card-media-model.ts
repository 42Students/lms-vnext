/** Show only a persisted, HTTPS-authored thumbnail after the verified display gate.
 * The bundled fallback is always available with no database or remote dependency. */
export function learnerCourseCardMedia(value: string | null | undefined) {
  if (value) {
    try {
      const parsed = new URL(value);
      if (parsed.protocol === "https:" && parsed.hostname && !parsed.username && !parsed.password) {
        return { src: parsed.href, source: "AUTHORED" as const };
      }
    } catch {
      // Untrusted or legacy malformed URLs never reach the rendered image.
    }
  }
  return { src: "/assets/images/common/course.svg", source: "FALLBACK" as const };
}

/** Kept for older course cards that do not read authored display records. */
export function learnerCourseFallbackMedia() {
  return learnerCourseCardMedia(null);
}
