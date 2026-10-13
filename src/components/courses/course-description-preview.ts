/** Matches the legacy 350-character course overview preview threshold. */
export const COURSE_OVERVIEW_PREVIEW_LENGTH = 350;

/** Only use this with already-sanitized, server-provided overview HTML. */
export function plainCourseDescription(bodyHtml: string) {
  return bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function summarizeCourseDescription(
  text: string,
  limit = COURSE_OVERVIEW_PREVIEW_LENGTH,
) {
  if (text.length <= limit) {
    return { long: false, preview: text };
  }
  return { long: true, preview: `${text.slice(0, limit).trimEnd()}…` };
}
