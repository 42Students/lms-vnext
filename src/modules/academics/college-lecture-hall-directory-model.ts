import { z } from "zod";

/** GET-only filters; the college is always resolved from the signed-in membership. */
export const COLLEGE_LECTURE_HALL_PAGE_SIZE = 10;
export const COLLEGE_LECTURE_HALL_PAGE_SIZES = [10, 20, 50, 100] as const;

export const collegeLectureHallFiltersBaseSchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ALL"),
  roomType: z.enum([
    "ALL",
    "CLASSROOM",
    "LECTURE_HALL",
    "LAB",
    "SEMINAR_HALL",
    "AUDITORIUM",
    "CONFERENCE_ROOM",
  ]).default("ALL"),
  departmentId: z.string().uuid().optional(),
  minimumCapacity: z.coerce.number().int().min(1).max(5000).optional(),
  maximumCapacity: z.coerce.number().int().min(1).max(5000).optional(),
  upcoming: z.enum(["ALL","YES","NO"]).default("ALL"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().refine(n => COLLEGE_LECTURE_HALL_PAGE_SIZES.some(size => size === n),
    "Choose 10, 20, 50 or 100 rooms").default(COLLEGE_LECTURE_HALL_PAGE_SIZE),
}).strict();

export function withCollegeLectureHallCapacityCheck<T extends z.ZodType<{ minimumCapacity?: number | undefined; maximumCapacity?: number | undefined }>>(schema: T) {
  return schema.refine(
    (query) => {
      if (typeof query !== "object" || query === null) return true;
      const minimum = "minimumCapacity" in query ? query.minimumCapacity : undefined;
      const maximum = "maximumCapacity" in query ? query.maximumCapacity : undefined;
      return typeof minimum !== "number" || typeof maximum !== "number" || minimum <= maximum;
    },
    { path: ["maximumCapacity"], message: "Maximum seats must not be below minimum seats" },
  );
}

export const collegeLectureHallFiltersSchema = withCollegeLectureHallCapacityCheck(collegeLectureHallFiltersBaseSchema);

export type CollegeLectureHallFilters = z.infer<typeof collegeLectureHallFiltersSchema>;

/** Invalid/duplicate selectors fail closed rather than silently selecting the first value. */
export function parseCollegeLectureHallSearchParams(
  params: Record<string, string | string[] | undefined>,
) {
  const input: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) return null;
    if (value !== undefined && !((key === "departmentId" || key === "minimumCapacity" || key === "maximumCapacity") && value === "")) {
      input[key] = value;
    }
  }
  const result = collegeLectureHallFiltersSchema.safeParse(input);
  return result.success ? result.data : null;
}

export function collegeLectureHallHref(query: CollegeLectureHallFilters) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status !== "ALL") params.set("status", query.status);
  if (query.roomType !== "ALL") params.set("roomType", query.roomType);
  if (query.departmentId) params.set("departmentId", query.departmentId);
  if (query.minimumCapacity !== undefined) params.set("minimumCapacity", String(query.minimumCapacity));
  if (query.maximumCapacity !== undefined) params.set("maximumCapacity", String(query.maximumCapacity));
  if (query.upcoming !== "ALL") params.set("upcoming",query.upcoming);
  if (query.page !== 1) params.set("page", String(query.page));
  if (query.pageSize !== COLLEGE_LECTURE_HALL_PAGE_SIZE) params.set("pageSize", String(query.pageSize));
  const suffix = params.toString();
  return "/college/lecture-halls" + (suffix ? "?" + suffix : "");
}

export function collegeLectureHallTotalPages(total: number, pageSize = COLLEGE_LECTURE_HALL_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function hasCollegeLectureHallFilters(query: CollegeLectureHallFilters) {
  return Boolean(query.q || query.status !== "ALL" ||
    query.roomType !== "ALL" || query.departmentId || query.minimumCapacity !== undefined || query.maximumCapacity !== undefined || query.upcoming !== "ALL");
}
