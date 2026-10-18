/** Show only a persisted, HTTPS-authored thumbnail after the verified display gate.
 * The bundled fallback is always available with no database or remote dependency. */
export function learnerCourseCardMedia(value: string | null | undefined) {
  if (value) {
    try {
      const parsed = new URL(value);
      const host=parsed.hostname.toLowerCase();
      const privateHost=host==="localhost"||host.endsWith(".localhost")||
        host==="0.0.0.0"||host==="[::1]"||host==="[::]"||
        /^127\./.test(host)||/^10\./.test(host)||
        /^192\.168\./.test(host)||/^169\.254\./.test(host)||
        /^172\.(?:1[6-9]|2\d|3[01])\./.test(host);
      if (parsed.protocol === "https:" && host && !privateHost &&
          !parsed.username && !parsed.password && !parsed.hash) {
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

/** A failed authored remote image falls back to the trusted bundled asset. */
export function learnerCourseCardMediaAfterError(value:string|null|undefined,loadFailed:boolean){
 return learnerCourseCardMedia(loadFailed ? null : value);
}
