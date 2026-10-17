import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { platformSettingOverrides } from "@/db/schema/platform-setting-overrides";
import {
  COURSE_PROGRESS_POLICY_KEYS,
  DEFAULT_COURSE_PROGRESS_POLICY,
  resolveCourseProgressPolicy,
  type CourseProgressPolicy,
} from "./course-progress-policy";

/** Reads the GLOBAL platform policy; a missing table or row means the source defaults. */
export async function readCourseProgressPolicy(): Promise<CourseProgressPolicy> {
  try {
    const rows = await getDb()
      .select({ key: platformSettingOverrides.key, value: platformSettingOverrides.value })
      .from(platformSettingOverrides)
      .where(and(
        eq(platformSettingOverrides.scopeType, "GLOBAL"),
        eq(platformSettingOverrides.scopeId, "GLOBAL"),
        inArray(platformSettingOverrides.key, Object.values(COURSE_PROGRESS_POLICY_KEYS)),
      ));
    return resolveCourseProgressPolicy(rows);
  } catch {
    return DEFAULT_COURSE_PROGRESS_POLICY;
  }
}
