import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import {TpoBlockedDatesEditor} from "@/components/tpo/tpo-blocked-dates-editor";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { getTpoBlockedDates } from "@/modules/placements/tpo-configuration-read-service";
export const dynamic="force-dynamic";
export default async function BlockedDatesSettings(){
 const data=await getTpoBlockedDates(await getCurrentRequestContext());
 return <div className="min-w-0 space-y-4"><PageHeader title="Blocked dates" description="Days unsuitable for placement rounds. Times are date-only and must not be shifted across time zones."/><TpoSettingsNav active="blocked-dates"/>
 {!data.ready?<Alert tone="warning">Blocked-date storage is pending migration registration.</Alert>:
 <TpoBlockedDatesEditor items={data.rows.map(row=>({...row,updatedAt:row.updatedAt.toISOString()}))}/>}
 </div>;
}