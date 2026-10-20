import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { resolveSuperAdminSectionDetail } from "@/modules/admin-ui/super-admin-section-detail";
import { AcademicsSectionPage } from "@/components/academics/academics-section-page";

export default async function SuperAdminSectionOperationsPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const context = await getCurrentRequestContext();

  if (!context.adminScope?.collegeId) {
    redirect("/admin/academics");
  }

  const { sectionId } = await params;
  if (!(await resolveSuperAdminSectionDetail(context, sectionId))) notFound();

  return (
      <AcademicsSectionPage
      context={context}
      sectionId={sectionId}
      eyebrow="Super Admin · Academics"
      backHref="/admin/academics"
      />
  );
}
