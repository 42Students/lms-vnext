import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SessionAuthenticationError } from "@/auth/session";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {ErrorState} from "@/components/ui/error-state";
import {RecruiterPendingInvitations} from "@/components/hr/recruiter-pending-invitations";
import {listSignedInRecruiterPendingInvites} from "@/modules/placements/public-recruiter-invite-accept-service";
import {AuthorizationError} from "@/modules/permissions/policy";
import { TextLink } from "@/components/ui/text-link";

export const dynamic="force-dynamic";
export const metadata: Metadata = {
 robots: { index: false, follow: false, noarchive: true },
 referrer: "no-referrer",
};

/** A signed-in existing recruiter can approve a pending invite before they
 * have any active college grant. This route intentionally lives outside
 * /hr and /recruiter layouts, which require an ACTIVE grant-backed role.
 * The service proves ownership by user ID, never a URL-selected actor.
 */
export default async function RecruiterInvitationsPage(){
 // The authenticated layout and page may resolve concurrently while streaming.
 // A missing/expired session must reach fresh sign-in, not a 500 error
 // boundary (and never the private invitation list).
 let context: Awaited<ReturnType<typeof getCurrentRequestContext>>;
 try {
  context=await getCurrentRequestContext();
 } catch (error) {
  if(error instanceof SessionAuthenticationError){
   const reason=error.code==="SESSION_EXPIRED"?"expired":
    error.code==="SESSION_REVOKED"?"revoked":
    error.code==="RECENT_SIGN_IN_REQUIRED"?"recent":
    error.code==="SESSION_INVALID"?"invalid":null;
   const query=new URLSearchParams({
    ...(reason?{auth:reason}:{}),
    returnTo:"/recruiter-invitations",
   });
   redirect("/login?"+query.toString());
  }
  throw error;
 }
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
    action={<TextLink href="/recruiter-invitations" className="inline-flex min-h-11 items-center">Retry</TextLink>}/>
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
    action={<TextLink href="/dashboard" className="inline-flex min-h-11 items-center">Back to dashboard</TextLink>}/>}
 </div>;
}
