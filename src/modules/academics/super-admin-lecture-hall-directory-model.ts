import { z } from "zod";
import {
  collegeLectureHallFiltersBaseSchema, collegeLectureHallHref,
  withCollegeLectureHallCapacityCheck,
} from "./college-lecture-hall-directory-model";

export const superAdminLectureHallFiltersSchema = withCollegeLectureHallCapacityCheck(
  collegeLectureHallFiltersBaseSchema.extend({
    pageSize: z.coerce.number().int().refine(value => [10,25,50,100].includes(value),
      "Choose 10, 25, 50 or 100 rows").default(10),
  }),
);
export type SuperAdminLectureHallFilters = z.infer<typeof superAdminLectureHallFiltersSchema>;

/** Reject repeated selectors and client-supplied college IDs; scope comes from auth. */
export function parseSuperAdminLectureHallFilters(
  params: Record<string,string|string[]|undefined>,
): SuperAdminLectureHallFilters | null {
  const input: Record<string,string> = {};
  for (const [key,value] of Object.entries(params)) {
    if (Array.isArray(value)) return null;
    if (value !== undefined &&
      !((key === "departmentId" || key === "minimumCapacity" || key === "maximumCapacity") &&
        value === "")) input[key] = value;
  }
  const result = superAdminLectureHallFiltersSchema.safeParse(input);
  return result.success ? result.data : null;
}

export function superAdminLectureHallHref(query: SuperAdminLectureHallFilters) {
  const collegeHref = collegeLectureHallHref(query);
  const params = new URLSearchParams(collegeHref.split("?")[1] ?? "");
  if (query.pageSize !== 10) params.set("pageSize",String(query.pageSize));
  return "/admin/lecture-halls" + (params.size ? "?" + params.toString() : "");
}

export function superAdminLectureHallPages(total:number,pageSize:number) {
  return Math.max(1,Math.ceil(total/pageSize));
}
