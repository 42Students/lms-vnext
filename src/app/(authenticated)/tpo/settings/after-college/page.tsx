import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import {TpoOutcomeLabelsEditor} from "@/components/tpo/tpo-outcome-labels-editor";
import {readTpoOutcomeLabels} from "@/modules/placements/tpo-outcome-label-settings-service";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { afterCollegeAllOptions } from "@/modules/placements/tpo-after-college-model";
import { requireTpoBatchActor } from "@/modules/placements/tpo-batch-workspace-read-service";
export const dynamic="force-dynamic";
export default async function AfterCollegeSettings(){
 const context=await getCurrentRequestContext();
 await requireTpoBatchActor(context);
 const settings=await readTpoOutcomeLabels(context);
 const choices=afterCollegeAllOptions();
 return <div className="min-w-0 space-y-4"><TpoSettingsNav active="after-college"/>
 <PageHeader title="After college" description="See the outcomes students or the placement cell can select after college." />
 <ol className="grid min-w-0 gap-x-6 border-t border-border min-[768px]:grid-cols-2">{choices.map(choice=><li className="min-w-0 border-b border-border py-3" key={choice.value}><strong>{choice.label}</strong><p className="text-xs text-muted-foreground">{choice.value==="DEBARRED"?"Automatic":choice.value.startsWith("PLACED_")?"Updated by placement results":"Set by you or the student"}</p></li>)}</ol>
 {settings.ready?<TpoOutcomeLabelsEditor initial={settings.labels} version={settings.version}/>:
  <Alert tone="warning">Outcome-label storage is not available yet.</Alert>}
 </div>;
}