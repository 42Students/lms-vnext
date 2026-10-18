import { z } from "zod";
import {
  collegeLectureHallFiltersBaseSchema, collegeLectureHallHref,
  withCollegeLectureHallCapacityCheck,
} from "./college-lecture-hall-directory-model";

// URL selectors must be decimal; z.coerce.number() also accepts hexadecimal,
// exponent notation, and booleans (or singleton arrays via JavaScript coercion).
const decimalSelection = z.union([
  z.number().int(),
  z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int()),
]);
export const superAdminLectureHallFiltersSchema = withCollegeLectureHallCapacityCheck(
  collegeLectureHallFiltersBaseSchema.extend({
    page: decimalSelection.refine(value => value >= 1 && value <= 1000).default(1),
    pageSize: decimalSelection.refine(value => [10,25,50,100].includes(value),
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
  const rows = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
  const size = Number.isSafeInteger(pageSize) && pageSize > 0 ? pageSize : 10;
  return Math.max(1,Math.ceil(rows/size));
}
