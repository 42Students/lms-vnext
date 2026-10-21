import Link from "next/link";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {profileVerificationSettings} from "@/db/schema/profile-verification";
import {TpoVerificationSwitch} from "@/components/verification/TpoVerificationSwitch";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {Disclosure} from "@/components/ui/disclosure";
import {ErrorState} from "@/components/ui/error-state";
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
 const header=<PageHeader title={college.name}
  description="College-scoped learner Education and Identity verification. Review only the currently selected college."
  actions={<PageBackLink href={`/admin/colleges/${encodeURIComponent(college.id)}`} label="College setup"/>}/>;
 if(!parsed?.success)return <div className="min-w-0 space-y-[var(--lms-space-6)]">{header}
  <ErrorState title="Invalid verification filters" description="Choose a valid set of verification filters."
   action={<Link href={base} className="inline-flex min-h-11 items-center font-[650] text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Reset filters</Link>}/>
 </div>;
 let data:Awaited<ReturnType<typeof listCollegeVerificationQueue>>;
 try{data=await listCollegeVerificationQueue(context,parsed.data,college.id);}
 catch(e){
  if(!(e instanceof VerificationUnavailableError)&&!(e instanceof VerificationQueueLimitError))throw e;
  return <div className="min-w-0 space-y-[var(--lms-space-6)]">{header}
   <ErrorState title="Verification queue unavailable"
    description={e instanceof VerificationUnavailableError?
     "Verification storage is not yet available. No queue decisions can be made.":
     "The verification queue exceeds its safe scan cap. Narrow server-side filters before reviewing."}
    action={<Link className="inline-flex min-h-11 items-center font-[650] text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4" href={base}>Retry</Link>}/>
  </div>;
 }
 const [policy]=await getDb().select({enabled:profileVerificationSettings.tpoCanVerifyProfiles})
  .from(profileVerificationSettings).where(eq(profileVerificationSettings.collegeId,college.id)).limit(1);
 const query:Record<string,string>={};
 for(const [k,v] of Object.entries(data.filter)){if(v!==undefined&&v!==null)query[k]=String(v);}
 return <div className="min-w-0 space-y-[var(--lms-space-6)]">{header}

   <SuperAdminVerificationPanel key={college.id+":"+JSON.stringify(query)} collegeId={college.id} rows={data.rows}
    counts={data.counts} activeTab={data.filter.tab} initialKind={data.filter.kind??"ALL"}
    page={data.page} total={data.total} hasMore={data.hasMore} query={query} truncated={data.truncated}/>
   <Disclosure title="Placement-cell verification setting" className="min-w-0" contentClassName="pt-[var(--lms-space-3)] pb-[var(--lms-space-4)]">
   <TpoVerificationSwitch collegeId={college.id} initialEnabled={policy?.enabled??true}/>
   </Disclosure>
 </div>;
}
