import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import {TpoPrepPercentageEditor} from "@/components/tpo/tpo-prep-percentage-editor";
import {getTpoCommunicationSettings} from "@/modules/placements/tpo-communication-settings-service";
import { TpoPrepReadinessEditor } from "@/components/tpo/tpo-prep-readiness-editor";
import { getTpoPrepReadiness, listTpoPrepCourses } from "@/modules/placements/tpo-configuration-read-service";
import { tpoPrepConfigSchema } from "@/modules/placements/tpo-configuration-model";
export const dynamic="force-dynamic";
export default async function PrepSettings(){
 const context=await getCurrentRequestContext();
 const [data,coursesResult,communication]=await Promise.all([
  getTpoPrepReadiness(context),
  listTpoPrepCourses(context).then(rows=>({ok:true as const,rows}))
   .catch(()=>({ok:false as const,rows:[] as Awaited<ReturnType<typeof listTpoPrepCourses>>})),
  getTpoCommunicationSettings(context),
 ]);
 const courses=coursesResult.rows;
 const parsed=tpoPrepConfigSchema.safeParse(data.config??{courseIds:[],minimumCompleted:0});
 const initial=parsed.success?parsed.data:{courseIds:[],minimumCompleted:0};
 return <div className="min-w-0 space-y-5">
  <PageHeader title="Prep readiness" description="Set the readiness percentage and required preparation-course choices for this college." />
  <TpoSettingsNav active="prep-readiness" compact/>
  <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] xl:items-start">
  <div className="min-w-0">
  {communication.ready?<TpoPrepPercentageEditor key={context.membership?.collegeId??"unscoped"} initial={communication.prepThresholdPct} version={communication.version}/>:
   <Alert tone="warning">Readiness percentage storage is unavailable.</Alert>}
  </div>
  <div className="min-w-0">
  {!data.ready?<Alert tone="warning">Readiness settings storage is pending migration registration.</Alert>:
  <>
   {!parsed.success?<Alert tone="error">The saved readiness config uses an unsupported shape. No changes will be made until it is reviewed.</Alert>:null}
   {data.selectionSynchronized===false?<Alert tone="warning">The saved course choices are not yet synchronized with the normalized preparation-course selections. Learner readiness evidence is temporarily unavailable until the settings are reviewed and saved again.</Alert>:null}
   {!coursesResult.ok?<Alert tone="warning">
     Couldn&apos;t load preparation courses. Saved choices were not changed. <a href="/tpo/settings/prep-readiness" className="inline-flex min-h-11 items-center font-semibold text-link underline hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Retry</a>
   </Alert>:null}
   {parsed.success&&coursesResult.ok?<TpoPrepReadinessEditor key={context.membership?.collegeId??"unscoped"} choices={courses} initial={{courseIds:initial.courseIds,minimumCompleted:initial.minimumCompleted}}
    expectedVersion={data.updatedAt?.toISOString()??"none"}/>:null}
  </>}
  </div>
  </div>
 </div>;
}
