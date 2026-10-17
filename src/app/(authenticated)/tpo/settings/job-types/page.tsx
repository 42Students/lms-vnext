import {TPO_BUILTIN_JOB_TYPES} from "@/modules/placements/tpo-builtin-job-types";
import { TpoJobTypesEditor } from "@/components/tpo/tpo-job-types-editor";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { getTpoJobTypes } from "@/modules/placements/tpo-configuration-read-service";
export const dynamic="force-dynamic";
export default async function JobTypesSettings(){
 const {ready,rows}=await getTpoJobTypes(await getCurrentRequestContext());
 return <main className="min-w-0 space-y-4"><TpoSettingsNav active="job-types"/><h2 className="text-xl font-semibold">Job types</h2>
 <p className="text-sm text-muted-foreground">Manage the college&apos;s custom job-type choices. Inactive types are kept for historical records.</p>
 <section className="space-y-2 rounded-xl border border-border bg-surface p-4">
  <h3 className="font-semibold">Built-in job types</h3>
  <p className="text-sm text-muted-foreground">These five defaults are fixed. Their placed-count rules are shown here; per-college hide controls are not registered in this version.</p>
  <div className="overflow-x-auto"><table className="w-full min-w-[22rem] text-left text-sm">
   <thead><tr className="border-b border-border"><th className="p-2">Job type</th><th className="p-2">Counts as placed</th><th className="p-2">In the drive form</th></tr></thead>
   <tbody>{TPO_BUILTIN_JOB_TYPES.map(type=><tr key={type.label} className="border-b border-border">
    <td className="p-2 font-medium">{type.label}</td><td className="p-2">{type.countsAsPlaced?"Yes":"No"}</td>
    <td className="p-2 text-muted-foreground">Default · fixed</td>
   </tr>)}</tbody>
  </table></div>
  <p className="text-xs text-muted-foreground">Internship never counts as placed; Internship + full-time counts when the full-time offer is made.</p>
 </section>
 {!ready?<p role="status" className="rounded border border-border p-4">Job types storage is awaiting migration registration.</p>:
 <TpoJobTypesEditor types={rows.map(row=>({...row,updatedAt:row.updatedAt.toISOString()}))}/>}
 </main>;
}