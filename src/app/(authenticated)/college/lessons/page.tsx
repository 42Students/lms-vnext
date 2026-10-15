import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeLearningDirectory } from "@/components/courses/college-learning-directory";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { collegeLessonQuerySchema } from "@/modules/courses/college-learning-directory-model";
import { listCollegeLessons } from "@/modules/courses/college-learning-directory-service";
import { lessonsCsvHref } from "@/modules/courses/college-lessons-export-model";

type Search = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function CollegeLessonsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const params = await searchParams;
  const parsed = collegeLessonQuerySchema.safeParse(
    Object.fromEntries(Object.entries({
      q: first(params.q), status: first(params.status),
      offeringStatus: first(params.offeringStatus), pathStatus:first(params.pathStatus),
      offeringType:first(params.offeringType),departmentName:first(params.departmentName)||undefined,
      contentPresence:first(params.contentPresence),publishedContent:first(params.publishedContent),flaggedVisibility:first(params.flaggedVisibility),assignmentPresence:first(params.assignmentPresence),quizPresence:first(params.quizPresence),
      courseCode: first(params.courseCode)||undefined,
      programCode:first(params.programCode)||undefined,
      cohortCode:first(params.cohortCode)||undefined,
      periodCode:first(params.periodCode)||undefined,
      page: first(params.page),
    }).filter(([, value]) => value !== undefined)),
  );
  if (!parsed.success) return (
    <div className="space-y-5">
      <PageHeader eyebrow="College Admin · Courses & Content" title="Lessons" />
      <ErrorState title="Invalid lesson filters"
        description="The search, lesson status or page is invalid. No lesson data was loaded."
        action={<Link href="/college/lessons" className="font-semibold text-primary-text">Clear filters</Link>} />
    </div>
  );
  return <div className="space-y-4">
    <Link prefetch={false} download href={lessonsCsvHref(parsed.data)}
      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Export filtered lessons CSV
    </Link>
    <Link href="/college/live-classes"
      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      View college live classes
    </Link>
    <CollegeLearningDirectory data={await listCollegeLessons(context, parsed.data)} />
  </div>;
}
