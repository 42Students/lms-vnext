import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import {parseFacultyContactsQuery,FACULTY_CONTACTS_SEARCH_PLACEHOLDER} from "@/modules/courses/faculty-contacts-filter-model";
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

      <section className="min-w-0 border-b border-border pb-4">
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <h2 className="m-0 font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Directory results</h2>
            <p className="mt-1 text-sm text-body leading-[22px]" role="status" aria-live="polite">
              {result.total}{" "}
              {result.total === 1
                ? "contact"
                : "contacts"}
            </p>
          </div>
          <form
            key={result.search + ":" + result.pageSize}
            action={baseHref}
            className="grid w-full min-w-0 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]"
          >
            <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Search contacts
              <Input
                type="search"
                name="q"
                maxLength={200}
                defaultValue={result.search}
                placeholder={FACULTY_CONTACTS_SEARCH_PLACEHOLDER}
              />
            </label>
            <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Contacts per page
              <Select name="pageSize" aria-label="Contacts per page"
                defaultValue={String(result.pageSize)}
                className="block">
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </Select>
            </label>
            <Button type="submit" variant="primary" className="min-h-11 w-full sm:col-span-2 lg:col-span-1 lg:w-auto lg:min-h-9">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg> Search
            </Button>
          </form>
        </div>
        {result.search ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              Results for “{result.search}”
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
