import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeAcademicDirectory } from "@/components/academics/college-academic-directory";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  academicDirectorySearchParams,
  collegeBatchDirectorySchema,
} from "@/modules/academics/college-academic-directory-model";
import { listCollegeBatches } from "@/modules/academics/college-academic-directory-service";

export default async function CollegeBatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const params = academicDirectorySearchParams(await searchParams);
  const parsed = collegeBatchDirectorySchema.safeParse(params);
  if (!parsed.success) {
    return <div className="space-y-4">
      <PageHeader eyebrow="College Admin · Academic Setup" title="Batches" />
      <ErrorState title="Invalid batch filters"
        description="The search, program, status or page is invalid. No batches were loaded."
        action={<Link href="/college/batches" className="font-semibold text-primary-text">Clear filters</Link>} />
    </div>;
  }
  return <CollegeAcademicDirectory data={await listCollegeBatches(context, parsed.data)} />;
}
