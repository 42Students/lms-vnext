import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
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
  if(!parsed.success)return <section role="alert" className="space-y-3">
    <h1 className="font-semibold text-[30px] text-[var(--lms-heading)]">Invalid teaching profile filters</h1>
    <Link href="/teacher/profile/teaching" className="text-primary-text underline inline-flex min-h-9 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      Clear filters
    </Link>
  </section>;
  const context=await getCurrentRequestContext();
  const data=await getOwnFacultyTeachingSection(context,parsed.data);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Faculty · Self Profile" title="Current teaching assignments"
      description={"Registered teaching deliveries for "+data.title+" in this college."}
      actions={<Link href="/teacher/profile"
        className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Profile overview
      </Link>} />
    <section className="border-b border-border pb-5">
      <h2 className="text-base font-semibold text-foreground">College-managed employment details</h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Academic title</dt>
          <dd className="mt-1 text-sm font-semibold">{data.academicTitle||"Not provided"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Employment type</dt>
          <dd className="mt-1 text-sm font-semibold">{data.employmentType||"Not provided"}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        These fields are read-only. College administrators maintain employment records.
      </p>
    </section>
    <form method="get" action="/teacher/profile/teaching"
      className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm font-semibold text-body">Search current teaching
        <Input name="search" type="search" defaultValue={data.query.search}
          placeholder="Course, Section or academic period" maxLength={120}
          className="min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/>
      </label>
      <Button type="submit" variant="primary">
        Search
      </Button>
      <Link href="/teacher/profile/teaching" className="inline-flex min-h-9 items-center px-3 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Clear
      </Link>
    </form>
    <p className="text-sm text-body" role="status" aria-live="polite">{data.total} matching active teaching assignment{data.total===1?"":"s"}</p>
    {data.items.length===0 ? <EmptyState title="No current teaching assignments"
      description="No persisted active teaching deliveries match this search. Expired, revoked or unassigned teaching roles are not reconstructed." />
      : <div className="grid gap-3">{data.items.map(row=>
        <article key={row.deliveryId} className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-foreground">{row.courseName}</h2>
            <span className="text-xs font-semibold text-body">{row.teachingRole}</span>
          </div>
          <p className="mt-2 text-sm text-body">
            {row.courseCode} · {row.sectionName} · {row.academicPeriodName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Academic period status: {row.academicPeriodStatus}
          </p>
          <Link href={"/teacher/courses/"+encodeURIComponent(row.deliveryId)+"/home"}
            className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Open assigned course →
          </Link>
        </article>)}</div>}
    <nav aria-label="Teaching profile pagination" className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</p>
      <div className="flex gap-3">
        {data.page>1 && <Link href={ownFacultyTeachingHref({...data.query,page:data.page-1})}
          className="inline-flex min-h-9 items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Previous</Link>}
        {data.page<data.totalPages && <Link href={ownFacultyTeachingHref({...data.query,page:data.page+1})}
          className="inline-flex min-h-9 items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Next</Link>}
      </div>
    </nav>
    <p className="text-xs leading-5 text-muted-foreground">
      Only live teaching assignments in the currently authorized college are
      listed. This section does not invent teaching experience, historic courses,
      qualification documents, credentials, or profile completion.
    </p>
  </div>;
}
