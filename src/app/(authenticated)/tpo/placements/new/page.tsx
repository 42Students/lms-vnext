import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementJobCreateWorkspace } from "@/components/placements/placement-job-create-workspace";
import { Alert } from "@/components/ui/alert";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function TpoNewPlacementPage({searchParams}:{
 searchParams:Promise<{company?:string|string[]}>
}) {
  const raw=await searchParams;
  const invalidCompany=Array.isArray(raw.company)||typeof raw.company==="string"&&raw.company.length>150;
  const company=typeof raw.company==="string"&&!invalidCompany?raw.company:"";
  const context = await getCurrentRequestContext();
  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }
  return (
    <div className="min-w-0 space-y-4">
      {invalidCompany?<Alert tone="warning">Invalid or repeated company prefills were ignored. Choose a verified company before creating the drive.</Alert>:null}
      <PlacementJobCreateWorkspace
        preFormActions={<nav aria-label="Drive creation options" className="flex min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 sm:flex-row sm:flex-wrap sm:items-center">
      <Link href="/tpo/placements/new/draft" className="inline-flex min-h-11 justify-center items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 py-2 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
        Quick draft: Step 1 →
      </Link>
      <Link aria-label="Record a drive that happened outside LMS (no student application flow)" href="/tpo/placements/recorded-outside" className="inline-flex min-h-11 justify-center items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
        Record a drive that happened outside LMS (no applications)
      </Link>
      </nav>}
        context={context}
        collegeId={context.membership.collegeId}
        eyebrow="TPO"
        basePath="/tpo/placements"
        initialCompanyName={company?.trim().slice(0,150)??""}
      />
    </div>
  );
}
