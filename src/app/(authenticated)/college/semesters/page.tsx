import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
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
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";

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
        action={<TextLink href="/college/semesters" className="inline-flex min-h-11 items-center text-[13px] md:min-h-9">Clear filters</TextLink>} />
    </div>;
  }
  const { programId, termNumber, minimumCredits, maximumCredits, creditState, programStatus, mappingState, ...requiredFilters } = parsed.data;
  const filters = {
    ...requiredFilters,
    ...(programId !== undefined ? { programId } : {}),
    ...(termNumber !== undefined ? { termNumber } : {}),
    ...(minimumCredits !== undefined ? { minimumCredits } : {}),
    ...(maximumCredits !== undefined ? { maximumCredits } : {}),
    ...(creditState !== undefined ? { creditState } : {}),
    ...(programStatus !== undefined ? { programStatus } : {}),
    ...(mappingState !== undefined ? { mappingState } : {}),
  };
  const directory=await listCollegeSemesters(context,filters)
    .then(data=>({ok:true as const,data})).catch(()=>({ok:false as const}));
  const currentFilters=new URLSearchParams();
  for(const [key,value] of Object.entries(raw)){
    const current=Array.isArray(value)?value[0]:value;
    if(typeof current==="string"&&current.length<=160)currentFilters.set(key,current);
  }
  const refreshHref="/college/semesters"+(currentFilters.size?"?"+currentFilters.toString():"");
  if(!directory.ok)return <div className="min-w-0 space-y-4">
    <PageHeader title="Semesters"/>
    <Banner tone="warning">
      Could not load semesters or program choices. The selected college and filters have been preserved.
      The last visible results are not being presented as a successful refresh.
    </Banner>
    <ErrorState title="Unable to load semesters"
      description="Semester and program choices share one college-scoped read. Retry with the same filters rather than treating an unavailable program list as empty."
      action={<div className="flex flex-wrap items-center gap-4">
        <TextLink href={refreshHref} prefetch={false} className="inline-flex min-h-11 items-center md:min-h-9">Retry semesters</TextLink>
        <TextLink href={refreshHref} prefetch={false} className="inline-flex min-h-11 items-center md:min-h-9">Retry programs</TextLink>
      </div>}/>
  </div>;
  return <div className="min-w-0 space-y-4">
    <CollegeAcademicDirectory
      data={directory.data}
      actions={<div className="flex flex-wrap items-center gap-2">
       <ButtonLink variant="secondary" href={refreshHref} prefetch={false}>
        Refresh</ButtonLink>
       <ButtonLink variant="secondary" prefetch={false} download href={academicExportHref("SEMESTERS",filters)}>
        Export CSV
      </ButtonLink></div>}
    />
    <p className="text-xs text-muted-foreground">Exports up to {ACADEMIC_EXPORT_CAP} matching semesters; the CSV records when results are truncated. Filters and college scope also apply to the download.</p>
  </div>;
}
