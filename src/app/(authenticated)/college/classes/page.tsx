import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeStructureDirectory } from "@/components/academics/college-structure-directory";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  collegeStructureQuerySchema,
  readCollegeStructureParams,
} from "@/modules/academics/college-structure-directory-model";
import { listCollegeClasses } from "@/modules/academics/college-structure-directory-service";

export default async function CollegeClassesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const raw = readCollegeStructureParams(await searchParams);
  const parsed = collegeStructureQuerySchema.safeParse(raw);
  if (!parsed.success) return <div className="space-y-4">
    <PageHeader eyebrow="College Admin · Academic Setup" title="Classes" />
    <ErrorState title="Invalid class filters"
      description="The search, program, status or page is invalid. No classes were loaded."
      action={<Link href="/college/classes" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  return <CollegeStructureDirectory data={await listCollegeClasses(context, parsed.data)} />;
}
