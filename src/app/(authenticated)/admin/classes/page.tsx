import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminScopedReadPage } from "@/components/admin/admin-scoped-read-page";
import { CollegeClassCreate, CollegeClassRowActions } from "@/components/academics/college-section-management";
import { listAdminClasses } from "@/modules/admin-ui/super-admin-classes-service";
import { listCollegeClasses } from "@/modules/academics/college-structure-directory-service";
import { listCollegeSectionOptions } from "@/modules/academics/college-section-mutation-service";
import { collegeClassQuerySchema } from "@/modules/academics/college-structure-directory-model";

const statuses = ["ALL", "ACTIVE", "ARCHIVED"] as const;
type Params = Record<string, string | string[] | undefined>;
export default async function SuperAdminClassesPage({ searchParams }: {
  searchParams: Promise<Params>;
}) {
  const context = await getCurrentRequestContext();
  const raw = await searchParams;
  const selected = context.adminScope?.collegeId;
  const filter = collegeClassQuerySchema.safeParse({
    q: raw.q, status: raw.status, page: raw.page,
  });
  const [data, options] = selected && filter.success
    ? await Promise.all([
        listCollegeClasses(context, filter.data),
        listCollegeSectionOptions(context),
      ])
    : [null, null];
  return <div className="space-y-6">
    {data && options ? <>
      <CollegeClassCreate cohorts={options.cohorts} periods={options.periods} />
      <section aria-label="Manage classes" className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Manage classes</h2>
        <p className="text-sm text-muted-foreground">Edit class names, codes and capacities within the selected college.</p>
        {data.items.length === 0 ? <p>No matching classes on this page.</p> :
          <div className="overflow-x-auto"><table className="w-full min-w-[38rem] text-left text-sm">
            <thead><tr><th className="p-2">Class</th><th className="p-2">Batch</th>
              <th className="p-2">Capacity</th><th className="p-2">Actions</th></tr></thead>
            <tbody>{data.items.map(row => <tr key={row.id} className="border-t border-border">
              <td className="p-2">{row.name} ({row.code})</td>
              <td className="p-2">{row.cohortName}</td>
              <td className="p-2">{row.capacity ?? "—"}</td>
              <td className="p-2"><CollegeClassRowActions row={row} /></td>
            </tr>)}</tbody>
          </table></div>}
        <Link href="/admin/batch-promotion" className="inline-flex min-h-10 items-center font-semibold text-primary-text">
          Batch Promotion →
        </Link>
      </section>
    </> : null}
    <AdminScopedReadPage title="Classes / Sections" path="/admin/classes" statuses={statuses}
      exportPath="/api/admin/classes/export" exportFilename="super-admin-classes-ist.csv"
      description="Manage college-owned classes within the selected safety scope."
      searchParams={Promise.resolve(raw)} loader={query => listAdminClasses(context, query)} />
  </div>;
}
