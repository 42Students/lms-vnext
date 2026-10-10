import { z } from "zod";

const takeaway = z.string().trim().min(1).max(500);

export const updateCourseDisplayContentSchema =
  z.object({
    introductionText: z.string().trim().max(500).nullable(),
    bodyHtml: z.string().trim().max(20000).nullable(),
    takeaways: z.array(takeaway).max(30).transform((items) => {
      const seen = new Set<string>();
      return items.filter((item) => {
        const key = item.toLocaleLowerCase("en");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }),
    thumbnailUrl: z.string().trim().url().refine(
      (value) => new URL(value).protocol === "https:",
      "Thumbnail URL must use https",
    ).nullable(),
    expectedVersion: z.number().int().min(0).nullable(),
  });

export type UpdateCourseDisplayContentInput =
  z.infer<typeof updateCourseDisplayContentSchema>;

const allowedTags = new Set([
  "p", "div", "span", "strong", "em", "u", "s",
  "ul", "ol", "li", "br", "h1", "h2", "h3", "h4",
  "blockquote", "code", "pre", "table", "thead", "tbody",
  "tr", "td", "th",
]);

function escapeHtmlText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * Strict rich-text normalizer.
 * All text is escaped. Only known formatting tags are reconstructed and all
 * attributes are removed, making handlers/URLs/styles/SVG/unknown tags inert.
 */
export function sanitizeCourseDisplayHtml(raw: string | null) {
  if (!raw) return null;
  const source = raw.trim();
  if (!source) return null;

  let result = "";
  let cursor = 0;
  const tagPattern = /<\/?[A-Za-z][^>]*>/g;

  for (
    let match = tagPattern.exec(source);
    match;
    match = tagPattern.exec(source)
  ) {
    result += escapeHtmlText(source.slice(cursor, match.index));
    const token = match[0];
    const parsed = token.match(
      /^<\s*(\/?)\s*([A-Za-z0-9]+)(?:\s[^>]*)?\s*(\/?)>$/,
    );
    if (!parsed) {
      result += escapeHtmlText(token);
    } else {
      const closing = parsed[1] === "/";
      const tag = parsed[2]!.toLowerCase();
      if (allowedTags.has(tag)) {
        result += tag === "br"
          ? "<br>"
          : closing
            ? `</${tag}>`
            : `<${tag}>`;
      } else {
        result += escapeHtmlText(token);
      }
    }
    cursor = match.index + token.length;
  }

  result += escapeHtmlText(source.slice(cursor));
  return result;
}
