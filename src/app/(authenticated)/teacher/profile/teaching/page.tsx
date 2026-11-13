import { notFound } from "next/navigation";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import {
  facultyProfileTeachingQuerySchema, ownFacultyTeachingHref,
} from "@/modules/courses/faculty-profile-teaching-model";
import { getOwnFacultyTeachingSection } from "@/modules/courses/faculty-profile-teaching-service";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { formatNumberIN } from "@/lib/safe-format";

import { ROLE } from "@/modules/identity/roles";
export const dynamic="force-dynamic";
type Params={search?:string|string[];page?:string|string[]};

export default async function FacultyTeachingProfilePage({
  searchParams,
}:{searchParams:Promise<Params>}) {
  const context=await getCurrentRequestContext();
  if(context.user.platformStatus!=="ACTIVE" ||
    context.membership?.status!=="ACTIVE" ||
    !context.membership.roles.includes(ROLE.FACULTY))notFound();
  const raw=await searchParams;
  // Strict query validation rejects duplicated selectors and unknown parameters.
  const parsed=facultyProfileTeachingQuerySchema.safeParse(raw);
  if(!parsed.success)return <section role="alert" className="min-w-0 space-y-4">
    <PageHeader title="Current teaching assignments" description="Invalid teaching profile filters" />
    <p className="text-sm text-body">These filters could not be applied. No teaching assignment records were loaded.</p>
    <TextLink href="/teacher/profile/teaching" className="inline-flex min-h-11 items-center">
      Clear filters
    </TextLink>
  </section>;
  const data=await getOwnFacultyTeachingSection(context,parsed.data);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader title="Current teaching assignments"
      description={"Registered teaching deliveries for "+data.title+" in this college."}
      actions={<ButtonLink variant="secondary" href="/teacher/profile"
        className="w-full sm:w-auto">
        Profile overview
      </ButtonLink>} />
    <section aria-labelledby="section-college-managed-employment-details" className="min-w-0 border-b border-[var(--lms-canvas-border)] py-4">
      <Heading level={2} size="base" id="section-college-managed-employment-details" className="text-foreground">College-managed employment details</Heading>
      <dl className="mt-3 grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Academic title</dt>
          <dd className="mt-1 text-sm font-semibold">{data.academicTitle||"Not provided"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Employment type</dt>
          <dd className="mt-1 text-sm font-semibold">{data.employmentType||"Not provided"}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground leading-5">
        These fields are read-only. College administrators maintain employment records.
      </p>
    </section>
    <form role="search" aria-label="profile teaching filters" method="get" action="/teacher/profile/teaching"
      className="grid min-w-0 gap-[8px] border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
      <Label stack className="min-w-0 w-full">Search current teaching
        <Input name="search" type="search" defaultValue={data.query.search}
          placeholder="Course, Section or academic period" maxLength={120}
          className="min-h-11 md:min-h-[var(--lms-control-height)] w-full"/>
      </Label>
      <Button type="submit" variant="primary" className="w-full sm:w-auto">
        Search
      </Button>
      <TextLink href="/teacher/profile/teaching" className="inline-flex min-h-11 w-full items-center justify-center px-3 sm:w-auto md:min-h-[var(--lms-control-height)] text-sm">
        Clear
      </TextLink>
    </form>
    <p className="text-sm text-body leading-[1.6]" role="status" aria-live="polite">{formatNumberIN(data.total)} matching active teaching assignment{data.total===1?"":"s"}</p>
    {data.items.length===0 ? <EmptyState
      title={data.query.search?"No teaching assignments match this search":"No current teaching assignments"}
      description={data.query.search
        ?"Try another course, Section or academic period, or clear the search to see your assignments."
        :"No active teaching deliveries are registered for this Faculty membership. Expired, revoked or unassigned roles are not reconstructed."}
      action={data.query.search?<TextLink href="/teacher/profile/teaching"
        className="inline-flex min-h-11 items-center">Clear search</TextLink>:<TextLink
        href="/teacher/courses" className="inline-flex min-h-11 items-center">Teaching courses</TextLink>} />
      : <div className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(row=>
        <article key={row.deliveryId} className="min-w-0 space-y-2 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Heading level={2} size="base" className="break-words leading-6 text-[var(--lms-heading)]">{row.courseName}</Heading>
            <Badge tone="neutral">{row.teachingRole}</Badge>
          </div>
          <p className="mt-2 text-sm text-body leading-[22px]">
            {row.courseCode} · {row.sectionName} · {row.academicPeriodName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground leading-5">
            Academic period status: {row.academicPeriodStatus}
          </p>
          <TextLink href={"/teacher/courses/"+encodeURIComponent(row.deliveryId)+"/home"}
            className="inline-flex min-h-11 w-full items-center justify-center text-sm sm:w-auto md:min-h-[var(--lms-control-height)]">
            Open assigned course →
          </TextLink>
        </article>)}</div>}
    {data.totalPages > 1 ? <nav aria-label="Teaching profile pagination" className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground leading-[22px]">Page {data.page} of {data.totalPages}</p>
      <div className="flex gap-3">
        {data.page>1 && <TextLink href={ownFacultyTeachingHref({...data.query,page:data.page-1})}
          className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm">Previous</TextLink>}
        {data.page<data.totalPages && <TextLink href={ownFacultyTeachingHref({...data.query,page:data.page+1})}
          className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm">Next</TextLink>}
      </div>
    </nav> : null}
    <p className="max-w-prose text-xs leading-5 text-muted-foreground">
      Only live teaching assignments in the currently authorized college are
      listed. This section does not invent teaching experience, historic courses,
      qualification documents, credentials, or profile completion.
    </p>
  </div>;
}
