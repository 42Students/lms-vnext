/** Keep notification filters together when changing the inbox view or category.
 * Cursor fields are intentionally excluded: the next filter starts at newest.
 * Caller must validate any untrusted search/scope parameters before passing them.
 */
export type NotificationPreservedParams = Readonly<
  Partial<Record<"q" | "classId" | "courseId", string>>
>;

export function notificationFilterHref({
  baseHref,
  view,
  category,
  categoryParam = "category",
  preservedParams,
}: {
  baseHref: string;
  view: "all" | "unread";
  category?: string | undefined;
  categoryParam?: "category" | "tab";
  preservedParams?: NotificationPreservedParams | undefined;
}) {
  const params = new URLSearchParams({ view });
  if (category && category !== "all") params.set(categoryParam, category);
  for (const key of ["q", "classId", "courseId"] as const) {
    const value = preservedParams?.[key];
    if (value) params.set(key, value);
  }
  return baseHref + "?" + params.toString();
}
