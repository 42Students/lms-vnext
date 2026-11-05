import {DataTable} from "@/components/ui/data-table";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listCollegeAdminSessions} from "@/modules/colleges/admin-session-service";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {EmptyState} from "@/components/ui/empty-state";
import {AdminRevokeSessions} from "@/components/admin/admin-revoke-sessions";
import { ButtonLink } from "@/components/ui/button-link";
import { istDateTimeFormatter } from "@/lib/format-date";

type DeviceRow={id:string;device_name:string|null;user_agent:string|null;ip_address:string|null;
 last_seen_at:Date;created_at:Date;expires_at:Date};
export const dynamic="force-dynamic";
export default async function AdminDeviceSessionsPage({params}:{
 params:Promise<{collegeId:string;userId:string}>;
}){
 const {collegeId,userId}=await params;
 const sessions=await listCollegeAdminSessions(await getCurrentRequestContext(),collegeId,userId);
 const data={target:sessions.target,devices:sessions.devices as DeviceRow[]};
 const format=(value:Date)=>istDateTimeFormatter.format(new Date(value));
 return <div className="min-w-0 max-w-full space-y-[var(--lms-space-6)]">
  <PageHeader title={data.target.name+" · Active sessions"}
   description="Current device sessions for the selected administrator. Times are in IST. An unknown or out-of-scope person cannot be inspected."
   actions={<PageBackLink href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins"} label="Admins"/>}/>
  <p role="status" className="text-sm text-muted-foreground tabular-nums">{data.devices.length} active session(s), up to 100 shown.</p>
  <DataTable<DeviceRow> caption="Active administrator device sessions" rows={data.devices} getRowKey={row=>row.id}
    empty={<EmptyState title="No active sessions." description="No active sessions for this account."/>}
    columns={[
      {key:"device",header:"Device",mobilePriority:"primary",cell:row=><div className="min-w-0 break-words"><strong>{row.device_name??"Unknown device"}</strong><p className="mt-1 break-all text-xs text-muted-foreground">{row.user_agent??"Unknown browser"}</p></div>},
      {key:"ip",header:"IP",mobilePriority:"secondary",cell:row=>row.ip_address??"Unknown"},
      {key:"last",header:"Last used",mobilePriority:"secondary",cell:row=>format(row.last_seen_at)},
      {key:"expires",header:"Expires",mobilePriority:"secondary",cell:row=>format(row.expires_at)},
    ]}/>
  <ButtonLink variant="secondary" href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins/"+encodeURIComponent(userId)+"/history"}>Administrator activity history →</ButtonLink>
  <AdminRevokeSessions collegeId={collegeId} userId={userId} count={data.devices.length}/>
 </div>;
}
