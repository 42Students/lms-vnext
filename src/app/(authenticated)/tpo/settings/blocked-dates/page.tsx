import { PageHeader } from "@/components/ui/page-header";
import {TpoBlockedDatesEditor} from "@/components/tpo/tpo-blocked-dates-editor";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { getTpoBlockedDates } from "@/modules/placements/tpo-configuration-read-service";
export const dynamic="force-dynamic";
export default async function BlockedDatesSettings(){
 const data=await getTpoBlockedDates(await getCurrentRequestContext());
 return <div className="min-w-0 space-y-4"><TpoSettingsNav active="blocked-dates"/><PageHeader title="Blocked dates" />
 <p className="text-sm text-muted-foreground">Days unsuitable for placement rounds. Times are date-only and must not be shifted across time zones.</p>
 {!data.ready?<p role="status" className="rounded border border-border p-4">Blocked-date storage is pending migration registration.</p>:
 <TpoBlockedDatesEditor items={data.rows.map(row=>({...row,updatedAt:row.updatedAt.toISOString()}))}/>}
 </div>;
}