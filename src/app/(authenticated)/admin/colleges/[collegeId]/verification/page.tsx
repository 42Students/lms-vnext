import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import {
  getSuperAdminTenantLifecycleDetail,
} from "@/modules/colleges/admin-tenant-lifecycle-service";
import { CollegeServiceError } from "@/modules/colleges/service";
import { requirePermission } from "@/modules/permissions/policy";

/**
 * Fail closed until the cross-role verification workspace is merged.
 * Never show a read/write verification UI that bypasses its document and
 * review-authority checks. The selected college is resolved server-side.
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · Verification"
        title={college.name}
        description="College-scoped learner education and identity verification."
      />
      <section role="status" className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Review workspace not yet available</h2>
        <p className="mt-2 text-sm text-body">
          The shared staff verification workspace is not integrated here yet.
          No profile can be approved, returned, or messaged from this page.
        </p>
        <Link
          href="/admin/verification"
          className="mt-4 inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text"
        >
          Back to verification entry
        </Link>
      </section>
    </div>
  );
}
