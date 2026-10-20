import Link from "next/link";
import { PageBackLink } from "@/components/ui/page-back-link";
import {isSuperAdmin} from "@/modules/identity/context";
import {SuperAdminPlatformBlockAction} from "@/components/admin/super-admin-platform-block-action";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {StatusBadge} from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
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
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader eyebrow="Super Admin · People" title={detail.name??"Unnamed user"}
   description="Read-only exact membership, with contact redaction outside the selected college."
   actions={<PageBackLink href="/admin/people/directory" label="Users & Roles directory" />}/>
  <div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">
   <StatusBadge tone={detail.platformStatus==="ACTIVE"?"success":"neutral"}>Platform {detail.platformStatus}</StatusBadge>
   <StatusBadge tone={detail.membershipStatus==="ACTIVE"?"success":"neutral"}>Membership {detail.membershipStatus}</StatusBadge>
   {detail.roles.map(role=><Badge key={role} tone="neutral">{role}</Badge>)}
  </div>
  <dl className="grid min-w-0 grid-cols-1 gap-x-[var(--lms-space-6)] gap-y-0 border-y border-[var(--lms-canvas-border)] md:grid-cols-2">
   {fields.map(field=><div key={field.label} className="min-w-0 border-b border-border py-[var(--lms-space-3)] last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0">
    <dt className="text-xs font-semibold text-muted-foreground">{field.label}</dt>
    <dd className="mt-[var(--lms-space-1)] break-words text-sm leading-6 text-body">{field.value}</dd>
   </div>)}
  </dl>
  <Link href={"/admin/people/directory/"+encodeURIComponent(membershipId)+"/audit"}
    className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] sm:w-auto border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-4)] text-[14px] font-semibold text-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
    View audit trail →
   </Link>
  <p className="max-w-3xl text-xs leading-5 text-muted-foreground">This page shows only this membership, not roles at other colleges.</p>
  {isSuperAdmin(context)&&!context.adminScope?.collegeId&&!context.adminScope?.organizationId?
    <div className="border-t border-border pt-[var(--lms-space-3)]">
      <SuperAdminPlatformBlockAction userId={detail.userId} status={detail.platformStatus}/>
    </div>:null}
 </div>;
}
