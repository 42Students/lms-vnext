import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getMentorAccountOverview} from
 "@/modules/projects/mentor-account-overview-service";
import {AccountActions} from "@/components/shell/account-actions";
import {PageHeader} from "@/components/ui/page-header";

export const dynamic="force-dynamic";
export default async function MentorAccountPage(){
 const context=await getCurrentRequestContext();
 if(context.user.platformStatus!=="ACTIVE"||
    context.membership?.status!=="ACTIVE"||
    !context.membership.roles.includes("MENTOR"))
   redirect("/dashboard");
 const account=await getMentorAccountOverview(context);
 return <div className="mx-auto max-w-3xl space-y-5">
  <PageHeader title="Mentor · My account"
    description="Your current college, contact details and assigned project teams."/>
  <section aria-label="Personal details" className="space-y-3 border-y border-border py-4">
   <h2 className="text-lg font-semibold">Profile details</h2>
   <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <div><dt className="text-sm text-muted-foreground">Name</dt>
      <dd className="font-medium">{account.name}</dd></div>
    <div><dt className="text-sm text-muted-foreground">College</dt>
      <dd className="font-medium">{account.collegeName}
        {" "}({account.collegeCode})</dd></div>
    <div><dt className="text-sm text-muted-foreground">Email</dt>
      <dd className="break-all">{account.email??"Not recorded"}</dd></div>
    <div><dt className="text-sm text-muted-foreground">Phone</dt>
      <dd>{account.phone??"Not recorded"}</dd></div>
   </dl>
   <p className="text-sm text-muted-foreground">
    Login email, phone and college assignment are identity-managed;
    changing them requires an authorized account workflow.
   </p>
   <Link className="inline-flex min-h-11 items-center text-link underline"
     href={account.hasFacultyProfile?"/teacher/profile/details":"/account/security"}>
      Edit available account details →
   </Link>
  </section>
  <section aria-label="Mentor teams and courses" className="space-y-3">
   <h2 className="text-lg font-semibold">Current Mentor assignments</h2>
   {account.projectsEnabled?<>
     <p><strong>{account.teamCount}</strong> assigned
       {" "}{account.teamCount===1?"team":"teams"} in your current college.</p>
     {account.courses.length?<ul className="list-disc space-y-1 pl-6">
       {account.courses.map(course=><li key={course}>{course}</li>)}
     </ul>:<p>No course label is recorded for your current assigned teams.</p>}
     <Link className="inline-flex min-h-11 items-center text-link underline"
       href="/mentor/projects">Open my teams →</Link>
   </>:<p>Project access is disabled for this college.</p>}
  </section>
  <section aria-label="Account actions" className="space-y-3 border-t border-border pt-4">
   <h2 className="text-lg font-semibold">Account actions</h2>
   <AccountActions variant="other" showNotifications={false}/>
  </section>
 </div>;
}
