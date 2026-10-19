import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { TpoPublicJoinLinkCard } from "@/components/tpo/tpo-public-join-link-card";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoPublicJoinLinkStatus } from "@/modules/placements/tpo-public-join-link-service";

export const dynamic = "force-dynamic";

export default async function TpoRecruiterPublicLinkPage() {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const initial = await getTpoPublicJoinLinkStatus(context, "COLLEGE");
  return (
    <div className="space-y-6">
      <TpoSettingsNav active="public-link" />
      <PageHeader title="Public recruiter link" />
      <TpoPublicJoinLinkCard initial={initial} scope="COLLEGE" />
    </div>
  );
}
