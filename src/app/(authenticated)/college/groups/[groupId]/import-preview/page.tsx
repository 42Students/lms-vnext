import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeGroupImportPreview } from "@/components/groups/college-group-import-preview";
import { PageHeader } from "@/components/ui/page-header";
import { GroupCsvPreviewNotFoundError } from "@/modules/groups/college-group-csv-preview-service";
import { getCollegeGroupDetail } from "@/modules/groups/admin-read-service";
import { notFound } from "next/navigation";

export default async function CollegeGroupImportPreviewPage({
  params,
}: { params: Promise<{ groupId: string }> }) {
  const context = await getCurrentRequestContext();
  const { groupId } = await params;
  let group;
  try {
    const detail = await getCollegeGroupDetail(context, groupId);
    group = detail.group;
  } catch (error) {
    if (error instanceof GroupCsvPreviewNotFoundError ||
      (error instanceof Error && (error.name === "GroupReadError" || error.name === "ZodError"))) {
      notFound();
    }
    throw error;
  }
  if (group.kind !== "STUDY_GROUP") notFound();
  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="College Admin · Student groups"
      title={"CSV validation · " + group.name}
      description="Preview learner membership import eligibility without creating or changing group members."
      actions={<Link href={"/college/groups/" + encodeURIComponent(group.id)}
        className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Back to group
      </Link>} />
    <CollegeGroupImportPreview groupId={group.id} />
  </div>;
}
