import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { hasActiveMembership, hasMembershipRole } from "@/modules/identity/context";

export const dynamic = "force-dynamic";

/** Legacy /mentor landing: feature enabled -> Projects; disabled -> no 404
 * and Notifications remain reachable. Failure to resolve feature policy fails closed.
 */
export default async function MentorLandingPage() {
  const context = await getCurrentRequestContext();
  if (!hasActiveMembership(context) || !hasMembershipRole(context,"MENTOR")) {
    redirect("/dashboard");
  }
  const access = await resolveOptionalModuleAccess(context).catch(()=>null);
  if (access?.projects.enabled === true) {
    redirect("/mentor/projects");
  }
  return <div className="space-y-6">
    <PageHeader eyebrow="Mentor" title="Projects is currently unavailable"
      description="Projects is disabled for this account. You can still check notifications." />
    <div className="rounded-xl border border-border bg-surface p-6">
      <p className="text-sm text-body">
        Contact your college administrator if you need access to Projects.
      </p>
      <Link href="/mentor/notifications"
        className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
        View notifications
      </Link>
    </div>
  </div>;
}
