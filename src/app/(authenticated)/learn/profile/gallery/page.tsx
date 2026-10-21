import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { LearnerImageGallery } from "@/components/profile/learner-image-gallery";

export default async function LearnerGalleryPage() {
  if (!hasMembershipRole(await getCurrentRequestContext(), "LEARNER"))
    redirect("/dashboard");
  return <div className="space-y-4">
    <PageHeader title="My Photos" description="Profile photo gallery" />
    <LearnerImageGallery />
  </div>;
}
