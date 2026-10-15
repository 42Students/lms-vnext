import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeStructureDirectory } from "@/components/academics/college-structure-directory";
import { CollegeSlotManager } from "@/components/electives/college-slot-manager";
import { listCollegeElectiveSlotOptions } from "@/modules/electives/college-slot-mutation-service";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  collegeElectiveQuerySchema,
  readCollegeStructureParams,
} from "@/modules/academics/college-structure-directory-model";
import { listCollegeElectives } from "@/modules/academics/college-structure-directory-service";
import { electiveCsvHref } from "@/modules/academics/college-elective-export-model";

export default async function CollegeElectivesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const raw = readCollegeStructureParams(await searchParams);
  const parsed = collegeElectiveQuerySchema.safeParse(raw);
  if (!parsed.success) return <div className="space-y-4">
    <PageHeader eyebrow="College Admin · Academic Setup" title="Electives" />
    <ErrorState title="Invalid elective filters"
      description="The search, program, status or page is invalid. No elective slots were loaded."
      action={<Link href="/college/electives" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  const [data, options] = await Promise.all([
    listCollegeElectives(context, parsed.data),
    listCollegeElectiveSlotOptions(context),
  ]);
  return <div className="space-y-4">
    <Link prefetch={false} download href={electiveCsvHref(data.query)}
      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Export filtered electives CSV
    </Link>
    <CollegeSlotManager options={options} />
    <CollegeStructureDirectory data={data} electiveOptions={options} />
  </div>;
}
