import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { getTpoBlockedDates } from "@/modules/placements/tpo-configuration-read-service";
export const dynamic="force-dynamic";
export default async function BlockedDatesSettings(){
 const data=await getTpoBlockedDates(await getCurrentRequestContext());
 return <main className="min-w-0 space-y-4"><TpoSettingsNav active="blocked-dates"/><h2 className="text-xl font-semibold">Blocked dates</h2>
 <p className="text-sm text-muted-foreground">Days unsuitable for placement rounds. Times are date-only and must not be shifted across time zones.</p>
 {!data.ready?<p role="status" className="rounded border border-border p-4">Blocked-date storage is pending migration registration.</p>:
 data.rows.length===0?<p role="status" className="rounded border border-border p-4">No blocked dates recorded.</p>:
 <ul className="grid min-w-0 gap-2 sm:grid-cols-2">{data.rows.map(row=><li key={row.id} className="min-w-0 rounded border border-border p-3">
 <strong>{row.day}</strong><p className="break-words text-sm">{row.reason}</p></li>)}</ul>}
 </main>;
}