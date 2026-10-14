import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeRecurringPreview } from "@/components/academics/college-recurring-preview";
import { PageHeader } from "@/components/ui/page-header";
import { listRecurringPreviewOptions } from "@/modules/academics/college-recurring-preview-service";

export default async function CollegeRecurringPreviewPage() {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const options = await listRecurringPreviewOptions(context);
  return <div className="space-y-6">
    <PageHeader eyebrow="College Admin · Academic Setup" title="Recurring Schedule Preview"
      description="Preview weekday/time patterns against persisted class, faculty and lecture hall scheduling conflicts in India Standard Time." />
    <CollegeRecurringPreview {...options} classes={options.classes.map(row=>({...row,updatedAt:row.updatedAt.toISOString()}))} />
  </div>;
}
