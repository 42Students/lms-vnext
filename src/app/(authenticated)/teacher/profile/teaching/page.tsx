import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import {
  facultyProfileTeachingQuerySchema, ownFacultyTeachingHref,
} from "@/modules/courses/faculty-profile-teaching-model";
import { getOwnFacultyTeachingSection } from "@/modules/courses/faculty-profile-teaching-service";

export const dynamic="force-dynamic";
type Params={search?:string|string[];page?:string|string[]};
const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;

export default async function FacultyTeachingProfilePage({
  searchParams,
}:{searchParams:Promise<Params>}) {
  const raw=await searchParams;
  const parsed=facultyProfileTeachingQuerySchema.safeParse({
    search:first(raw.search)??undefined,page:first(raw.page)??undefined,
  });
  if(!parsed.success)return <section role="alert" className="min-w-0 space-y-4">
    <PageHeader title={"Invalid teaching profile filters"} />
    <Link href="/teacher/profile/teaching" className="text-primary-text underline inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">
      Clear filters
    </Link>
  </section>;
  const context=await getCurrentRequestContext();
  const data=await getOwnFacultyTeachingSection(context,parsed.data);
  return <div className="min-w-0 max-w-full space-y-5">
    <PageHeader title="Current teaching assignments"
      description={"Registered teaching deliveries for "+data.title+" in this college."}
      actions={<Link href="/teacher/profile"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link sm:w-auto md:min-h-[var(--lms-control-height)] hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Profile overview
      </Link>} />
    <section aria-labelledby="section-college-managed-employment-details" className="min-w-0 border-b border-[var(--lms-canvas-border)] py-4">
      <h2 id="section-college-managed-employment-details" className="text-base font-semibold text-foreground">College-managed employment details</h2>
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
      className="grid min-w-0 gap-3 border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
      <label className="grid min-w-0 w-full gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-5 text-[var(--lms-neutral-400)]">Search current teaching
        <Input name="search" type="search" defaultValue={data.query.search}
          placeholder="Course, Section or academic period" maxLength={120}
          className="min-h-11 md:min-h-[var(--lms-control-height)] w-full"/>
      </label>
      <Button type="submit" variant="primary" className="w-full sm:w-auto">
        Search
      </Button>
      <Link href="/teacher/profile/teaching" className="inline-flex min-h-11 w-full items-center justify-center px-3 sm:w-auto md:min-h-[var(--lms-control-height)] text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">
        Clear
      </Link>
    </form>
    <p className="text-sm text-body leading-[22px]" role="status" aria-live="polite">{data.total} matching active teaching assignment{data.total===1?"":"s"}</p>
    {data.items.length===0 ? <EmptyState title="No current teaching assignments"
      description="No persisted active teaching deliveries match this search. Expired, revoked or unassigned teaching roles are not reconstructed." />
      : <div className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(row=>
        <article key={row.deliveryId} className="min-w-0 space-y-2 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="break-words text-base font-semibold leading-6 text-[var(--lms-heading)]">{row.courseName}</h2>
            <Badge tone="neutral">{row.teachingRole}</Badge>
          </div>
          <p className="mt-2 text-sm text-body leading-[22px]">
            {row.courseCode} · {row.sectionName} · {row.academicPeriodName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground leading-5">
            Academic period status: {row.academicPeriodStatus}
          </p>
          <Link href={"/teacher/courses/"+encodeURIComponent(row.deliveryId)+"/home"}
            className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-primary-text sm:w-auto md:min-h-[var(--lms-control-height)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Open assigned course →
          </Link>
        </article>)}</div>}
    {data.totalPages > 1 ? <nav aria-label="Teaching profile pagination" className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground leading-[22px]">Page {data.page} of {data.totalPages}</p>
      <div className="flex gap-3">
        {data.page>1 && <Link href={ownFacultyTeachingHref({...data.query,page:data.page-1})}
          className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">Previous</Link>}
        {data.page<data.totalPages && <Link href={ownFacultyTeachingHref({...data.query,page:data.page+1})}
          className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">Next</Link>}
      </div>
    </nav> : null}
    <p className="max-w-prose text-xs leading-5 text-muted-foreground">
      Only live teaching assignments in the currently authorized college are
      listed. This section does not invent teaching experience, historic courses,
      qualification documents, credentials, or profile completion.
    </p>
  </div>;
}
