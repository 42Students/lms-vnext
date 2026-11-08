import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { TextLink } from "@/components/ui/text-link";
import {TpoBlockedDatesEditor} from "@/components/tpo/tpo-blocked-dates-editor";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { getTpoBlockedDates } from "@/modules/placements/tpo-configuration-read-service";
export const dynamic="force-dynamic";
export default async function BlockedDatesSettings(){
 const data=await getTpoBlockedDates(await getCurrentRequestContext());
 return <div className="min-w-0 space-y-[var(--lms-space-5)]"><PageHeader title="Blocked dates" description="Days unsuitable for placement rounds. Times are date-only and must not be shifted across time zones."/><TpoSettingsNav active="blocked-dates" compact/>
 {!data.ready?<Alert tone="warning">
  Blocked dates could not be verified, so editing is unavailable. Existing dates may still be recorded.{" "}
  <TextLink href="/tpo/settings/blocked-dates" className="inline-flex min-h-11 items-center md:min-h-9">Try loading dates again</TextLink>
 </Alert>:
 <TpoBlockedDatesEditor items={data.rows.map(row=>({...row,updatedAt:row.updatedAt.toISOString()}))}/>}
 </div>;
}