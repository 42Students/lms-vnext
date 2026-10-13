import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeBrandingForm } from "@/components/admin/college-branding-form";
import { PageHeader } from "@/components/ui/page-header";
import { getCollegeBranding } from "@/modules/colleges/branding-service";
import { can } from "@/modules/permissions/policy";

export default async function CollegeBrandingPage() {
  const context = await getCurrentRequestContext();
  const membership = context.membership;

  if (!membership) {
    redirect("/dashboard");
  }

  const branding = await getCollegeBranding(context, membership.collegeId);
  const canEdit = can(context, "college.manage", {
    organizationId: membership.organizationId,
    collegeId: membership.collegeId,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="Branding"
        description="Logo, colours and support details shown on your college's sign-in page."
      />
      <CollegeBrandingForm
        collegeId={membership.collegeId}
        collegeName={branding.collegeName}
        canEdit={canEdit}
        initial={{
          logoUrl: branding.logoUrl,
          faviconUrl: branding.faviconUrl,
          loginBackgroundUrl: branding.loginBackgroundUrl,
          loginBackgroundUrlMobile: branding.loginBackgroundUrlMobile,
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          supportEmail: branding.supportEmail,
          supportPhone: branding.supportPhone,
          termsUrl: branding.termsUrl,
          privacyUrl: branding.privacyUrl,
        }}
      />
    </div>
  );
}
