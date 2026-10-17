import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { afterCollegeOptions } from "@/modules/placements/tpo-after-college-model";
import { requireTpoBatchActor } from "@/modules/placements/tpo-batch-workspace-read-service";
export const dynamic="force-dynamic";
export default async function AfterCollegeSettings(){
 await requireTpoBatchActor(await getCurrentRequestContext());
 const choices=afterCollegeOptions();
 return <main className="min-w-0 space-y-4"><TpoSettingsNav active="after-college"/>
 <h2 className="text-xl font-semibold">After college</h2><p className="text-sm text-muted-foreground">See the outcomes students or the placement cell can select after college.</p>
 <ol className="grid min-w-0 gap-2 sm:grid-cols-2">{choices.map(choice=><li className="min-w-0 rounded border border-border p-3" key={choice.value}><strong>{choice.label}</strong><p className="text-xs text-muted-foreground">{choice.value==="DEBARRED"?"Automatic":choice.value.startsWith("PLACED_")?"Updated by placement results":"Set by you or the student"}</p></li>)}</ol>
 </main>;
}