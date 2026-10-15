import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { getTpoPrepReadiness } from "@/modules/placements/tpo-configuration-read-service";
export const dynamic="force-dynamic";
export default async function PrepSettings(){
 const data=await getTpoPrepReadiness(await getCurrentRequestContext());
 const entries=Object.entries(data.config??{}).filter(([,value])=>typeof value==="string"||typeof value==="number"||typeof value==="boolean");
 return <main className="min-w-0 space-y-4"><TpoSettingsNav active="prep-readiness"/><h2 className="text-xl font-semibold">Prep readiness</h2>
 <p className="text-sm text-muted-foreground">Review current college readiness settings; editing requires the registered college-scoped configuration writer.</p>
 {!data.ready?<p role="status" className="rounded border border-border p-4">Readiness settings migration is pending.</p>:
 !data.config?<p role="status" className="rounded border border-border p-4">No college readiness policy configured yet.</p>:
 <dl className="grid min-w-0 gap-3 sm:grid-cols-2">{entries.map(([key,value])=><div key={key} className="min-w-0 rounded border border-border p-3">
 <dt className="break-words text-sm font-semibold">{key.replaceAll("_"," ")}</dt><dd className="break-words text-sm">{String(value)}</dd></div>)}</dl>}
 {data.config&&entries.length===0?<p className="text-sm text-muted-foreground">Complex readiness settings are stored but require a dedicated verified editor.</p>:null}
 </main>;
}