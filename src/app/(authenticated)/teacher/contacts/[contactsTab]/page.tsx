import {Button} from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import {parseFacultyContactsQuery} from "@/modules/courses/faculty-contacts-filter-model";
import {facultyContactDirectoryQuery} from "@/modules/courses/faculty-contact-detail-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  FacultyContactsPagination,
  FacultyContactsTable,
} from "@/components/courses/faculty-contacts-table";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { listFacultyContacts } from "@/modules/courses/faculty-contacts-service";

const tabs = {
  allContacts: {
    label: "All Contacts",
    value: "ALL" as const,
  },
  teachers: {
    label: "Teachers",
    value: "FACULTY" as const,
  },
  students: {
    label: "Students",
    value: "LEARNER" as const,
  },
};

export default async function FacultyContactsPage({
  params,
  searchParams,
}: {
  params: Promise<{ contactsTab: string }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const { contactsTab } = await params;
  if (!(contactsTab in tabs)) {
    redirect("/teacher/contacts/allContacts");
  }

  const selected =
    tabs[contactsTab as keyof typeof tabs];
  const raw=await searchParams;
  const filters=parseFacultyContactsQuery(raw);
  if(!filters)return <section role="alert" className="space-y-3 p-5">
    <PageHeader title="Invalid directory filters" />
    <Link href={"/teacher/contacts/"+contactsTab}
      className="inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
      Return to Contacts
    </Link>
  </section>;
  const {page,pageSize,search}=filters;
  const context = await getCurrentRequestContext();
  const result = await listFacultyContacts(
    context,
    {
      tab: selected.value,
      search,
      page,
      pageSize,
    },
  );

  const baseHref =
    `/teacher/contacts/${contactsTab}`;

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader
        title={selected.label}
      />

      <nav
        aria-label="Contact types"
        className="flex flex-wrap gap-2"
      >
        {Object.entries(tabs).map(
          ([key, tab]) => {
            const active = key === contactsTab;
            return (
              <Link
                key={key}
                href={`/teacher/contacts/${key}`}
                aria-current={
                  active ? "page" : undefined
                }
                className={
                  active
                    ? "inline-flex min-h-11 items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] border border-primary bg-primary px-4 text-sm font-semibold text-foreground"
                    : "inline-flex min-h-11 items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:border-primary hover:text-[var(--lms-teal-deep)]"
                }
              >
                {tab.label}
              </Link>
            );
          },
        )}
      </nav>

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="m-0 text-lg font-semibold text-foreground">
              {selected.label}
            </h2>
            <p className="mt-1 text-sm text-body" role="status" aria-live="polite">
              {result.total}{" "}
              {result.total === 1
                ? "contact"
                : "contacts"}
            </p>
          </div>
          <form
            key={result.search + ":" + result.pageSize}
            action={baseHref}
            className="flex w-full max-w-2xl flex-wrap items-end gap-2"
          >
            <label className="min-w-0 flex-1 text-xs font-semibold text-body">
              Search contacts
              <Input
                className="mt-1.5"
                name="q"
                maxLength={200}
                defaultValue={result.search}
                placeholder="Name or department"
              />
            </label>
            <label className="text-xs font-semibold text-body">
              Contacts per page
              <select name="pageSize" aria-label="Contacts per page"
                defaultValue={String(result.pageSize)}
                className="mt-1.5 block min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>
            <Button type="submit" variant="primary">
              Search
            </Button>
          </form>
        </div>
        {result.search ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              Results for “{result.search}”
            </span>
            <Link
              href={baseHref}
              className="font-semibold text-[var(--lms-teal-deep)] hover:underline inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]"
            >
              Clear search
            </Link>
          </div>
        ) : null}
      </section>

      <FacultyContactsTable
        items={result.items}
        showRoles={selected.value === "ALL"}
        detailBaseHref={baseHref}
        detailQuery={facultyContactDirectoryQuery({q:result.search,page:String(result.page),pageSize:String(result.pageSize)})}
      />
      <FacultyContactsPagination
        page={result.page}
        totalPages={result.totalPages}
        baseHref={baseHref}
        search={result.search}
        pageSize={result.pageSize}
      />
    </div>
  );
}
