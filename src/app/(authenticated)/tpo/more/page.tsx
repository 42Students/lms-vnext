import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { TpoMoreNavigation } from "@/components/tpo/tpo-more-navigation";

export default async function TpoMorePage() {
  const context =
    await getCurrentRequestContext();

  if (!hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }

  return (
    <div data-testid="tpo.more" className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="TPO · Navigation"
        title="More"
        description="Secondary placement tools, insights and account controls that stay out of your main day-to-day navigation."
      />

      <TpoMoreNavigation />

    </div>
  );
}
