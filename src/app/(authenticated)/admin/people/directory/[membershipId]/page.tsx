import Link from "next/link";
import {isSuperAdmin} from "@/modules/identity/context";
import {SuperAdminPlatformBlockAction} from "@/components/admin/super-admin-platform-block-action";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {StatusBadge} from "@/components/ui/status-badge";
import {getSuperAdminMembershipDetail} from "@/modules/people/admin-membership-detail-service";
export default async function MembershipDetail({params}:{params:Promise<{membershipId:string}>}){
 const {membershipId}=await params;
 const context=await getCurrentRequestContext();
 const detail=await getSuperAdminMembershipDetail(context,membershipId);
 if(!detail)notFound();
 const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});
 const fields=[
  {label:"College",value:detail.collegeName},
  {label:"Created",value:fmt.format(detail.createdAt)+" IST"},
  {label:"Updated",value:fmt.format(detail.updatedAt)+" IST"},
  {label:"Email",value:detail.contactVisible?detail.email??"Not recorded":"Masked outside selected college"},
  {label:"Phone",value:detail.contactVisible?detail.phoneE164??"Not recorded":"Masked outside selected college"},
 ];
 return <div className="space-y-5">
  <PageHeader eyebrow="Super Admin · People" title={detail.name??"Unnamed user"}
   description="Read-only exact membership, with contact redaction outside the selected college."/>
  <div className="flex flex-wrap gap-2">
   <StatusBadge tone={detail.platformStatus==="ACTIVE"?"success":"neutral"}>Platform {detail.platformStatus}</StatusBadge>
   <StatusBadge tone={detail.membershipStatus==="ACTIVE"?"success":"neutral"}>Membership {detail.membershipStatus}</StatusBadge>
   {detail.roles.map(role=><StatusBadge key={role}>{role}</StatusBadge>)}
  </div>
  {isSuperAdmin(context)&&!context.adminScope?.collegeId&&!context.adminScope?.organizationId?
    <SuperAdminPlatformBlockAction userId={detail.userId} status={detail.platformStatus}/>:null}
  <dl className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
   {fields.map(field=><div key={field.label}>
    <dt className="text-xs font-semibold text-muted-foreground">{field.label}</dt>
    <dd className="mt-1 break-words text-sm text-body">{field.value}</dd>
   </div>)}
  </dl>
  <Link href={"/admin/people/directory/"+encodeURIComponent(membershipId)+"/audit"}
    className="inline-flex min-h-10 items-center rounded-md border border-border px-4 font-semibold text-primary-text">
    View audit trail →
   </Link>
  <p className="text-xs text-muted-foreground">This page shows only this membership, not roles at other colleges.</p>
  <Link href="/admin/people/directory" className="inline-flex min-h-11 items-center font-semibold text-primary-text">← Users &amp; Roles directory</Link>
 </div>;
}
