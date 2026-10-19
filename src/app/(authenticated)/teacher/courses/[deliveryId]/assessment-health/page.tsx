import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import Link from "next/link";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  facultyCourseHealthHref, facultyCourseHealthParamsSchema,
} from "@/modules/courses/faculty-course-health-model";
import { getFacultyCourseAssessmentHealth } from "@/modules/courses/faculty-course-health-service";

type Params = { kind?: string | string[]; page?: string | string[] };
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FacultyCourseAssessmentHealthPage({
  params, searchParams,
}: {
  params: Promise<{deliveryId:string}>;
  searchParams: Promise<Params>;
}) {
  const [{deliveryId},raw] = await Promise.all([params,searchParams]);
  const parsed = facultyCourseHealthParamsSchema.safeParse({
    deliveryId,kind:first(raw.kind) ?? undefined,
    page:first(raw.page) ?? undefined,
  });
  if (!parsed.success) return <section role="alert" className="space-y-3">
    <PageHeader title="Invalid Section report filters" />
    <Link href="/teacher/courses" className="text-[var(--lms-teal-deep)] underline inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Back to courses</Link>
  </section>;
  const context = await getCurrentRequestContext();
  const data = await getFacultyCourseAssessmentHealth(context,parsed.data);
  const back = "/teacher/courses/" + encodeURIComponent(data.delivery.deliveryId);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Faculty · Course Report" title="Section assessment health"
      description={[data.delivery.courseName,data.delivery.sectionName,
        data.delivery.academicPeriodName].join(" · ")}
      actions={<Link href={back + "/students"}
        className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Section students
      </Link>} />
    <section className="border-b border-border pb-5">
      <h2 className="text-lg font-semibold text-foreground">Scope</h2>
      <p className="mt-1 text-sm text-body">
        {data.rosterSize} currently enrolled learners in this authorized Section.
        Only published Assignment and Quiz responses are summarized.
      </p>
    </section>
    <form action={facultyCourseHealthHref({...data.query,page:1}).split("?")[0]}
      method="get" className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm font-semibold text-body">Assessment type
        <Select name="kind" defaultValue={data.query.kind}
          className="min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <option value="ALL">All published assessments</option>
          <option value="ASSIGNMENT">Assignments</option>
          <option value="QUIZ">Quizzes</option>
        </Select>
      </label>
      <Button type="submit" variant="primary">Filter</Button>
      <Link href={facultyCourseHealthHref({...data.query,kind:"ALL",page:1})}
        className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear</Link>
    </form>
    <p className="text-sm text-body">
      {data.total} published assessment{data.total === 1 ? "" : "s"} in this Section
    </p>
    {data.items.length === 0 ? <EmptyState title="No published assessments matched"
      description="No registered published Assignment or Quiz matches this Section and filter. Draft work and unsupported legacy results are not counted." />
    : <div className="grid gap-3">{data.items.map(item =>
      <article key={item.kind + ":" + item.id}
        className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-foreground">{item.title}</h2>
          <span className="text-xs font-semibold text-body">{item.kind}</span>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-4">
          {([
            ["Eligible",item.eligible],
            ["Responded",item.responded],
            ["Without response",item.outstanding],
            ["Graded",item.graded],
          ] as const).map(([label,value]) =>
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
            </div>)}
        </dl>
        <p className="mt-3 text-sm text-body">
          Recorded response coverage: {item.coveragePercent === null
            ? "Unknown (no current eligible learners)" : item.coveragePercent + "%"}.
          Faculty-only graded average: {item.averagePercent === null
            ? "Unknown" : item.averagePercent + "%"}.
        </p>
        <Link href={item.href}
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Open exact Section report →
        </Link>
      </article>)}</div>}
    <nav aria-label="Section assessment health pages"
      className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
      <div className="flex gap-3">
        {data.page > 1 && <Link href={facultyCourseHealthHref({...data.query,page:data.page-1})}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Previous</Link>}
        {data.page < data.totalPages && <Link href={facultyCourseHealthHref({...data.query,page:data.page+1})}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Next</Link>}
      </div>
    </nav>
    <p className="text-xs leading-5 text-muted-foreground">
      Only five published assessments per page are expanded through the existing
      authorized Section report readers. Missing responses are not failing grades;
      private marks are not described as learner-visible, and a missing average is
      never treated as zero. This page does not alter grading or publication.
    </p>
  </div>;
}
