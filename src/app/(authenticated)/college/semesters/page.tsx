import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
import Link from "next/link";
import { Banner } from "@/components/ui/banner";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeAcademicDirectory } from "@/components/academics/college-academic-directory";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  academicDirectorySearchParams,
  collegeSemesterDirectorySchema,
} from "@/modules/academics/college-academic-directory-model";
import { listCollegeSemesters } from "@/modules/academics/college-academic-directory-service";
import { academicExportHref , ACADEMIC_EXPORT_CAP } from "@/modules/academics/college-academic-export-model";

export default async function CollegeSemestersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 space-y-4">
    <PageHeader title="Semesters" />
    <Banner tone="warning"><strong>Admin not assigned to a college</strong>
      <p>You must be assigned to a college to view and manage semesters. Contact your administrator.</p>
    </Banner>
  </div>;
  const raw=await searchParams;
  const params = academicDirectorySearchParams(raw);
  const parsed = collegeSemesterDirectorySchema.safeParse(params);
  if (!parsed.success) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Semesters" />
      <ErrorState title="Invalid semester filters"
        description={collegeDirectoryValidationMessage(parsed.error)}
        action={<Link href="/college/semesters" className="lms-inline-link inline-flex min-h-11 items-center text-[13px] font-semibold text-[var(--lms-link-text)] underline min-[768px]:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>} />
    </div>;
  }
  const directory=await listCollegeSemesters(context,parsed.data)
    .then(data=>({ok:true as const,data})).catch(()=>({ok:false as const}));
  const currentFilters=new URLSearchParams();
  for(const [key,value] of Object.entries(raw)){
    const current=Array.isArray(value)?value[0]:value;
    if(typeof current==="string"&&current.length<=160)currentFilters.set(key,current);
  }
  const refreshHref="/college/semesters"+(currentFilters.size?"?"+currentFilters.toString():"");
  if(!directory.ok)return <div className="min-w-0 space-y-4">
    <PageHeader title="Semesters"/>
    <Banner tone="warning">Could not refresh semesters or program choices. The selected college and filters have been preserved.</Banner>
    <ErrorState title="Unable to load semesters"
      description="The selected college's semester records could not be loaded. Retry the same filters."
      action={<Link href={refreshHref} className="font-semibold text-primary-text underline">Retry semesters and programs</Link>}/>
  </div>;
  return <div className="min-w-0 space-y-4">
    <CollegeAcademicDirectory
      data={directory.data}
      actions={<div className="flex flex-wrap items-center gap-2">
       <Link href={refreshHref} prefetch={false}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text md:min-h-9">
        Refresh</Link>
       <Link prefetch={false} download href={academicExportHref("SEMESTERS",parsed.data)}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-4 text-[14px] font-[650] text-[var(--lms-link-text)] min-[768px]:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Export CSV
      </Link></div>}
    />
    <p className="text-xs text-muted-foreground">Exports up to {ACADEMIC_EXPORT_CAP} matching semesters; the CSV records when results are truncated. Filters and college scope also apply to the download.</p>
  </div>;
}
