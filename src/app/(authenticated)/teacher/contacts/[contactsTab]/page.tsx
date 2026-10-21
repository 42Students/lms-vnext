import { Select } from "@/components/ui/select";
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
import { FacultyContactsLiveSearch } from "./faculty-contacts-live-search";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { AuthorizationError } from "@/modules/permissions/policy";
import { Tabs } from "@/components/ui/tabs";
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
  if(!filters)return <section role="alert" className="min-w-0 space-y-3">
    <PageHeader title={"Invalid directory filters"} />
    <Link href={"/teacher/contacts/"+contactsTab}
      className="inline-flex min-h-11 md:min-h-9 items-center text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
      Return to Contacts
    </Link>
  </section>;
  const {page,pageSize,search}=filters;
  const context = await getCurrentRequestContext();
  const loaded = await listFacultyContacts(context,{
    tab:selected.value,search,page,pageSize,
  }).then(value=>({ok:true as const,value}))
    .catch(error=>({ok:false as const,denied:error instanceof AuthorizationError}));
  if(!loaded.ok)return <section className="min-w-0 space-y-4">
    <PageHeader title="Contacts" />
    <ErrorState title={loaded.denied?"Contacts access denied":"Couldn't load contacts"}
      description={loaded.denied?"You no longer have access to these contacts.":"Something went wrong on our end. Please try again."}
      action={<Link href={loaded.denied?"/teacher/contacts":"/teacher/contacts/"+contactsTab+"?"+new URLSearchParams({
        ...(search?{q:search}:{}),page:String(page),pageSize:String(pageSize),
      }).toString()} className="font-semibold text-primary-text underline">
        {loaded.denied?"Back to Contacts":"Retry contacts"}
      </Link>} />
  </section>;
  const result=loaded.value;

  const baseHref =
    `/teacher/contacts/${contactsTab}`;

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <PageHeader title="Contacts" />

      <Tabs ariaLabel="Contacts sections" value={contactsTab} renderPanel={false}
        items={Object.entries(tabs).map(([key,tab])=>({
          value:key,label:tab.label,href:`/teacher/contacts/${key}`,
        }))} />

      <section className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4">
        <p className="mb-3 text-xs text-muted-foreground">Contact fields are masked for this role. The legacy Email and Contact columns remain visible as Private; no other learner or teacher phone number is disclosed.</p>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h2 className="m-0 text-[18px] font-semibold leading-[1.4] text-[var(--lms-heading)]">{selected.label}</h2>
            <span role="status" aria-live="polite" className="inline-flex items-center gap-2 rounded-full border border-[var(--lms-field-hover-border)] bg-surface px-3 py-1 text-sm text-body">
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 11a3 3 0 1 0 0-6m0 9a5 5 0 0 1 4 4v2"/></svg>
              {result.total} {result.total === 1 ? "contact" : "contacts"}
            </span>
          </div>
          <FacultyContactsLiveSearch baseHref={baseHref} initialSearch={result.search} pageSize={result.pageSize}/>
        </div>
      </section>

      <FacultyContactsTable
        items={result.items}
        search={result.search}
        showRoles={selected.value === "ALL"}
        detailBaseHref={baseHref}
        detailQuery={facultyContactDirectoryQuery({q:result.search,page:String(result.page),pageSize:String(result.pageSize)})}
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
        {result.search?<input type="hidden" name="q" value={result.search}/>:null}
        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--lms-neutral-400)]">Rows per page
          <Select name="pageSize" defaultValue={String(result.pageSize)} className="min-h-11 md:min-h-9">
            <option value="10">10</option><option value="20">20</option><option value="50">50</option>
          </Select>
        </label>
        <Button type="submit" variant="secondary" className="min-h-11 md:min-h-9">Apply</Button>
      </form>
      </div>
    </div>
  );
}
