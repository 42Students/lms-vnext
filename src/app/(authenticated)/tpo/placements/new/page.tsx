import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementJobCreateWorkspace } from "@/components/placements/placement-job-create-workspace";
import { Alert } from "@/components/ui/alert";
import { hasMembershipRole } from "@/modules/identity/context";
import { ButtonLink } from "@/components/ui/button-link";

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
      <ButtonLink variant="secondary" href="/tpo/placements/new/draft">
        Quick draft: Step 1 →
      </ButtonLink>
      <ButtonLink variant="secondary" aria-label="Record a drive that happened outside LMS (no student application flow)" href="/tpo/placements/recorded-outside">
        Record a drive that happened outside LMS (no applications)
      </ButtonLink>
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
