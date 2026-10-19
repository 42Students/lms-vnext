import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import { CollegeSemesterCreateForm, CollegeSemesterRowActions } from "@/components/academics/college-semester-management";
import { EmptyState } from "@/components/ui/empty-state";
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
    return <div className="space-y-4">
      <PageHeader title="Semesters" />
      <ErrorState title="Semester access denied"
        description="Your account cannot access Super Admin semesters."
        action={<Link href="/dashboard" className="font-semibold text-primary-text underline">Back to dashboard</Link>}/>
    </div>;
  }
  if (!context.adminScope?.collegeId) {
    return <div className="space-y-4">
      <PageHeader  title="Semesters" />
      <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its semesters." />
    </div>;
  }

  const parsed = collegeSemesterDirectorySchema.safeParse(
    academicDirectorySearchParams(await searchParams),
  );
  if (!parsed.success) {
    return <div className="space-y-4">
      <PageHeader  title="Semesters" />
      <ErrorState title="Invalid semester filters"
        description="Check the selected program, term, status or page."
        action={<Link href="/admin/semesters" className="font-semibold text-primary-text">Clear filters</Link>} />
    </div>;
  }

  const result=await listCollegeSemesters(context,parsed.data)
    .then(value=>({ok:true as const,value}))
    .catch(()=>({ok:false as const}));
  if(!result.ok){
    return <div className="space-y-4">
      <PageHeader title="Semesters" />
      <ErrorState title="Semesters unavailable"
        description="The semester directory could not be loaded. Your filters were not changed."
        action={<Link href={pageHref(parsed.data)}
          className="font-semibold text-primary-text underline">Retry loading semesters</Link>}/>
    </div>;
  }
  const data=result.value;
  return <div className="min-w-0 space-y-6">
      <AcademicSetupSteps step={3} />
    <PageHeader  title="Semesters"
      description="Create and manage semesters. Credits sum the mapped courses; unmapped semesters show —." />
    <CollegeSemesterCreateForm programs={data.programs.filter(program => program.status === "ACTIVE")} />
    <section className="border-b border-border pb-4" aria-label="Semester filters">
      <form method="get" action="/admin/semesters" className="flex flex-wrap items-end gap-3">
        <label className="grid min-w-44 flex-1 gap-1 text-sm font-semibold text-body">Semester or program
          <Input name="q" type="search" defaultValue={data.query.q} maxLength={100}
            className="w-full" />
        </label>
        <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">Program
          <Select name="programId" defaultValue={data.query.programId ?? ""}
            className="w-full">
            <option value="">All programs</option>
            {data.programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
          </Select>
        </label>
        <label className="grid min-w-32 gap-1 text-sm font-semibold text-body">Status
          <Select name="status" defaultValue={data.query.status}
            className="w-full">
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </label>
        <label className="grid min-w-32 gap-1 text-sm font-semibold text-body">Rows per page
          <Select name="pageSize" defaultValue={data.query.pageSize} className="w-full">
            {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
          </Select>
        </label>
        <Button type="submit">Filter</Button>
        <Link href="/admin/semesters" className="inline-flex min-h-11 items-center font-semibold text-primary-text">Clear</Link>
      </form>
    </section>
    <form method="get" action="/admin/semesters" aria-label="Refresh semester directory">
      {data.query.q ? <input type="hidden" name="q" value={data.query.q} /> : null}
      {data.query.programId ? <input type="hidden" name="programId" value={data.query.programId} /> : null}
      <input type="hidden" name="status" value={data.query.status} />
      <input type="hidden" name="page" value={String(data.query.page)} />
      <input type="hidden" name="pageSize" value={String(data.query.pageSize)} />
      <Button type="submit" variant="secondary">Refresh</Button>
    </form>
    <a href={"/api/admin/semesters/export?"+new URLSearchParams({
      ...(data.query.q?{q:data.query.q}:{}),
      ...(data.query.programId?{programId:data.query.programId}:{}),
      ...(data.query.status!=="ALL"?{status:data.query.status}:{})
    }).toString()} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
      Export semesters.csv
    </a>
    <section aria-label="Semesters" className="min-w-0 space-y-3">
      <p role="status" className="text-sm text-muted-foreground">{data.total} matching semesters</p>
      <DataTable
        caption="Semesters"
        rows={data.items}
        getRowKey={row=>row.id}
        columns={[
          {key:"program",header:"Program",mobilePriority:"secondary",cell:row=>row.programName},
          {key:"number",header:"Semester #",mobilePriority:"secondary",cell:row=>"Sem "+row.termNumber},
          {key:"name",header:"Name",mobilePriority:"primary",cell:row=>row.name},
          {key:"credits",header:"Credits",mobilePriority:"secondary",cell:row=>row.mappedCredits??"—"},
          {key:"courses",header:"Courses",mobilePriority:"secondary",cell:row=>row.mappedCourses},
          {key:"status",header:"Status",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.isActive?"success":"neutral"}>{row.isActive?"Active":"Inactive"}</StatusBadge>},
          {key:"actions",header:"Actions",mobilePriority:"action",cell:row=><CollegeSemesterRowActions row={row}/>},
        ]}
        empty={<p className="text-sm text-body">No semesters found. Create a program first, then add semesters.</p>}
      />
    </section>
    <Pagination label="Semester pages" page={data.query.page} pageCount={data.totalPages}
      hrefForPage={page=>pageHref({...data.query,page})} />
    <Link href="/admin/semester-courses" className="font-semibold text-primary-text">Semester–Course Mapping</Link>
  </div>;
}
