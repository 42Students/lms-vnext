import Link from "next/link";
import {redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoPlacementTeam} from "@/modules/placements/tpo-settings-people-service";
import {parseTpoTeamTab} from "@/modules/placements/tpo-team-tabs-model";
import {TPO_TEAM_ROLE_LABELS} from "@/modules/placements/tpo-settings-read-model";

const tabSchema=z.object({tab:z.enum(["conversations","people"]).optional()}).strict();
export default async function TpoTeamPage({searchParams}:{
 searchParams:Promise<{tab?:string|string[]}>}) {
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const raw=await searchParams;
 const parsed=tabSchema.safeParse({tab:Array.isArray(raw.tab)?raw.tab[0]:raw.tab});
 const tab=parsed.success?parseTpoTeamTab(parsed.data.tab):"conversations";
 const team=await getTpoPlacementTeam(context,context.membership.collegeId);
 return <div className="space-y-6">
  <PageHeader eyebrow="TPO · Internal" title="Placement Team"
   description="People are taken from active college memberships and recorded coordinator assignments, not employer conversations." />
  <nav aria-label="Team tabs" className="flex flex-wrap gap-2">
   {(["conversations","people"] as const).map(item=><Link key={item} href={"/tpo/team?tab="+item}
     aria-current={tab===item?"page":undefined}
     className={tab===item?"rounded-md bg-primary px-4 py-3 text-sm text-on-primary":"rounded-md border border-border px-4 py-3 text-sm text-body"}>
    {item==="people"?"People":"Conversations"}
   </Link>)}
  </nav>
  {tab==="people"?<section className="space-y-4">
    <p role="status" className="text-sm text-body">{team.summary.total} active placement-team members</p>
    {team.members.length?<ul className="grid gap-3 sm:grid-cols-2">
      {team.members.map(member=><li key={member.membershipId} className="min-w-0 rounded-xl border border-border bg-surface p-4">
       <h2 className="break-words font-semibold text-foreground">{member.displayName}</h2>
       <p className="mt-2 text-sm text-body">{member.roles.map(role=>TPO_TEAM_ROLE_LABELS[role]).join(" · ")}</p>
       {member.studentDuties.length?<p className="mt-2 text-xs text-muted-foreground">
         {member.studentDuties.length} recorded drive-day duties
       </p>:null}
      </li>)}
    </ul>:<EmptyState title="No active team assignments" description="No members match this college's currently active role evidence." />}
  </section>:<section className="rounded-xl border border-border bg-surface p-5">
    <h2 className="font-semibold text-foreground">Internal conversations</h2>
    <p className="mt-2 text-sm text-body">Private placement-team threads require the separate team-messaging tables. Recruiter messages are not treated as internal team conversations. No messages have been sent.</p>
    <Link href="/tpo/messages" className="mt-3 inline-flex min-h-11 items-center text-primary-text">
      Open existing recruiter communications
    </Link>
  </section>}
 </div>;
}
