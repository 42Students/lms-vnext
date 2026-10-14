import { z } from "zod";
import { MEMBERSHIP_ROLES } from "@/modules/identity/constants";

export const collegePeopleDirectoryFilterSchema = z.object({
  q: z.string().trim().max(100).default(""),
  role: z.enum(["ALL", ...MEMBERSHIP_ROLES]).default("ALL"),
  status: z.enum(["ALL", "ACTIVE", "SUSPENDED", "ENDED"]).default("ALL"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();

export type CollegePeopleDirectoryFilter = z.infer<typeof collegePeopleDirectoryFilterSchema>;

export function collegePeopleDirectoryHref(filter: CollegePeopleDirectoryFilter): string {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.role !== "ALL") params.set("role", filter.role);
  if (filter.status !== "ALL") params.set("status", filter.status);
  if (filter.page > 1) params.set("page", String(filter.page));
  return "/college/people" + (params.size ? "?" + params.toString() : "");
}
