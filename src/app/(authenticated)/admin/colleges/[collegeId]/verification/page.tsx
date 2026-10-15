import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { VerificationWorkspace } from "@/components/verification/VerificationWorkspace";
import { PageHeader } from "@/components/ui/page-header";
import { getSuperAdminTenantLifecycleDetail } from "@/modules/colleges/admin-tenant-lifecycle-service";
import { CollegeServiceError } from "@/modules/colleges/service";
import { requirePermission } from "@/modules/permissions/policy";

/**
 * Reuses the cross-role queue UI, but fails closed until the staff queue
 * repository and audited review mutation are connected. Never claim an empty
 * queue while a read is unavailable or derive rows from untrusted input.
 */
export default async function CollegeVerificationPage({
  params,
}: {
  params: Promise<{ collegeId: string }>;
}) {
  const { collegeId } = await params;
  const context = await getCurrentRequestContext();
  let college: Awaited<ReturnType<typeof getSuperAdminTenantLifecycleDetail>>;
  try {
    college = await getSuperAdminTenantLifecycleDetail(context, collegeId);
  } catch (error) {
    if (error instanceof CollegeServiceError && error.code === "COLLEGE_NOT_FOUND") {
      notFound();
    }
    throw error;
  }
  requirePermission(context, "profile-verification.review", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Super Admin · Verification"
        title={college.name}
        description="College-scoped learner education and identity verification."
      />
      <VerificationWorkspace
        rows={[]}
        error="The staff queue service is not connected yet. No reviews or messaging can be performed."
      />
    </div>
  );
}
