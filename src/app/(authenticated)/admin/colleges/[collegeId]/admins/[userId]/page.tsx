import Link from "next/link";
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
 return <main className="space-y-5">
  <Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins"} className="text-primary-text underline">← Admins</Link>
  <PageHeader eyebrow="Super Admin · Tenant" title={data.target.name+" · Active sessions"}
   description="Current device sessions for the selected administrator. Times are in IST. An unknown or out-of-scope person cannot be inspected."/>
  <Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins/"+encodeURIComponent(userId)+"/history"}
   className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">Administrator activity history →</Link>
  <p className="text-sm text-body">{data.devices.length} active session(s), up to 100 shown.</p>
  {data.devices.length?<div className="overflow-x-auto rounded-xl border border-border">
   <table className="w-full min-w-[46rem] text-left text-sm">
    <thead className="bg-surface-subtle"><tr><th scope="col" className="p-3">Device</th>
     <th scope="col" className="p-3">IP</th><th scope="col" className="p-3">Last used</th>
     <th scope="col" className="p-3">Expires</th></tr></thead>
    <tbody>{data.devices.map(device=><tr key={device.id} className="border-t border-border">
     <td className="break-words p-3"><strong>{device.device_name??"Unknown device"}</strong>
      <p className="text-xs text-muted-foreground">{device.user_agent??"Unknown browser"}</p></td>
     <td className="p-3">{device.ip_address??"Unknown"}</td>
     <td className="p-3">{format(device.last_seen_at)}</td>
     <td className="p-3">{format(device.expires_at)}</td>
    </tr>)}</tbody></table></div>:
   <p role="status" className="rounded-xl border border-border p-5">No active sessions for this account.</p>}
  <AdminRevokeSessions collegeId={collegeId} userId={userId} count={data.devices.length}/>
 </main>;
}
