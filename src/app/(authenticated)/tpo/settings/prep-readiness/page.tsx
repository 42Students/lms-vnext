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
 return <main className="min-w-0 space-y-4"><TpoSettingsNav active="prep-readiness"/>
  <h2 className="text-xl font-semibold">Prep readiness</h2>
  {communication.ready?<TpoPrepPercentageEditor initial={communication.prepThresholdPct} version={communication.version}/>:
   <p role="status">Readiness percentage storage is unavailable.</p>}
  {!data.ready?<p role="status" className="rounded border border-border p-4">Readiness settings storage is pending migration registration.</p>:
  <>
   {!parsed.success?<p role="alert" className="text-sm">The saved readiness config uses an unsupported shape. No changes will be made until it is reviewed.</p>:null}
   {!coursesResult.ok?<p role="alert" className="rounded-md border border-warning-border bg-warning-subtle p-3 text-sm">
     Couldn&apos;t load preparation courses. Saved choices were not changed. <a href="/tpo/settings/prep-readiness" className="font-semibold underline">Retry</a>
   </p>:null}
   {parsed.success&&coursesResult.ok?<TpoPrepReadinessEditor choices={courses} initial={{courseIds:initial.courseIds,minimumCompleted:initial.minimumCompleted}}
    expectedVersion={data.updatedAt?.toISOString()??"none"}/>:null}
  </>}
 </main>;
}
