import { AuthorizationError } from "@/modules/permissions/policy";

/**
 * COL-course-tabs-23: a failure while loading only the create-form options must
 * not blank the whole list. Authorization failures still propagate.
 */
export async function loadCollegeTabOptions<T>(
  load: () => Promise<T>,
  fallback: T,
): Promise<{ value: T; failed: boolean }> {
  try {
    return { value: await load(), failed: false };
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    return { value: fallback, failed: true };
  }
}
