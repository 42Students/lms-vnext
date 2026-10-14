import { z } from "zod";
import { MEMBERSHIP_ROLES } from "@/modules/identity/constants";
import type { PersonMembershipView } from "./service";
export const PEOPLE_CSV_CAP = 1000;
export const peopleCsvQuery = z.object({
  q: z.string().trim().max(100).default(""),
  role: z.enum(["ALL", ...MEMBERSHIP_ROLES]).default("ALL"),
  status: z.enum(["ALL", "ACTIVE", "SUSPENDED", "ENDED"]).default("ALL"),
}).strict();
export type PeopleCsvFilter = z.infer<typeof peopleCsvQuery>;
export function collegePeopleExportHref(filter: PeopleCsvFilter) {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.role !== "ALL") params.set("role", filter.role);
  if (filter.status !== "ALL") params.set("status", filter.status);
  return "/api/college/people/export" + (params.size ? "?" + params.toString() : "");
}
export function parsePeopleCsvParams(params: URLSearchParams) {
  const entries: Record<string, string> = {};
  for (const key of params.keys()) {
    if (params.getAll(key).length !== 1) throw new Error("INVALID_CSV_FILTERS");
    entries[key] = params.get(key) ?? "";
  }
  return peopleCsvQuery.parse(entries);
}
export function neutralizePeopleCsv(value: string) {
  const safe = /^\s*[=+@\-\t\r]/.test(value) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
}
export function renderPeopleCsv(rows: readonly PersonMembershipView[], truncated: boolean) {
  const header = ["Membership ID", "Name", "Email", "Phone", "Roles", "Status", "Joined UTC"];
  const lines = [header.map(neutralizePeopleCsv).join(",")];
  for (const item of rows) {
    const data = [item.membership.id, item.user.displayName ?? "", item.user.email ?? "",
      item.user.phoneE164 ?? "", item.membership.roles.join("; "), item.membership.status,
      item.membership.createdAt.toISOString()];
    lines.push(data.map(neutralizePeopleCsv).join(","));
  }
  if (truncated) lines.push(["EXPORT TRUNCATED", "", "", "",
    "Only the first 1000 matching memberships were exported. Narrow filters.", "", ""]
    .map(neutralizePeopleCsv).join(","));
  return "\ufeff" + lines.join("\r\n");
}
