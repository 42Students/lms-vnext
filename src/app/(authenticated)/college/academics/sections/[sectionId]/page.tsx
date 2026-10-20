import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AcademicsSectionPage } from "@/components/academics/academics-section-page";

export default async function CollegeSectionOperationsPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const context = await getCurrentRequestContext();

  if (!context.membership) {
    redirect("/dashboard");
  }

  const { sectionId } = await params;

  return (
    <div className="min-w-0 overflow-x-clip">
    <AcademicsSectionPage
      context={context}
      sectionId={sectionId}
      eyebrow=""
      backHref="/college/academics"
    />
    </div>
  );
}
