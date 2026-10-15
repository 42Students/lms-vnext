import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { getTpoJobTypes } from "@/modules/placements/tpo-configuration-read-service";
export const dynamic="force-dynamic";
export default async function JobTypesSettings(){
 const {ready,rows}=await getTpoJobTypes(await getCurrentRequestContext());
 return <main className="min-w-0 space-y-4"><TpoSettingsNav active="job-types"/><h2 className="text-xl font-semibold">Job types</h2>
 <p className="text-sm text-muted-foreground">The college&apos;s job-type choices. Changes are unavailable until the staged migration and editor are registered.</p>
 {!ready?<p role="status" className="rounded border border-border p-4">Job types storage is awaiting migration registration.</p>:
 rows.length===0?<p role="status" className="rounded border border-border p-4">No custom job types have been configured.</p>:
 <ul className="grid min-w-0 gap-2 sm:grid-cols-2">{rows.map(row=><li className="rounded border border-border p-3" key={row.id}><strong>{row.label}</strong><p className="text-xs">{row.active?"Active":"Inactive"}</p></li>)}</ul>}
 </main>;
}