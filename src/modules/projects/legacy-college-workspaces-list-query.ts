/** Preserve valid legacy workspace-list filters on the canonical college page.
 * Old ALL and PAUSED choices are intentionally omitted because the current
 * directory does not support them. Avoid sending malformed pagination to
 * a page that otherwise shows a recoverable "Invalid filters" screen.
 */
export function legacyCollegeWorkspacesListHref(
  source: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams();
  const q = source.q;
  if (typeof q === "string" && q.length <= 120 &&
      ![...q].some(char => char.charCodeAt(0) < 32 || char === "<" || char === ">")) {
    params.set("q", q);
  }
  const status = source.status;
  if (typeof status === "string" &&
      ["PLANNED", "ACTIVE", "IN_PROGRESS", "READY", "BLOCKED", "COMPLETED", "ARCHIVED"]
        .includes(status)) {
    params.set("status", status);
  }
  const view = source.view;
  if (view === "cards" || view === "table") params.set("view", view);
  const page = source.page;
  if (typeof page === "string" && /^[1-9][0-9]{0,5}$/.test(page) &&
      Number(page) <= 100000) {
    params.set("page", page);
  }
  const pageSize = source.pageSize;
  if (typeof pageSize === "string" &&
      ["10", "20", "50", "100"].includes(pageSize)) {
    params.set("pageSize", pageSize);
  }
  return "/college/projects" + (params.size ? "?" + params.toString() : "");
}
