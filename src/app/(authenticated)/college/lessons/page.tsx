import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeLearningDirectory } from "@/components/courses/college-learning-directory";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { collegeLessonQuerySchema } from "@/modules/courses/college-learning-directory-model";
import { listCollegeLessons } from "@/modules/courses/college-learning-directory-service";

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
      offeringStatus: first(params.offeringStatus), page: first(params.page),
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
  return <CollegeLearningDirectory data={await listCollegeLessons(context, parsed.data)} />;
}
