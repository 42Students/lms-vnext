import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {ErrorState} from "@/components/ui/error-state";
import {RecruiterPendingInvitations} from "@/components/hr/recruiter-pending-invitations";
import {listSignedInRecruiterPendingInvites} from "@/modules/placements/public-recruiter-invite-accept-service";
import {AuthorizationError} from "@/modules/permissions/policy";

export const dynamic="force-dynamic";

/** A signed-in existing recruiter can approve a pending invite before they
 * have any active college grant. This route intentionally lives outside
 * /hr and /recruiter layouts, which require an ACTIVE grant-backed role.
 * The service proves ownership by user ID, never a URL-selected actor.
 */
export default async function RecruiterInvitationsPage(){
 const context=await getCurrentRequestContext();
 if(context.user.platformStatus!=="ACTIVE")throw new AuthorizationError("placements.recruiter.read");
 let invitations:Awaited<ReturnType<typeof listSignedInRecruiterPendingInvites>>;
 try{
  invitations=await listSignedInRecruiterPendingInvites(context);
 }catch(error){
  if(error instanceof AuthorizationError)throw error;
  return <div className="min-w-0 space-y-4">
   <PageHeader title="Recruiter invitations"/>
   <ErrorState title="Could not load your invitations"
    description="The invitation list is unavailable. No invitation has been accepted or declined."
    action={<Link href="/recruiter-invitations" className="font-semibold text-link underline">Retry</Link>}/>
  </div>;
 }
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Recruiter invitations"
   description="Review invitations sent to your signed-in recruiter identity before entering a college workspace."/>
  {invitations.length?
   <RecruiterPendingInvitations invitations={invitations}
    total={invitations.length} hasMore={false}/>:
   <EmptyState title="No pending recruiter invitations"
    description="Any college invitations awaiting your decision will appear here. You can still use other authorized roles."
    action={<Link href="/dashboard" className="font-semibold text-link underline">Back to dashboard</Link>}/>}
 </div>;
}
