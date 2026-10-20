import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeRecurringPreview } from "@/components/academics/college-recurring-preview";
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
  return <div className="min-w-0 overflow-x-clip space-y-[var(--lms-space-5)]">
    <PageHeader title="Recurring Schedule Preview"
      description="Preview weekday/time patterns against persisted class, faculty and lecture hall scheduling conflicts in India Standard Time."
      actions={<PageBackLink href="/college/classes" label="Back to classes"/>}/>
    <CollegeRecurringPreview key={classId || "unselected"} {...options} defaultSectionId={classId} classes={options.classes.map(row=>({...row,updatedAt:row.updatedAt.toISOString()}))} />
  </div>;
}
