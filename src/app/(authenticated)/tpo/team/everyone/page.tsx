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
 return <div className="space-y-5">
  <Link href="/tpo/team?tab=conversations" className="inline-flex min-h-9 sm:min-h-9 items-center text-link lms-inline-link">← Team conversations</Link>
  <header className="space-y-2">
   <h1 className="text-[26px] font-semibold text-[var(--lms-heading)] sm:text-[30px]">{TPO_EVERYONE_TITLE}</h1>
   <p className="text-sm text-body">{TPO_EVERYONE_DESCRIPTION}</p>
  </header>
  {result.status==="FAILED"?<section role="alert" className="border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 py-3">
   <p>Could not load Everyone right now. Your messages were not changed.</p>
   <Link href="/tpo/team/everyone" className="mt-2 inline-flex min-h-9 sm:min-h-9 items-center font-semibold text-link underline lms-inline-link">Retry Everyone</Link>
  </section>:result.status==="NOT_REGISTERED"?<p role="status" className="border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 py-3">
   Everyone is not available until its database migration is registered. No team messages were loaded.
  </p>:<>
   <section className="space-y-3 border-t border-border pt-4">
    <h2 className="font-semibold">Everyone conversation</h2>
    {result.rows.length?<ol aria-label="Everyone messages" className="space-y-3">
      {result.rows.map(row=><li key={row.id} className="border-b border-border py-3">
       <p className="text-xs font-medium text-muted-foreground">{row.authorMembershipId===context.membership?.id?"You":row.authorName} ·
        {" "}{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(row.createdAt)} IST</p>
       <p className="mt-2 whitespace-pre-wrap break-words text-sm">{row.body}</p>
      </li>)}
     </ol>:<p role="status" className="text-sm">{TPO_EVERYONE_WELCOME}</p>}
    <nav aria-label="Everyone message pages" className="flex gap-3 text-sm">
     {result.page>1?<Link href={"/tpo/team/everyone?page="+(result.page-1)} className="text-link underline lms-inline-link">Newer messages</Link>:null}
     {result.page<result.pages?<Link href={"/tpo/team/everyone?page="+(result.page+1)} className="text-link underline lms-inline-link">Older messages</Link>:null}
    </nav>
   </section>
   <TpoEveryoneControls muted={result.muted} actorUserId={context.user.id}/>
  </>}
 </div>;
}
