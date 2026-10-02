import { getCurrentRequestContext } from "@/auth/request-context";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { listColleges } from "@/modules/colleges/service";

type CollegeRow = Awaited<ReturnType<typeof listColleges>>[number];

const columns: DataTableColumn<CollegeRow>[] = [
  {
    key: "college",
    header: "College",
    cell: (college) => (
      <div>
        <p className="m-0 font-semibold text-foreground">
          {college.name}
        </p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {college.code}
        </p>
      </div>
    ),
  },
  {
    key: "location",
    header: "Location",
    cell: (college) =>
      [college.city, college.state, college.country]
        .filter(Boolean)
        .join(", ") || "—",
  },
  {
    key: "created",
    header: "Created",
    cell: (college) =>
      college.createdAt.toISOString().slice(0, 10),
  },
];

export default async function CollegesPage() {
  const context = await getCurrentRequestContext();
  const colleges = await listColleges(context);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Colleges"
        description="Active colleges across the platform. Tenant ownership remains enforced by the server."
      />
      <DataTable
        columns={columns}
        rows={colleges}
        getRowKey={(college) => college.id}
      />
    </div>
  );
}
