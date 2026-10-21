import {Banner} from "@/components/ui/banner";
import AdminCollegeVerification from "@/app/(authenticated)/admin/colleges/[collegeId]/verification/page";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import {can} from "@/modules/permissions/policy";
import {isSuperAdmin} from "@/modules/identity/context";
import {ErrorState} from "@/components/ui/error-state";


/**
 * Safe Super Admin entry point for the college-scoped verification workspace.
 * Do not implicitly select the first college in a global organization.
 */
export default async function AdminVerificationEntry({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const context = await getCurrentRequestContext();
  if(!isSuperAdmin(context)||!can(context,"admin-scope.select"))
    return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader title="Profile verification"/>
      <ErrorState title="Verification access denied"
        description="Your account cannot access Super Admin verification."
        action={<PageBackLink href="/dashboard" label="Back to dashboard" />}/>
    </div>;

  const collegeId = context.adminScope?.collegeId;
  if (collegeId) {
    // Render the chosen college's review queue without leaving the legacy
    // Super Admin Verification workspace route. The child service still
    // enforces the exact college and role for every learner.
    return <AdminCollegeVerification params={Promise.resolve({collegeId})}
      searchParams={searchParams}/>;
  }

  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader
        title="Profile verification"
        description="Students' education and identity, checked against their documents."
      />
      <Banner tone="info" role="status">
        Choose a college at the top to see its students waiting for verification.
      </Banner>
    </div>
  );
}
