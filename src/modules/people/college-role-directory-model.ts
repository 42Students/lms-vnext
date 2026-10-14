import { z } from "zod";
import type { MembershipStatus } from "@/modules/identity/constants";

export const COLLEGE_ROLE_DIRECTORY_PAGE_SIZE = 25;
export const collegeDirectoryKindSchema = z.enum(["FACULTY", "LEARNER"]);
export type CollegeDirectoryKind = z.infer<typeof collegeDirectoryKindSchema>;

export const collegeRoleDirectoryQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "ACTIVE", "SUSPENDED", "ENDED"]).default("ALL"),
  accountStatus: z.enum(["ALL", "ACTIVE", "DISABLED"]).default("ALL"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();

export type CollegeRoleDirectoryQuery = z.infer<typeof collegeRoleDirectoryQuerySchema>;

export type CollegeRoleDirectoryRow = {
  membershipId: string;
  name: string;
  email: string | null;
  membershipStatus: MembershipStatus;
  userStatus: string;
  joinedAt: Date;
  program: string | null;
  cohort: string | null;
  sections: string[];
  activeTeachingAssignments: number;
};

export function describeCollegeDirectoryContext(
  kind: CollegeDirectoryKind,
  row: Pick<CollegeRoleDirectoryRow,
    "program" | "cohort" | "sections" | "activeTeachingAssignments">,
): string {
  if (kind === "FACULTY") {
    return row.activeTeachingAssignments === 1
      ? "1 active course teaching assignment"
      : `${row.activeTeachingAssignments} active course teaching assignments`;
  }
  if (!row.program || !row.cohort) {
    return "No active program/batch enrollment recorded";
  }
  const prefix = `${row.program} · ${row.cohort}`;
  return row.sections.length
    ? prefix + " · " + [...new Set(row.sections)].sort().join(", ")
    : prefix + " · No active class recorded";
}

export function collegeRoleDirectoryHref(
  kind: CollegeDirectoryKind,
  filter: CollegeRoleDirectoryQuery,
): string {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.status !== "ALL") params.set("status", filter.status);
  if (filter.accountStatus !== "ALL") params.set("accountStatus", filter.accountStatus);
  if (filter.page > 1) params.set("page", String(filter.page));
  const base = kind === "FACULTY" ? "/college/faculty" : "/college/students";
  return params.size ? base + "?" + params.toString() : base;
}
