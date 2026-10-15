import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { TpoPrepReadinessEditor } from "@/components/tpo/tpo-prep-readiness-editor";
import { getTpoPrepReadiness, listTpoPrepCourses } from "@/modules/placements/tpo-configuration-read-service";
import { tpoPrepConfigSchema } from "@/modules/placements/tpo-configuration-model";
export const dynamic="force-dynamic";
export default async function PrepSettings(){
 const context=await getCurrentRequestContext();
 const [data,courses]=await Promise.all([getTpoPrepReadiness(context),listTpoPrepCourses(context)]);
 const parsed=tpoPrepConfigSchema.safeParse(data.config??{courseIds:[],minimumCompleted:0});
 const initial=parsed.success?parsed.data:{courseIds:[],minimumCompleted:0};
 return <main className="min-w-0 space-y-4"><TpoSettingsNav active="prep-readiness"/>
  <h2 className="text-xl font-semibold">Prep readiness</h2>
  {!data.ready?<p role="status" className="rounded border border-border p-4">Readiness settings storage is pending migration registration.</p>:
  <>
   {!parsed.success?<p role="alert" className="text-sm">The saved readiness config uses an unsupported shape. No changes will be made until it is reviewed.</p>:null}
   {parsed.success?<TpoPrepReadinessEditor choices={courses} initial={{courseIds:initial.courseIds,minimumCompleted:initial.minimumCompleted}}
    expectedVersion={data.updatedAt?.toISOString()??"none"}/>:null}
  </>}
 </main>;
}
