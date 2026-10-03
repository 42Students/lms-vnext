import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
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

  return (
    <AcademicsSectionPage
      context={context}
      sectionId={sectionId}
      eyebrow="Super Admin · Academics"
      backHref="/admin/academics"
    />
  );
}
