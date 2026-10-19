import Link from "next/link";
import {DataTable} from "@/components/ui/data-table";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listCollegeAdminSessions} from "@/modules/colleges/admin-session-service";
import {PageHeader} from "@/components/ui/page-header";
import {AdminRevokeSessions} from "@/components/admin/admin-revoke-sessions";

type DeviceRow={id:string;device_name:string|null;user_agent:string|null;ip_address:string|null;
 last_seen_at:Date;created_at:Date;expires_at:Date};
export const dynamic="force-dynamic";
export default async function AdminDeviceSessionsPage({params}:{
 params:Promise<{collegeId:string;userId:string}>;
}){
 const {collegeId,userId}=await params;
 const sessions=await listCollegeAdminSessions(await getCurrentRequestContext(),collegeId,userId);
 const data={target:sessions.target,devices:sessions.devices as DeviceRow[]};
 const format=(value:Date)=>new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(new Date(value));
 return <div className="space-y-5">
  <Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins"} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-9">← Admins</Link>
  <PageHeader eyebrow="Super Admin · Tenant" title={data.target.name+" · Active sessions"}
   description="Current device sessions for the selected administrator. Times are in IST. An unknown or out-of-scope person cannot be inspected."/>
  <Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins/"+encodeURIComponent(userId)+"/history"}
   className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-9">Administrator activity history →</Link>
  <p className="text-sm text-body">{data.devices.length} active session(s), up to 100 shown.</p>
  <DataTable<DeviceRow> caption="Active administrator device sessions" rows={data.devices} getRowKey={row=>row.id}
    empty={<p role="status">No active sessions for this account.</p>}
    columns={[
      {key:"device",header:"Device",mobilePriority:"primary",cell:row=><div className="min-w-0 break-words"><strong>{row.device_name??"Unknown device"}</strong><p className="text-xs text-muted-foreground">{row.user_agent??"Unknown browser"}</p></div>},
      {key:"ip",header:"IP",mobilePriority:"secondary",cell:row=>row.ip_address??"Unknown"},
      {key:"last",header:"Last used",mobilePriority:"secondary",cell:row=>format(row.last_seen_at)},
      {key:"expires",header:"Expires",mobilePriority:"secondary",cell:row=>format(row.expires_at)},
    ]}/>
  <AdminRevokeSessions collegeId={collegeId} userId={userId} count={data.devices.length}/>
 </div>;
}
