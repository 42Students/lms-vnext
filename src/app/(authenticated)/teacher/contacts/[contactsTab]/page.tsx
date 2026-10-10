import Link from "next/link";
import { redirect } from "next/navigation";
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
  }>;
}) {
  const { contactsTab } = await params;
  if (!(contactsTab in tabs)) {
    redirect("/teacher/contacts/allContacts");
  }

  const selected =
    tabs[contactsTab as keyof typeof tabs];
  const query = await searchParams;
  const context = await getCurrentRequestContext();
  const result = await listFacultyContacts(
    context,
    {
      tab: selected.value,
      search: query.q ?? "",
      page: query.page ?? "1",
      pageSize: 20,
    },
  );

  const baseHref =
    `/teacher/contacts/${contactsTab}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Faculty"
        title="Contacts"
        description="Find active people in your college by name, email or phone."
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
                    ? "inline-flex min-h-10 items-center rounded-full border border-primary bg-primary px-4 text-sm font-semibold text-on-primary"
                    : "inline-flex min-h-10 items-center rounded-full border border-border bg-surface px-4 text-sm font-semibold text-body hover:border-primary hover:text-primary-text"
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
            <p className="mt-1 text-sm text-body">
              {result.total}{" "}
              {result.total === 1
                ? "contact"
                : "contacts"}
            </p>
          </div>
          <form
            action={baseHref}
            className="flex w-full max-w-md gap-2"
          >
            <label className="min-w-0 flex-1 text-xs font-semibold text-body">
              Search contacts
              <Input
                className="mt-1.5"
                name="q"
                defaultValue={result.search}
                placeholder="Name, email or phone"
              />
            </label>
            <button
              type="submit"
              className="mt-6 inline-flex min-h-11 items-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              Search
            </button>
          </form>
        </div>
        {result.search ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              Results for “{result.search}”
            </span>
            <Link
              href={baseHref}
              className="font-semibold text-primary-text hover:underline"
            >
              Clear search
            </Link>
          </div>
        ) : null}
      </section>

      <FacultyContactsTable
        items={result.items}
        showRoles={selected.value === "ALL"}
      />
      <FacultyContactsPagination
        page={result.page}
        totalPages={result.totalPages}
        baseHref={baseHref}
        search={result.search}
      />
    </div>
  );
}
