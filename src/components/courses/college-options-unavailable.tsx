import Link from "next/link";
import {
  COLLEGE_AUTHORING_OPTIONS_ERROR,
  type CollegeCourseTab,
} from "@/modules/courses/college-course-tabs-copy";

/** Named partial-failure alert with Retry; the list below it still renders. */
export function CollegeOptionsUnavailable({ tab, href }: { tab: CollegeCourseTab; href: string }) {
  return (
    <section role="alert" className="rounded-xl border border-border bg-surface p-4 text-sm">
      <p className="m-0 font-semibold text-foreground">{COLLEGE_AUTHORING_OPTIONS_ERROR[tab]}</p>
      <p className="mt-1 text-body">The create form is unavailable. The list below is not affected.</p>
      <Link href={href} prefetch={false} className="mt-2 inline-flex min-h-10 items-center font-semibold text-primary-text">
        Retry
      </Link>
    </section>
  );
}
