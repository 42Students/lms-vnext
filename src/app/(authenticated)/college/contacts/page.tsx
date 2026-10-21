import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Disclosure } from "@/components/ui/disclosure";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { Banner } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/empty-state";
import {collegeContactPageRoleCounts,activeCollegeContactFilterCount,collegeContactsPageRange,collegeContactsHref,collegeContactsTabHref,collegeContactsWithoutMemberHref,clearedCollegeContactsHref,collegeContactFilterMessage,parseCollegeContactsSearchParams} from "@/modules/people/college-contacts-model";
import {listCollegeContacts} from "@/modules/people/college-contacts-service";
import {listCollegeContactFilterOptions} from "@/modules/people/college-contacts-filter-options-service";
import {contactRecordLinks} from "@/modules/people/college-contacts-links";
type RawSearch=Record<string,string|string[]|undefined>;
const dateFormat=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
const initials="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export default async function CollegeContactsPage({searchParams}:{searchParams:Promise<RawSearch>}){
 const context=await getCurrentRequestContext();
 if(!context.membership) return <div className="min-w-0 space-y-4">
  <PageHeader title="Contacts"/>
  <ErrorState title="Admin not assigned to a college"
    description="Select a college to browse contacts. No contact details can be shown without an active college membership."
    action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Back to dashboard</Link>}/>
 </div>;
 if(context.membership.status!=="ACTIVE"||!hasMembershipRole(context,"COLLEGE_ADMIN"))redirect("/dashboard");
 const raw=await searchParams;
 let filter:ReturnType<typeof parseCollegeContactsSearchParams>;
 try{filter=parseCollegeContactsSearchParams(raw);}
 catch(error){
  const identifiers=[
    ["programId","Program"],["facultyDepartmentId","Department"],
    ["sectionId","Class"],["cohortId","Cohort / batch"],
  ] as const;
  const invalid=identifiers.find(([field])=>
    typeof raw[field]==="string"&&raw[field]!==""&&!z.string().uuid().safeParse(raw[field]).success);
  const description=invalid
    ? invalid[1]+" identifier must be a valid UUID. Choose an existing "+invalid[1].toLowerCase()+" from the filter list."
    : collegeContactFilterMessage(error);
  return <div className="min-w-0 space-y-[var(--lms-space-4)]"><PageHeader title="Contacts"/>
  <ErrorState title="Invalid contact filters" description={description}
   action={<Link href="/college/contacts" className="inline-flex items-center min-h-11 md:min-h-9 underline hover:text-[var(--lms-primary-text)] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] w-full md:w-auto">Reset contact filters</Link>}/></div>;}
 const [results,choices]=await Promise.all([listCollegeContacts(context,filter),listCollegeContactFilterOptions(context)]);
 const pageCount=Math.max(1,Math.ceil(results.total/results.pageSize));
 const range=collegeContactsPageRange(filter.page,results.pageSize,results.total);
 const roleCounts=collegeContactPageRoleCounts(results.items);
 if(filter.page>pageCount)redirect(collegeContactsHref({...filter,page:pageCount}));
 return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <PageHeader title="Contacts"
   description="Read-only college contacts. Student contact details are masked; account management is separate."
   actions={<div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-3)]"><Link href="/college/students" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Student accounts</Link><Link href="/college/faculty" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Faculty accounts</Link><Link href="/college/faculty-assignment" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Teaching assignments</Link></div>}/>
  <Tabs ariaLabel="Contacts categories" renderPanel={false} value={filter.tab}
   items={[
    {value:"ALL",label:"All contacts",href:collegeContactsTabHref(filter,"ALL")},
    {value:"FACULTY",label:"Faculty contacts",href:collegeContactsTabHref(filter,"FACULTY")},
    {value:"STUDENT",label:"Student contacts",href:collegeContactsTabHref(filter,"STUDENT")},
   ]}/>
  {filter.membershipId&&<Banner tone="info"
   action={<Link href={collegeContactsWithoutMemberHref(filter)} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] w-full md:w-auto">Show matching contact directory</Link>}>
   Showing the bookmarked contact record only.
  </Banner>}
  <div className="flex min-w-0 flex-wrap items-baseline gap-x-[var(--lms-space-4)] gap-y-[var(--lms-space-2)] text-xs leading-5 text-muted-foreground">
   <p role="status">{activeCollegeContactFilterCount(filter)} applied directory filters. Pagination, sort and selected tab are not counted.</p>
   <p>Join-date range uses Asia/Kolkata calendar days. The start must not be after the end.</p>
  </div>
  <FilterBar title="Filters" activeCount={activeCollegeContactFilterCount(filter)}
    action={<Button variant="primary" type="submit" form="college-contacts-filters" className="min-h-11 md:min-h-9">Search contacts</Button>}
    search={<label className="flex min-w-0 flex-col gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name or email
      <Input type="search" name="q" form="college-contacts-filters" maxLength={100}
        defaultValue={filter.q} placeholder="Search contacts"
        className="min-h-11 w-full min-w-0 md:min-h-9"/>
    </label>}>
  <form id="college-contacts-filters" action="/college/contacts" method="get" aria-label="Filter college contacts" className="flex min-w-0 flex-wrap items-end gap-[8px]">
   <Input type="hidden" name="tab" value={filter.tab}/>
   {filter.membershipId&&<Input type="hidden" name="membershipId" value={filter.membershipId}/>}

   <Disclosure title="Advanced filters" defaultOpen={activeCollegeContactFilterCount(filter)>0} className="min-w-0 flex-auto basis-full [&>summary]:text-foreground">
    <div className="mt-[var(--lms-space-3)] grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] min-[768px]:grid-cols-2 min-[992px]:grid-cols-4">
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name begins with
    <Select name="initial" defaultValue={filter.initial??""} className="mt-1 w-full">
     <option value="">Any letter</option>{initials.map(letter=><option key={letter} value={letter}>{letter}</option>)}
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Membership
    <Select name="status" defaultValue={filter.status} className="mt-1 w-full">
     <option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option>
     <option value="ENDED">Ended</option><option value="ALL">All statuses</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Contact roles
    <Select name="audience" defaultValue={filter.audience} className="mt-1 w-full">
     <option value="ALL">Any contact roles</option><option value="FACULTY_ONLY">Faculty only</option><option value="LEARNER_ONLY">Learner only</option><option value="DUAL">Faculty and learner</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Contact profile availability
    <Select name="profile" defaultValue={filter.profile} className="mt-1 w-full">
     <option value="ALL">Any</option><option value="PROFILED">Has role profile</option><option value="UNPROFILED">Missing role profile</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Learner active enrollment
    <Select name="enrollment" defaultValue={filter.enrollment} className="mt-1 w-full">
     <option value="ALL">Any</option><option value="ACTIVE">active</option><option value="NONE">none</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Faculty current teaching
    <Select name="teaching" defaultValue={filter.teaching} className="mt-1 w-full">
     <option value="ALL">Any</option><option value="ASSIGNED">assigned</option><option value="NONE">none</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Active Faculty teaching role
    <Select name="teachingRole" defaultValue={filter.teachingRole} className="mt-1 w-full">
     <option value="ALL">Any teaching role</option><option value="PRIMARY">Primary</option><option value="CO_TEACHER">Co-teacher</option><option value="TA">Teaching assistant</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Learner roll number availability
    <Select name="rollPresence" defaultValue={filter.rollPresence} className="mt-1 w-full">
     <option value="ALL">Any</option><option value="PRESENT">present</option><option value="MISSING">missing</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Learner registration availability
    <Select name="registrationPresence" defaultValue={filter.registrationPresence} className="mt-1 w-full">
     <option value="ALL">Any</option><option value="PRESENT">present</option><option value="MISSING">missing</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Faculty academic-title availability
    <Select name="titlePresence" defaultValue={filter.titlePresence} className="mt-1 w-full">
     <option value="ALL">Any</option><option value="PRESENT">present</option><option value="MISSING">missing</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Faculty primary-department coverage
    <Select name="departmentPresence" defaultValue={filter.departmentPresence} className="mt-1 w-full">
     <option value="ALL">Any</option><option value="ASSIGNED">assigned</option><option value="MISSING">missing</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Learner active-class placement
    <Select name="classPresence" defaultValue={filter.classPresence} className="mt-1 w-full">
     <option value="ALL">Any</option><option value="ASSIGNED">assigned</option><option value="NONE">none</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Active class
    <Select name="sectionId" defaultValue={filter.sectionId??""} className="mt-1 w-full">
     <option value="">Any class</option>
     {filter.sectionId&&!choices.sections.some(x=>x.id===filter.sectionId)&&<option value={filter.sectionId}>Selected class (outside first 200)</option>}
     {choices.sections.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </Select>{choices.sectionsTruncated&&<span className="mt-1 block text-xs">First 200 classes shown.</span>}
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic program
    <Select name="programId" defaultValue={filter.programId??""} className="mt-1 w-full">
     <option value="">Any program</option>
     {filter.programId&&!choices.programs.some(x=>x.id===filter.programId)&&<option value={filter.programId}>Selected program (outside first 200)</option>}
     {choices.programs.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </Select>{choices.programsTruncated&&<span className="mt-1 block text-xs">First 200 programs shown.</span>}
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Cohort / batch
    <Select name="cohortId" defaultValue={filter.cohortId??""} className="mt-1 w-full">
     <option value="">Any cohort</option>
     {filter.cohortId&&!choices.cohorts.some(x=>x.id===filter.cohortId)&&<option value={filter.cohortId}>Selected cohort (outside first 200)</option>}
     {choices.cohorts.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </Select>{choices.cohortsTruncated&&<span className="mt-1 block text-xs">First 200 cohorts shown.</span>}
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Faculty academic title contains
    <Input type="search" name="facultyTitleQ" maxLength={80} defaultValue={filter.facultyTitleQ??""} placeholder="e.g. Associate Professor" className="mt-1 w-full"/>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Faculty employment type
    <Select name="employmentType" defaultValue={filter.employmentType??""} className="mt-1 w-full">
     <option value="">Any employment type</option>
     {filter.employmentType&&!choices.employmentTypes.includes(filter.employmentType)&&<option value={filter.employmentType}>Selected type (outside first 100)</option>}
     {choices.employmentTypes.map(value=><option key={value} value={value}>{value}</option>)}
    </Select>{choices.employmentTypesTruncated&&<span className="mt-1 block text-xs">First 100 types shown.</span>}
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Faculty primary department
    <Select name="facultyDepartmentId" defaultValue={filter.facultyDepartmentId??""} className="mt-1 w-full">
     <option value="">Any department</option>
     {filter.facultyDepartmentId&&!choices.departments.some(x=>x.id===filter.facultyDepartmentId)&&<option value={filter.facultyDepartmentId}>Selected department (outside first 200)</option>}
     {choices.departments.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </Select>{choices.departmentsTruncated&&<span className="mt-1 block text-xs">First 200 departments shown.</span>}
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Account status
    <Select name="accountStatus" defaultValue={filter.accountStatus} className="mt-1 w-full">
     <option value="ALL">All accounts</option><option value="ACTIVE">Active account</option><option value="DISABLED">Disabled account</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Joined on or after (IST)
    <DateInput mode="date" name="joinedFrom" defaultValue={filter.joinedFrom??""} className="mt-1 block min-h-11 w-full md:min-h-9"/>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Joined through (IST)
    <DateInput mode="date" name="joinedThrough" defaultValue={filter.joinedThrough??""} className="mt-1 block min-h-11 w-full md:min-h-9"/>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sort
    <Select name="sort" defaultValue={filter.sort} className="mt-1 w-full">
     <option value="NAME">Name A–Z</option><option value="NAME_DESC">Name Z–A</option><option value="NEWEST">Newest joined</option><option value="OLDEST">Longest-serving</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Rows per page
    <Select name="pageSize" defaultValue={filter.pageSize} className="mt-1 w-full">
     <option value="10">10</option><option value="20">20</option><option value="50">50</option>{filter.pageSize===25?<option value="25">25 (saved view)</option>:null}
    </Select>
   </label>
    </div>
   </Disclosure>
   <Button variant="secondary" type="submit" className="min-h-11 w-full md:hidden">Search contacts</Button>
   <Link href={clearedCollegeContactsHref(filter.tab)}
    className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Clear filters</Link>
  </form>
  </FilterBar>
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-[var(--lms-space-3)]">
   <p className="max-w-[75ch] text-xs leading-5 text-muted-foreground">Student contact information is masked in the CSV as on screen. Exports are capped at 1,000.</p>
   <Link href={"/api/college/contacts/export?"+new URLSearchParams({
    tab:filter.tab,q:filter.q,...(filter.membershipId?{membershipId:filter.membershipId}:{}),...(filter.initial?{initial:filter.initial}:{}),...(filter.joinedFrom?{joinedFrom:filter.joinedFrom}:{}),...(filter.joinedThrough?{joinedThrough:filter.joinedThrough}:{}),status:filter.status,accountStatus:filter.accountStatus,audience:filter.audience,profile:filter.profile,enrollment:filter.enrollment,teaching:filter.teaching,teachingRole:filter.teachingRole,rollPresence:filter.rollPresence,registrationPresence:filter.registrationPresence,titlePresence:filter.titlePresence,departmentPresence:filter.departmentPresence,classPresence:filter.classPresence,...(filter.cohortId?{cohortId:filter.cohortId}:{}),...(filter.programId?{programId:filter.programId}:{}),...(filter.sectionId?{sectionId:filter.sectionId}:{}),...(filter.facultyDepartmentId?{facultyDepartmentId:filter.facultyDepartmentId}:{}),...(filter.employmentType?{employmentType:filter.employmentType}:{}),...(filter.facultyTitleQ?{facultyTitleQ:filter.facultyTitleQ}:{}),sort:filter.sort,
   }).toString()} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
    Export filtered contacts CSV
   </Link>
  </div>
  <section aria-label="Contacts" className="min-w-0 space-y-[var(--lms-space-3)]">
   <p className="text-sm text-muted-foreground">{results.total} matching contacts · Page {filter.page}</p>
   <p className="text-xs text-muted-foreground" aria-label="Current page role breakdown">On this page: {roleCounts.facultyOnly} faculty-only · {roleCounts.learnerOnly} learner-only · {roleCounts.dual} dual-role contacts.</p>
   {results.items.length===0?<EmptyState title="No matching contacts" description="No contacts in this college match the selected filters."
      action={<Link href={clearedCollegeContactsHref(filter.tab)} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] w-full md:w-auto">Clear filters in this tab</Link>}/>:
    <DataTable rows={results.items} getRowKey={contact=>contact.membershipId}
      caption="Contacts" empty={<EmptyState title="No matching contacts" description="No contacts in this college match the selected filters."
        action={<Link href={clearedCollegeContactsHref(filter.tab)} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] w-full md:w-auto">Clear filters in this tab</Link>}/>} rowHref={contact=>"/college/contacts/"+encodeURIComponent(contact.membershipId)}
      columns={[
        {key:"name",header:"Name",mobileLabel:"Name",mobilePriority:"primary" as const,
          cell:contact=><Link href={"/college/contacts/"+encodeURIComponent(contact.membershipId)}
            className="inline-flex min-h-[var(--lms-control-height)] items-center font-semibold text-[var(--lms-link-text)] underline max-[767px]:min-h-11 hover:text-[var(--lms-primary-text)] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">{contact.name}</Link>},
        {key:"roles",header:"Roles",mobileLabel:"Roles",mobilePriority:"secondary" as const,
          cell:contact=><span>{contact.roles.join(" / ")||"No contact role"}</span>},
        {key:"status",header:"Membership",mobileLabel:"Membership",mobilePriority:"secondary" as const,
          cell:contact=><StatusBadge tone={contact.status==="ACTIVE"?"success":contact.status==="SUSPENDED"?"warning":"neutral"}>{contact.status}</StatusBadge>},
        {key:"email",header:"Email",mobileLabel:"Email",mobilePriority:"secondary" as const,
          cell:contact=><span className="break-words [overflow-wrap:anywhere]">{contact.email}</span>},
        {key:"phone",header:"Phone",mobileLabel:"Phone",mobilePriority:"secondary" as const,
          cell:contact=>contact.phone},
        {key:"joined",header:"Joined",mobileLabel:"Joined",mobilePriority:"secondary" as const,
          cell:contact=>dateFormat.format(contact.joinedAt)+" IST"},
        {key:"actions",header:"Related role records",mobileLabel:"Related role records",mobilePriority:"action" as const,
          cell:contact=><div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap">
            <Link href={"/college/contacts/"+encodeURIComponent(contact.membershipId)}
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] md:min-h-9 border border-[var(--lms-canvas-border)] px-3 text-sm font-[650] text-[var(--lms-link-text)] bg-white hover:border-[var(--lms-primary)] hover:bg-[var(--lms-button-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">View contact</Link>
            {contactRecordLinks(contact).map(link=><Link key={link.href} href={link.href}
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] md:min-h-9 border border-[var(--lms-canvas-border)] px-3 text-sm font-[650] text-[var(--lms-link-text)] bg-white hover:border-[var(--lms-primary)] hover:bg-[var(--lms-button-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">{link.label}</Link>)}
          </div>},
      ]}/>}
  </section>
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-[var(--lms-space-3)] text-sm">
   <p className="break-words text-muted-foreground">Page {filter.page} of {pageCount} · Showing {range.first}–{range.last} of {results.total} matching contacts</p>
   <div className="flex flex-wrap gap-2">
    {filter.page>2?<Link href={collegeContactsHref({...filter,page:1})} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] text-primary-text md:min-h-9 bg-white hover:border-[var(--lms-primary)] hover:bg-[var(--lms-button-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">First</Link>:null}
    <Pagination page={filter.page} pageCount={pageCount} hrefForPage={page=>collegeContactsHref({...filter,page})} label="Contact directory pages"/>
    {filter.page<pageCount-1?<Link href={collegeContactsHref({...filter,page:pageCount})} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] text-primary-text md:min-h-9 bg-white hover:border-[var(--lms-primary)] hover:bg-[var(--lms-button-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Last</Link>:null}
   </div>
  </div>
 </div>;
}