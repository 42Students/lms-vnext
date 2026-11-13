import { notFound } from "next/navigation";
import { UXAdminCollegeRecoveryFixture } from "@/components/ux/ux-admin-college-recovery-fixture";

import { env } from "@/config/env";
export const dynamic = "force-dynamic";

/** Development-only browser acceptance. This fixture is never served in production. */
export default function UXAdminCollegeRecoveryPreviewPage() {
  if (process.env.NODE_ENV !== "development" ||
      env.UX_ADMIN_COLLEGE_RECOVERY_FIXTURE !== "1") notFound();
  return <UXAdminCollegeRecoveryFixture />;
}
