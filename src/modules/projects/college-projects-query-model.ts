import type { ProjectAdminCollectionQuery } from "@/components/projects/project-admin-collection-controls";

/**
 * College Projects URLs are untrusted: an old tab or pasted link must never
 * cause the workspace index to throw because page, size or status is invalid.
 * Service-side Zod validation remains the authoritative boundary.
 */
export function collegeProjectsQueryFromParams(
  params: Record<string, string | string[] | undefined>,
): ProjectAdminCollectionQuery {
  const first = (key: string): string | undefined => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const positivePage = Number(first("page") ?? "1");
  const page = Number.isSafeInteger(positivePage) && positivePage >= 1 &&
    positivePage <= 10_000 ? positivePage : 1;
  const size = Number(first("pageSize") ?? "25");
  const pageSize = [10, 20, 25, 50, 100].includes(size) ? size : 25;
  const rawStatus = first("status");
  const status = rawStatus === "PLANNED" || rawStatus === "ACTIVE" ||
    rawStatus === "COMPLETED" || rawStatus === "ARCHIVED" ? rawStatus : undefined;
  const q = first("q")?.trim().slice(0, 120) || undefined;
  return {
    q,
    view: first("view") === "table" ? "table" : "cards",
    status,
    page,
    pageSize,
  };
}
