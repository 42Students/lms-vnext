import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { parseFacultyContactsQuery } from "@/modules/courses/faculty-contacts-filter-model";
import { facultyContactDirectoryQuery } from "@/modules/courses/faculty-contact-detail-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasActiveMembership, hasMembershipRole } from "@/modules/identity/context";
import {
  FacultyContactsPagination,
  FacultyContactsTable,
} from "@/components/courses/faculty-contacts-table";
import { FacultyContactsLiveSearch, FacultyContactsRetry } from "./faculty-contacts-live-search";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { FacultyContactsFailureToast } from "@/components/courses/faculty-contacts-failure-toast";
import { AuthorizationError } from "@/modules/permissions/policy";
import { CoursesServiceError } from "@/modules/courses/errors";
import { Tabs } from "@/components/ui/tabs";
import { listFacultyContacts } from "@/modules/courses/faculty-contacts-service";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";

import { ROLE } from "@/modules/identity/roles";
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
  const context=await getCurrentRequestContext();
  if(!hasActiveMembership(context)||!hasMembershipRole(context,ROLE.FACULTY))redirect("/dashboard");
  const { contactsTab } = await params;
  if (!(contactsTab in tabs)) {
    redirect("/teacher/contacts/allContacts");
  }

  const selected = tabs[contactsTab as keyof typeof tabs];
  const raw = await searchParams;
  const filters = parseFacultyContactsQuery(raw);
  if (!filters) {
    return (
      <section role="alert" className="min-w-0 space-y-3">
        <PageHeader title="Invalid directory filters" />
        <p className="text-sm text-body">These filters could not be applied. No contact records were loaded.</p>
        <TextLink
          href={`/teacher/contacts/${contactsTab}`}
          className="inline-flex min-h-11 items-center md:min-h-9"
        >
          Return to Contacts
        </TextLink>
      </section>
    );
  }
  const { page, pageSize, search } = filters;
  const loaded = await listFacultyContacts(context, {
    tab: selected.value,
    search,
    page,
    pageSize,
  }).then((value) => ({ ok: true as const, value }))
    .catch((error: unknown) => ({
      ok: false as const,
      denied: error instanceof AuthorizationError ||
        (error instanceof CoursesServiceError &&
          error.code === "FACULTY_TEACHING_SCOPE_REQUIRED"),
    }));
  if (!loaded.ok) {
    const retryQuery = new URLSearchParams({
      ...(search ? { q: search } : {}),
      page: String(page),
      pageSize: String(pageSize),
    });
    const retryHref = loaded.denied
      ? "/teacher"
      : `/teacher/contacts/${contactsTab}?${retryQuery.toString()}`;
    return (
      <section className="min-w-0 space-y-4">
        <PageHeader title="Contacts" />
        {!loaded.denied ? <FacultyContactsFailureToast /> : null}
        <ErrorState
          title={loaded.denied ? "Contacts access denied" : "Couldn't load contacts"}
          description={loaded.denied
            ? "You no longer have access to these contacts."
            : "Something went wrong on our end. Please try again."}
          action={loaded.denied
            ? <TextLink href={retryHref}>
                Back to teaching
              </TextLink>
            : <FacultyContactsRetry />}
        />
      </section>
    );
  }
  const result = loaded.value;

  const baseHref = `/teacher/contacts/${contactsTab}`;
  // Keep the legacy Contacts search and row-count preference when changing
  // All Contacts / Teachers / Students. The role switch never changes access.
  const tabQuery = new URLSearchParams();
  if (search) tabQuery.set("q", search);
  if (pageSize !== 10) tabQuery.set("pageSize", String(pageSize));
  const tabSuffix = tabQuery.size ? `?${tabQuery.toString()}` : "";

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <PageHeader title={selected.label} />

      <Tabs ariaLabel="Contacts sections" value={contactsTab} renderPanel={false}
        items={Object.entries(tabs).map(([key, tab]) => ({
          value: key,
          label: tab.label,
          href: `/teacher/contacts/${key}${tabSuffix}`,
        }))} />

      <section aria-label="Contact directory results" className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4">
        <div className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <Heading level={2} size="lg" className="m-0 leading-[1.4] text-[var(--lms-heading)]">Directory results</Heading>
            <p role="status" aria-live="polite" className="mt-1 text-sm leading-[22px] text-body">
              {result.total} {result.total === 1 ? "contact" : "contacts"} in {selected.label}
              {result.search ? <> matching “{result.search}”</> : null}
            </p>
          </div>
          <FacultyContactsLiveSearch key={baseHref + ":" + result.search + ":" + result.pageSize}
            baseHref={baseHref} initialSearch={result.search} pageSize={result.pageSize}/>
        </div>
        <p className="text-xs text-muted-foreground">Contact fields are masked for this role. The legacy Email and Contact columns remain visible as Private; no other learner or teacher phone number is disclosed.</p>
      </section>

      <FacultyContactsTable
        items={result.items}
        search={result.search}
        showRoles={selected.value === "ALL"}
        detailBaseHref={baseHref}
        detailQuery={facultyContactDirectoryQuery({
          q: result.search,
          page: String(result.page),
          pageSize: String(result.pageSize),
        })}
      />
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
        <FacultyContactsPagination
          page={result.page}
          totalPages={result.totalPages}
          baseHref={baseHref}
          search={result.search}
          pageSize={result.pageSize}
        />
        <form method="GET" action={baseHref} className="flex min-w-0 items-end gap-2">
          {result.search ? <input type="hidden" name="q" value={result.search} /> : null}
          <Label className="flex flex-col gap-1">
            Rows per page
            <Select name="pageSize" defaultValue={String(result.pageSize)} className="min-h-11 md:min-h-9">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </Select>
          </Label>
          <Button type="submit" variant="secondary" className="min-h-11 md:min-h-9">Apply</Button>
        </form>
      </div>
    </div>
  );
}
