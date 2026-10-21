import { redirect } from "next/navigation";

/** Preserve legacy college-admin lesson bookmarks without changing the
 * authenticated membership/college scope. The destination validates courseId
 * UUIDs before resolving the old course-selection context. */
export default async function LegacyCollegeAdminLessons({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const source = await searchParams;
  const next = new URLSearchParams();
  for (const key of ["q", "status", "courseCode", "courseId", "page", "pageSize"]) {
    const value = source[key];
    if (typeof value === "string" && value.length <= 255) next.set(key, value);
  }
  const query = next.toString();
  redirect("/college/lessons" + (query ? "?" + query : ""));
}
