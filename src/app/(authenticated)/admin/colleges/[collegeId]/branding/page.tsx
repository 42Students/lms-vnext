import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeBrandingPreview } from "@/components/admin/college-branding-preview";
import { getSuperAdminCollegeBrandingPreview } from "@/modules/colleges/admin-branding-preview-service";
import { collegeIdSchema } from "@/modules/colleges/validation";

export default async function SuperAdminCollegeBrandingPage({
  params,
}: {
  params: Promise<{ collegeId: string }>;
}) {
  const { collegeId } = await params;
  if (!collegeIdSchema.safeParse(collegeId).success) {
    notFound();
  }

  const context = await getCurrentRequestContext();
  const branding = await getSuperAdminCollegeBrandingPreview(context, collegeId);
  if (!branding) notFound();

  return <CollegeBrandingPreview branding={branding} />;
}
