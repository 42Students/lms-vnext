import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { Disclosure } from "@/components/ui/disclosure";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import {
  facultyCourseHealthHref, facultyCourseHealthParamsSchema,
} from "@/modules/courses/faculty-course-health-model";
import { getFacultyCourseAssessmentHealth } from "@/modules/courses/faculty-course-health-service";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";

type Params = { kind?: string | string[]; page?: string | string[] };
export default async function FacultyCourseAssessmentHealthPage({
  params, searchParams,
}: {
  params: Promise<{deliveryId:string}>;
  searchParams: Promise<Params>;
}) {
  const [{deliveryId},raw] = await Promise.all([params,searchParams]);
  const parsed = facultyCourseHealthParamsSchema.safeParse({
    // Repeated query selectors are invalid, not silently reduced to the first value.
    deliveryId,kind:raw.kind ?? undefined,
    page:raw.page ?? undefined,
  });
  if (!parsed.success) {
    const validCourse = facultyCourseHealthParamsSchema.safeParse({deliveryId}).success;
    const recoverHref=validCourse
      ? facultyCourseHealthHref({deliveryId,kind:"ALL",page:1})
      : "/teacher/courses";
    return <section className="min-w-0 space-y-3">
      <PageHeader title="Section assessment health" />
      <ErrorState title="Invalid Section report filters"
        description="The assessment type or page link is invalid. No Section results were loaded. Clear these filters to open the report again."
        action={<TextLink href={recoverHref} className="inline-flex min-h-11 items-center text-sm md:min-h-9">
          {validCourse?"Reset report filters":"Back to courses"}
        </TextLink>} />
    </section>;
  }
  const context = await getCurrentRequestContext();
  const data = await getFacultyCourseAssessmentHealth(context,parsed.data);
  const back = "/teacher/courses/" + encodeURIComponent(data.delivery.deliveryId);
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader eyebrow="Faculty · Course Report" title="Section assessment health"
      description={[data.delivery.courseName,data.delivery.sectionName,
        data.delivery.academicPeriodName].join(" · ")}
      actions={<ButtonLink variant="secondary" href={back + "/students"}
        className="w-full sm:w-auto">
        Section students
      </ButtonLink>} />
    <section className="border-b border-border pb-4">
      <Heading level={2} size="sm" className="text-[var(--lms-heading)]">Scope</Heading>
      <p className="mt-1 text-sm text-body leading-[22px]">
        {data.rosterSize} currently enrolled learners in this authorized Section.
        Only published Assignment and Quiz responses are summarized.
      </p>
    </section>
    <form action={facultyCourseHealthHref({...data.query,page:1}).split("?")[0]}
      method="get" className="grid min-w-0 gap-3 border-b border-border pb-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
      <Label stack className="min-w-0">Assessment type
        <Select name="kind" defaultValue={data.query.kind}
          className="min-h-11 md:min-h-[var(--lms-control-height)]">
          <option value="ALL">All published assessments</option>
          <option value="ASSIGNMENT">Assignments</option>
          <option value="QUIZ">Quizzes</option>
        </Select>
      </Label>
      <Button type="submit" variant="primary" className="min-h-11 w-full sm:w-auto md:min-h-9">Filter</Button>
      <TextLink href={facultyCourseHealthHref({...data.query,kind:"ALL",page:1})}
        className="inline-flex min-h-11 items-center justify-center px-3 text-sm md:min-h-9">Clear</TextLink>
    </form>
    <p role="status" className="text-sm text-body leading-[1.6]">
      {data.total} published assessment{data.total === 1 ? "" : "s"} in this Section
    </p>
    {data.items.length === 0 ? <EmptyState title="No published assessments matched"
      description="No registered published Assignment or Quiz matches this Section and filter. Draft work and unsupported legacy results are not counted." />
    : <div className="min-w-0 divide-y divide-border">{data.items.map(item =>
      <article key={item.kind + ":" + item.id}
        className="min-w-0 py-4 first:pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Heading level={2} size="base" className="min-w-0 break-words leading-6 text-[var(--lms-heading)]">{item.title}</Heading>
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
        <TextLink href={item.href}
          className="mt-3 inline-flex min-h-11 items-center text-sm md:min-h-9">
          Open exact Section report →
        </TextLink>
      </article>)}</div>}
    {data.totalPages > 1 ? <nav aria-label="Section assessment health pages"
      className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
      <div className="flex gap-3">
        {data.page > 1 && <TextLink href={facultyCourseHealthHref({...data.query,page:data.page-1})}
          className="inline-flex min-h-11 items-center text-sm md:min-h-9">Previous</TextLink>}
        {data.page < data.totalPages && <TextLink href={facultyCourseHealthHref({...data.query,page:data.page+1})}
          className="inline-flex min-h-11 items-center text-sm md:min-h-9">Next</TextLink>}
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
