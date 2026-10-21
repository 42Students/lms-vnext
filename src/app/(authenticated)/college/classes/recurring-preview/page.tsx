import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeRecurringRouteModal } from "./route-modal";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { listRecurringPreviewOptions } from "@/modules/academics/college-recurring-preview-service";

export default async function CollegeRecurringPreviewPage({
  searchParams,
}: { searchParams: Promise<{classId?:string|string[]}> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const options = await listRecurringPreviewOptions(context);
  const query = await searchParams;
  const classId = typeof query.classId === "string" &&
    options.classes.some(row => row.id === query.classId) ? query.classId : "";
  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Classes & Sections"
      description="Preview weekday/time patterns against persisted class, faculty and lecture hall scheduling conflicts in India Standard Time."
      actions={<PageBackLink href="/college/classes" label="Back to classes" />}/>
    <p className="text-sm text-body">Recurring class scheduling opens in a dialog as in the Classes list. Closing returns to the class roster without creating sessions.</p>
    <CollegeRecurringRouteModal key={classId || "unselected"} options={{
      ...options,defaultSectionId:classId,
      classes:options.classes.map(row=>({...row,updatedAt:row.updatedAt.toISOString()})),
    }} />
  </div>;
}
