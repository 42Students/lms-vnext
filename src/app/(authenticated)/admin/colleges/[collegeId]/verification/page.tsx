import Link from "next/link";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {profileVerificationSettings} from "@/db/schema/profile-verification";
import {TpoVerificationSwitch} from "@/components/verification/TpoVerificationSwitch";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {SuperAdminVerificationPanel} from "@/components/verification/SuperAdminVerificationPanel";
import {getSuperAdminTenantLifecycleDetail} from "@/modules/colleges/admin-tenant-lifecycle-service";
import {CollegeServiceError} from "@/modules/colleges/service";
import {listCollegeVerificationQueue,VerificationQueueLimitError} from "@/modules/verification/staff-queue-service";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {verificationQueueFilters} from "@/modules/verification/queue-filters";
import {requireSuperAdminVerificationCollege} from "@/modules/verification/super-admin-scope";

export const dynamic="force-dynamic";
export default async function AdminCollegeVerification({
 params,searchParams,
}:{
 params:Promise<{collegeId:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const {collegeId}=await params;
 const context=await getCurrentRequestContext();
 let college:Awaited<ReturnType<typeof getSuperAdminTenantLifecycleDetail>>;
 try{
  await requireSuperAdminVerificationCollege(context,collegeId);
  college=await getSuperAdminTenantLifecycleDetail(context,collegeId);
 }catch(e){if(e instanceof CollegeServiceError&&e.code==="COLLEGE_NOT_FOUND")notFound();throw e;}
 const base=`/admin/colleges/${encodeURIComponent(college.id)}/verification`;
 const raw=await searchParams;
 const invalidPaging=["page","pageSize"].some(key=>{
  const value=raw[key];
  return value!==undefined&&(typeof value!=="string"||!/^[0-9]+$/.test(value));
 });
 const parsed=invalidPaging||Object.values(raw).some(Array.isArray)?null:verificationQueueFilters.safeParse(Object.fromEntries(
  Object.entries(raw).filter(([,v])=>v!==undefined&&v!==""),
 ));
 const header=<PageHeader eyebrow="Super Admin · Verification" title={college.name}
  description="College-scoped learner Education and Identity verification. Review only the currently selected college."/>;
 if(!parsed?.success)return <div className="min-w-0 space-y-5">{header}
  <div role="alert" className="rounded-[var(--lms-control-radius)] border border-border bg-warning-subtle p-4 text-body">Invalid verification filters.
   <Link href={base} className="ml-2 inline-flex min-h-11 items-center font-semibold text-primary-text underline">Reset</Link></div></div>;
 let data:Awaited<ReturnType<typeof listCollegeVerificationQueue>>;
 try{data=await listCollegeVerificationQueue(context,parsed.data,college.id);}
 catch(e){
  if(!(e instanceof VerificationUnavailableError)&&!(e instanceof VerificationQueueLimitError))throw e;
  return <div className="min-w-0 space-y-5">{header}
   <p role="alert" className="rounded-[var(--lms-control-radius)] border border-border bg-warning-subtle p-4 text-body">{e instanceof VerificationUnavailableError?
    "Verification storage is not yet available. No queue decisions can be made.":
    "The verification queue exceeds its safe scan cap. Narrow server-side filters before reviewing."}</p>
   <Link className="inline-flex min-h-11 items-center font-semibold text-primary-text underline" href={base}>Retry</Link>
  </div>;
 }
 const [policy]=await getDb().select({enabled:profileVerificationSettings.tpoCanVerifyProfiles})
  .from(profileVerificationSettings).where(eq(profileVerificationSettings.collegeId,college.id)).limit(1);
 const query:Record<string,string>={};
 for(const [k,v] of Object.entries(data.filter)){if(v!==undefined&&v!==null)query[k]=String(v);}
 return <div className="min-w-0 space-y-5">{header}
   <TpoVerificationSwitch collegeId={college.id} initialEnabled={policy?.enabled??true}/>
   <SuperAdminVerificationPanel collegeId={college.id} rows={data.rows}
    counts={data.counts} activeTab={data.filter.tab} initialKind={data.filter.kind??"ALL"}
    page={data.page} total={data.total} hasMore={data.hasMore} query={query}/>
 </div>;
}
