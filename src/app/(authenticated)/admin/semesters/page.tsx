import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import { CollegeSemesterCreateForm, CollegeSemesterRowActions } from "@/components/academics/college-semester-management";
import { EmptyState } from "@/components/ui/empty-state";
import { Banner } from "@/components/ui/banner";
import { ErrorState } from "@/components/ui/error-state";
import {DataTable} from "@/components/ui/data-table";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Pagination} from "@/components/ui/pagination";
import {StatusBadge} from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { academicDirectorySearchParams, collegeSemesterDirectorySchema } from "@/modules/academics/college-academic-directory-model";
import { listCollegeSemesters } from "@/modules/academics/college-academic-directory-service";

type Search = Record<string, string | string[] | undefined>;

function pageHref(query: { q: string; programId?: string; status: string; page: number; pageSize: number }) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.programId) params.set("programId", query.programId);
  if (query.status !== "ALL") params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  if (query.pageSize !== 10) params.set("pageSize", String(query.pageSize));
  const encoded = params.toString();
  return "/admin/semesters" + (encoded ? "?" + encoded : "");
}

export default async function SuperAdminSemestersPage({ searchParams }: {
  searchParams: Promise<Search>;
}) {
  const context = await getCurrentRequestContext();
  // The admin shell cannot substitute for a live role check on deep links.
  if(!isSuperAdmin(context)){
    return <div className="min-w-0 max-w-full space-y-4">
      <PageHeader title="Semesters" />
      <ErrorState title="Semester access denied"
        description="Your account cannot access Super Admin semesters."
        action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Back to dashboard</Link>}/>
    </div>;
  }
  if (!context.adminScope?.collegeId) {
    return <div className="min-w-0 max-w-full space-y-4">
      <PageHeader  title="Semesters" />
      <Banner tone="warning">Select a College to manage Semesters. Choose Organization and College in the header first.</Banner>
    </div>;
  }

  const parsed = collegeSemesterDirectorySchema.safeParse(
    academicDirectorySearchParams(await searchParams),
  );
  if (!parsed.success) {
    return <div className="min-w-0 max-w-full space-y-4">
      <PageHeader  title="Semesters" />
      <ErrorState title="Invalid semester filters"
        description="Check the selected program, term, status or page."
        action={<Link href="/admin/semesters" className="inline-flex min-h-11 w-full items-center justify-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>} />
    </div>;
  }

  const result=await listCollegeSemesters(context,parsed.data)
    .then(value=>({ok:true as const,value}))
    .catch(error=>({ok:false as const,reason:error instanceof Error?error.message:"SEMESTERS_UNAVAILABLE"}));
  if(!result.ok){
    return <div className="min-w-0 max-w-full space-y-4">
      <PageHeader title="Semesters" />
      <ErrorState title={result.reason==="PROGRAMS_UNAVAILABLE"?"Programs unavailable":"Semesters unavailable"}
        description={result.reason==="PROGRAMS_UNAVAILABLE"
          ?"Programs could not be loaded. Retry the program lookup before creating a semester."
          :"The semester directory could not be loaded. Your filters were not changed."}
        action={<Link href={pageHref(parsed.data)}
          className="inline-flex items-center min-h-11 md:min-h-9 font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Retry loading semesters</Link>}/>
    </div>;
  }
  const data=result.value;
  return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Semesters"
      description="Create and manage semesters. Credits sum the mapped courses; unmapped semesters show —."
      actions={<Link href="/admin/semester-courses" className="inline-flex min-h-11 w-full items-center justify-center text-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-[650] text-primary-text md:min-h-9 md:w-auto hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Semester–Course Mapping</Link>} />
    <AcademicSetupSteps step={3} showRefresh={false} />
    <CollegeSemesterCreateForm programs={data.programs.filter(program => program.status === "ACTIVE")} />
    <section className="border-b border-border pb-4" aria-label="Semester filters">
      <form method="get" action="/admin/semesters" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-2)] md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto_auto]" aria-label="Search semesters">
        <label className="grid min-w-44 flex-1 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Semester or program
          <Input name="q" type="search" defaultValue={data.query.q} maxLength={100}
            className="min-h-11 w-full min-w-0 md:min-h-9" />
        </label>
        <label className="grid min-w-40 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
          <Select name="programId" defaultValue={data.query.programId ?? ""}
            className="min-h-11 w-full min-w-0 md:min-h-9">
            <option value="">All programs</option>
            {data.programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
          </Select>
        </label>
        <label className="grid min-w-32 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
          <Select name="status" defaultValue={data.query.status}
            className="min-h-11 w-full min-w-0 md:min-h-9">
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </label>
        <label className="grid min-w-32 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Rows per page
          <Select name="pageSize" defaultValue={data.query.pageSize} className="min-h-11 w-full min-w-0 md:min-h-9">
            {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
          </Select>
        </label>
        <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Filter</Button>
        <Link href="/admin/semesters" className="inline-flex min-h-11 w-full items-center justify-center font-semibold text-primary-text hover:underline md:min-h-9 md:w-auto hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear</Link>
      </form>
    </section>
    <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap sm:items-center">
    <form method="get" action="/admin/semesters" aria-label="Refresh semester directory" className="w-full sm:w-auto">
      {data.query.q ? <Input type="hidden" name="q" value={data.query.q} /> : null}
      {data.query.programId ? <Input type="hidden" name="programId" value={data.query.programId} /> : null}
      <Input type="hidden" name="status" value={data.query.status} />
      <Input type="hidden" name="page" value={String(data.query.page)} />
      <Input type="hidden" name="pageSize" value={String(data.query.pageSize)} />
      <Button type="submit" variant="secondary" className="min-h-11 w-full sm:min-h-9 sm:w-auto">Refresh</Button>
    </form>
    <a href={"/api/admin/semesters/export?"+new URLSearchParams({
      ...(data.query.q?{q:data.query.q}:{}),
      ...(data.query.programId?{programId:data.query.programId}:{}),
      ...(data.query.status!=="ALL"?{status:data.query.status}:{})
    }).toString()} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-[650] text-primary-text md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
      Export semesters.csv
    </a>
    </div>
    <section aria-label="Semesters" className="min-w-0 space-y-3">
      <p role="status" className="m-0 break-words text-sm text-muted-foreground">Showing {data.total?((data.query.page-1)*data.query.pageSize+1):0}–{Math.min(data.query.page*data.query.pageSize,data.total)} of {data.total.toLocaleString("en-IN")} semesters</p>
      <DataTable
        caption="Semesters"
        rows={data.items}
        getRowKey={row=>row.id}
        columns={[
          {key:"program",header:"Program",mobilePriority:"secondary",cell:row=>row.programName},
          {key:"number",header:"Semester #",mobilePriority:"secondary",cell:row=>
            <span className="inline-flex rounded border border-info bg-info-subtle px-2 py-0.5 text-xs font-semibold text-info-text">Sem {row.termNumber}</span>},
          {key:"name",header:"Name",mobilePriority:"primary",cell:row=>row.name},
          {key:"credits",header:"Credits",mobilePriority:"secondary",cell:row=>row.mappedCredits??"—"},
          {key:"courses",header:"Courses",mobilePriority:"secondary",cell:row=>row.mappedCourses},
          {key:"status",header:"Status",mobilePriority:"secondary",cell:row=><span className={row.isActive?"text-success-text":"text-error"}><StatusBadge tone={row.isActive?"success":"danger"}>{row.isActive?"Active":"Inactive"}</StatusBadge></span>},
          {key:"actions",header:"Actions",mobilePriority:"action",cell:row=><CollegeSemesterRowActions row={row}/>},
        ]}
        empty={<EmptyState title="No semesters found" description="No semesters match these filters. Create a program first, then add semesters."
          action={<Link href="/admin/semesters" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto md:min-h-9">Clear filters</Link>}/>}
      />
    </section>
    <Pagination label="Semester pages" page={data.query.page} pageCount={data.totalPages}
      hrefForPage={page=>pageHref({...data.query,page})} />
  </div>;
}
