import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { PageBackLink } from "@/components/ui/page-back-link";
import Link from "next/link";
import {TpoEveryoneControls} from "@/components/tpo/tpo-everyone-controls";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {readTpoTeamEveryone} from "@/modules/placements/tpo-team-everyone-service";
import {AuthorizationError} from "@/modules/permissions/policy";
import {TPO_EVERYONE_DESCRIPTION,TPO_EVERYONE_TITLE,TPO_EVERYONE_WELCOME} from "@/modules/placements/tpo-team-everyone-model";
export const dynamic="force-dynamic";
export default async function TpoEveryonePage({searchParams}:{
 searchParams:Promise<{page?:string|string[]}>,
}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const raw=(await searchParams).page;
 const page=typeof raw==="string"&&/^[1-9][0-9]{0,3}$/.test(raw)?Number(raw):1;
 const result=await readTpoTeamEveryone(context,page).catch(error=>{
  if(error instanceof AuthorizationError)throw error;
  return {status:"FAILED" as const};
 });
 return <div className="min-w-0 space-y-5">
  <PageBackLink href="/tpo/team?tab=conversations" label="Team conversations" />
  <PageHeader title={TPO_EVERYONE_TITLE} description={TPO_EVERYONE_DESCRIPTION} />
  {result.status==="FAILED"?<Alert tone="error">
   <p>Could not load Everyone right now. Your messages were not changed.</p>
   <Link href="/tpo/team/everyone" className="mt-2 inline-flex min-h-11 items-center font-semibold text-link underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 lms-inline-link">Retry Everyone</Link>
  </Alert>:result.status==="NOT_REGISTERED"?<p role="status" className="border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 py-3">
   Everyone is not available until its database migration is registered. No team messages were loaded.
  </p>:<>
   <section className="min-w-0 space-y-3 pt-2">
    <h2 className="text-[16px] font-semibold leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">Everyone conversation</h2>
    {result.rows.length?<ol aria-label="Everyone messages" className="space-y-3">
      {result.rows.map(row=><li key={row.id} className="border-b border-border py-3">
       <p className="text-xs font-medium text-muted-foreground">{row.authorMembershipId===context.membership?.id?"You":row.authorName} ·
        {" "}{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(row.createdAt)} IST</p>
       <p className="mt-2 whitespace-pre-wrap break-words text-sm">{row.body}</p>
      </li>)}
     </ol>:<p role="status" className="text-sm">{TPO_EVERYONE_WELCOME}</p>}
    <nav aria-label="Everyone message pages" className="flex min-w-0 flex-wrap items-center gap-3 text-[13px]">
     {result.page>1?<Link href={"/tpo/team/everyone?page="+(result.page-1)} className="inline-flex min-h-11 items-center text-link underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 lms-inline-link">Newer messages</Link>:null}
     {result.page<result.pages?<Link href={"/tpo/team/everyone?page="+(result.page+1)} className="inline-flex min-h-11 items-center text-link underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 lms-inline-link">Older messages</Link>:null}
    </nav>
   </section>
   <TpoEveryoneControls muted={result.muted} actorUserId={context.user.id}/>
  </>}
 </div>;
}
