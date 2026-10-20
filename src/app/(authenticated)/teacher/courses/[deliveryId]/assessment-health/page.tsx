import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import Link from "next/link";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { Disclosure } from "@/components/ui/disclosure";
import { Badge } from "@/components/ui/badge";
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
    <PageHeader title={"Invalid Section report filters"} />
    <Link href="/teacher/courses" className="text-primary-text underline inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 hover:text-[var(--lms-primary-text)]">Back to courses</Link>
  </section>;
  const context = await getCurrentRequestContext();
  const data = await getFacultyCourseAssessmentHealth(context,parsed.data);
  const back = "/teacher/courses/" + encodeURIComponent(data.delivery.deliveryId);
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader eyebrow="Faculty · Course Report" title="Section assessment health"
      description={[data.delivery.courseName,data.delivery.sectionName,
        data.delivery.academicPeriodName].join(" · ")}
      actions={<Link href={back + "/students"}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-[var(--lms-control-height)]">
        Section students
      </Link>} />
    <section className="border-b border-border pb-4">
      <h2 className="text-sm font-semibold text-[var(--lms-heading)]">Scope</h2>
      <p className="mt-1 text-sm text-body leading-[22px]">
        {data.rosterSize} currently enrolled learners in this authorized Section.
        Only published Assignment and Quiz responses are summarized.
      </p>
    </section>
    <form action={facultyCourseHealthHref({...data.query,page:1}).split("?")[0]}
      method="get" className="grid min-w-0 gap-3 border-b border-border pb-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Assessment type
        <Select name="kind" defaultValue={data.query.kind}
          className="min-h-11 rounded-[var(--lms-control-radius)] md:min-h-[var(--lms-control-height)] border border-border bg-surface px-3 text-foreground text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <option value="ALL">All published assessments</option>
          <option value="ASSIGNMENT">Assignments</option>
          <option value="QUIZ">Quizzes</option>
        </Select>
      </label>
      <Button type="submit" variant="primary" className="min-h-11 w-full sm:w-auto md:min-h-9">Filter</Button>
      <Link href={facultyCourseHealthHref({...data.query,kind:"ALL",page:1})}
        className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Clear</Link>
    </form>
    <p role="status" className="text-sm text-body leading-[22px]">
      {data.total} published assessment{data.total === 1 ? "" : "s"} in this Section
    </p>
    {data.items.length === 0 ? <EmptyState title="No published assessments matched"
      description="No registered published Assignment or Quiz matches this Section and filter. Draft work and unsupported legacy results are not counted." />
    : <div className="min-w-0 divide-y divide-border">{data.items.map(item =>
      <article key={item.kind + ":" + item.id}
        className="min-w-0 py-4 first:pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="min-w-0 break-words text-base font-semibold leading-6 text-[var(--lms-heading)]">{item.title}</h2>
          <Badge tone="neutral">{item.kind}</Badge>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        <p className="mt-3 text-sm text-body leading-[22px]">
          Recorded response coverage: {item.coveragePercent === null
            ? "Unknown (no current eligible learners)" : item.coveragePercent + "%"}.
          Faculty-only graded average: {item.averagePercent === null
            ? "Unknown" : item.averagePercent + "%"}.
        </p>
        <Link href={item.href}
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
          Open exact Section report →
        </Link>
      </article>)}</div>}
    {data.totalPages > 1 ? <nav aria-label="Section assessment health pages"
      className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
      <div className="flex gap-3">
        {data.page > 1 && <Link href={facultyCourseHealthHref({...data.query,page:data.page-1})}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 hover:text-[var(--lms-primary-text)]">Previous</Link>}
        {data.page < data.totalPages && <Link href={facultyCourseHealthHref({...data.query,page:data.page+1})}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 hover:text-[var(--lms-primary-text)]">Next</Link>}
      </div>
    </nav> : null}
    <Disclosure title="How assessment health is counted" className="border-t border-border">
      <p className="max-w-3xl px-2 pb-2 text-xs leading-5 text-muted-foreground">
        Only five published assessments per page are expanded through the existing
        authorized Section report readers. Missing responses are not failing grades;
        private marks are not described as learner-visible, and a missing average is
        never treated as zero. This page does not alter grading or publication.
      </p>
    </Disclosure>
  </div>;
}
