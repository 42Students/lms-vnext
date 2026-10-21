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
import {requireSuperAdminVerificationCollege,VerificationAccessCheckError} from "@/modules/verification/super-admin-scope";
import {AuthorizationError} from "@/modules/permissions/policy";

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
 }catch(e){
  if(e instanceof CollegeServiceError&&e.code==="COLLEGE_NOT_FOUND")notFound();
  if(e instanceof AuthorizationError)return <div className="min-w-0 space-y-[var(--lms-space-6)]">
   <PageHeader title="Verification" actions={<PageBackLink href="/admin/colleges" label="Colleges"/>}/>
   <ErrorState title="Verification access denied" description="Your current account and college scope do not permit reviewing this verification queue."/>
  </div>;
  if(e instanceof VerificationAccessCheckError)return <div className="min-w-0 space-y-[var(--lms-space-6)]">
   <PageHeader title="Verification" actions={<PageBackLink href="/admin/colleges" label="Colleges"/>}/>
   <ErrorState title="Could not check your verification access" description="The access check could not be completed. No verification records were opened."
    action={<Link href={`/admin/colleges/${encodeURIComponent(collegeId)}/verification?retry=1`} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry</Link>}/>
  </div>;
  throw e;
 }
 const base=`/admin/colleges/${encodeURIComponent(college.id)}/verification`;
 const raw=await searchParams;
 const invalidPaging=["page","pageSize"].some(key=>{
  const value=raw[key];
  return value!==undefined&&(typeof value!=="string"||!/^[0-9]+$/.test(value));
 });
 const parsed=invalidPaging||Object.values(raw).some(Array.isArray)?null:verificationQueueFilters.safeParse(Object.fromEntries(
  Object.entries(raw).filter(([,v])=>v!==undefined&&v!==""),
 ));
 const header=<PageHeader title="Verification"
  eyebrow={college.name} description="College-scoped learner Education and Identity verification. Review only the currently selected college."
  actions={<PageBackLink href={`/admin/colleges/${encodeURIComponent(college.id)}`} label="College setup"/>}/>;
 if(!parsed?.success)return <div className="min-w-0 space-y-[var(--lms-space-6)]">{header}
  <ErrorState title="Invalid verification filters" description="Choose a valid set of verification filters."
   action={<Link href={base} className="inline-flex min-h-11 items-center font-[650] text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Reset filters</Link>}/>
 </div>;
 let data:Awaited<ReturnType<typeof listCollegeVerificationQueue>>;
 try{data=await listCollegeVerificationQueue(context,parsed.data,college.id);}
 catch(e){
  if(e instanceof AuthorizationError)throw e;
  const safeParams=new URLSearchParams();
  for(const [key,value] of Object.entries(raw)){if(typeof value==="string")safeParams.set(key,value);}
  safeParams.set("retry",String(Date.now()));
  const retryHref=base+"?"+safeParams.toString();
  return <div className="min-w-0 space-y-[var(--lms-space-6)]">{header}
   <ErrorState title={e instanceof VerificationUnavailableError||e instanceof VerificationQueueLimitError?"Verification queue unavailable":"Could not load the queue"}
    description={e instanceof VerificationUnavailableError?
     "Verification storage is not yet available. No queue decisions can be made.":
     e instanceof VerificationQueueLimitError?"The verification queue exceeds its safe scan cap. Narrow server-side filters before reviewing.":"Could not load the queue. Retry without losing your selected filters."}
    action={<Link className="inline-flex min-h-11 items-center font-[650] text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4" href={retryHref}>Retry</Link>}/>
  </div>;
 }
 const policyResult=await getDb().select({enabled:profileVerificationSettings.tpoCanVerifyProfiles})
  .from(profileVerificationSettings).where(eq(profileVerificationSettings.collegeId,college.id))
  .limit(1).then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}));
 const policy=policyResult.ok?policyResult.value[0]:null;
 const query:Record<string,string>={};
 for(const [k,v] of Object.entries(data.filter)){if(v!==undefined&&v!==null)query[k]=String(v);}
 return <div className="min-w-0 space-y-[var(--lms-space-6)]">{header}
   <section aria-label="Verification access" className="rounded border border-border p-4">
    <h2 className="text-lg font-semibold">Verification settings</h2>
    <p className="mt-1 text-sm text-body">Super Admin may review the selected college's verification queue. The placement cell may verify profiles only when separately enabled below.</p>
    {!policyResult.ok?<ErrorState title="Could not load placement-cell verification settings"
     description="The latest setting is unverified. No change can be made until the policy read succeeds."
     action={<Link href={base} className="font-semibold text-link underline">Retry settings</Link>}/>:
     <TpoVerificationSwitch collegeId={college.id} initialEnabled={policy?.enabled??true}/>}
   </section>
   <SuperAdminVerificationPanel key={college.id+":"+JSON.stringify(query)} collegeId={college.id} rows={data.rows}
    counts={data.counts} activeTab={data.filter.tab} initialKind={data.filter.kind??"ALL"}
    page={data.page} total={data.total} hasMore={data.hasMore} query={query} truncated={data.truncated}/>

 </div>;
}
