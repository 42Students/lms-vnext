import { redirect } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminOfferingLearningPage } from "@/components/courses/admin-offering-learning-page";

export default async function CollegeOfferingLearningPage({
  params,
  searchParams,
}: {
  params: Promise<{
    offeringId: string;
  }>;
  searchParams:Promise<{deliveryId?:string|string[]}>;
}) {
  const context =
    await getCurrentRequestContext();

  if (!context.membership) {
    redirect("/dashboard");
  }

  const { offeringId } = await params;
  if (!z.uuid().safeParse(offeringId).success) {
    const legacyLink=/^(?:[0-9]+|crs-[a-z0-9-]+)$/i.test(offeringId);
    return <div className="min-w-0 space-y-5">
      <PageHeader title="Course offering unavailable" />
      <ErrorState title={legacyLink?"Legacy course link requires a course lookup":"Invalid course offering link"}
        description={legacyLink
          ? "Older course IDs and course slugs do not identify a unique semester offering. Choose the college's current course offering; no unrelated college data is opened."
          : "This link does not contain a valid course offering identifier."}
        action={<Link href="/college/courses" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Browse course offerings</Link>} />
    </div>;
  }
  const query=await searchParams;
  const selected=Array.isArray(query.deliveryId)?null:query.deliveryId;
  if (query.deliveryId!==undefined && (!selected || !z.uuid().safeParse(selected).success)) {
    return <div className="min-w-0 space-y-5">
      <PageHeader title="Course section unavailable" />
      <ErrorState title="Invalid section selection"
        description="This section link is invalid. Clear the selection to view the authorized course offering."
        action={<Link href={`/college/courses/offerings/${encodeURIComponent(offeringId)}`}
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear section selection</Link>} />
    </div>;
  }
  const deliveryId=selected??null;

  return (
    <AdminOfferingLearningPage
      key={offeringId+":"+ (deliveryId??"all")}
      context={context}
      offeringId={offeringId}
      deliveryId={deliveryId}
      eyebrow="College Admin · Courses"
      backHref="/college/courses"
    />
  );
}
