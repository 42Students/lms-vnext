import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementJobCreateWorkspace } from "@/components/placements/placement-job-create-workspace";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function TpoNewPlacementPage({searchParams}:{
 searchParams:Promise<{company?:string|string[]}>
}) {
  const raw=await searchParams;
  const company=Array.isArray(raw.company)?raw.company[0]:raw.company;
  const context = await getCurrentRequestContext();
  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }
  return (
    <div className="min-w-0 space-y-4">
      <nav aria-label="Drive creation options" className="flex min-w-0 flex-wrap items-center gap-2">
      <Link href="/tpo/placements/new/draft" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 py-2 text-sm font-semibold text-[var(--lms-teal-deep)] md:min-h-9">
        Quick draft: Step 1 →
      </Link>
      <Link href="/tpo/placements/recorded-outside" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)] md:min-h-9">
        Record a drive that happened outside LMS
      </Link>
      </nav>
      <PlacementJobCreateWorkspace
        context={context}
        collegeId={context.membership.collegeId}
        eyebrow="TPO"
        basePath="/tpo/placements"
        initialCompanyName={company?.trim().slice(0,150)??""}
      />
    </div>
  );
}
