import { notFound } from "next/navigation";
import { PublicRecruiterJoinForm } from "@/components/placements/public-recruiter-join-form";

/** Development-only UI fixture. All OTP requests are mocked in browser tests. */
export const dynamic = "force-dynamic";

export default function CollegeJoinUXHarnessPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <PublicRecruiterJoinForm
    token={"t".repeat(48)}
    scope="COLLEGE"
    preview={{ kind: "READY", collegeName: "Example College", companyDomain: null }}
  />;
}
