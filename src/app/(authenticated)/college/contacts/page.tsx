import { Select } from "@/components/ui/select";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
import {FilterBar} from "@/components/ui/filter-bar";
import {Pagination} from "@/components/ui/pagination";
import {StatusBadge} from "@/components/ui/status-badge";
import {DataTable} from "@/components/ui/data-table";
import {collegeContactPageRoleCounts,activeCollegeContactFilterCount,collegeContactsPageRange,collegeContactsHref,collegeContactsTabHref,collegeContactsWithoutMemberHref,clearedCollegeContactsHref,collegeContactFilterMessage,parseCollegeContactsSearchParams} from "@/modules/people/college-contacts-model";
import {listCollegeContacts} from "@/modules/people/college-contacts-service";
import {listCollegeContactFilterOptions} from "@/modules/people/college-contacts-filter-options-service";
import {contactRecordLinks} from "@/modules/people/college-contacts-links";
type RawSearch=Record<string,string|string[]|undefined>;
const dateFormat=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
const initials="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export default async function CollegeContactsPage({searchParams}:{searchParams:Promise<RawSearch>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"COLLEGE_ADMIN"))redirect("/dashboard");
 const raw=await searchParams;
 let filter:ReturnType<typeof parseCollegeContactsSearchParams>;
 try{filter=parseCollegeContactsSearchParams(raw);}
 catch(error){return <div className="min-w-0 overflow-x-clip space-y-4"><PageHeader eyebrow="College Admin · People" title="Contacts"/>
  <ErrorState title="Invalid contact filters" description={collegeContactFilterMessage(error)}
   action={<Link href="/college/contacts" className="underline">Reset contact filters</Link>}/></div>;}
 const [results,choices]=await Promise.all([listCollegeContacts(context,filter),listCollegeContactFilterOptions(context)]);
 const pageCount=Math.max(1,Math.ceil(results.total/results.pageSize));
 const range=collegeContactsPageRange(filter.page,results.pageSize,results.total);
 const roleCounts=collegeContactPageRoleCounts(results.items);
 if(filter.page>pageCount)redirect(collegeContactsHref({...filter,page:pageCount}));
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="College Admin · People" title="Contacts"
   description="Read-only college contacts. Student contact details are masked; account management is separate."
   actions={<div className="flex flex-wrap gap-2"><Link href="/college/students" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-3 py-2 text-sm font-semibold">Student accounts</Link><Link href="/college/faculty" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-3 py-2 text-sm font-semibold">Faculty accounts</Link><Link href="/college/faculty-assignment" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-3 py-2 text-sm font-semibold">Teaching assignments</Link></div>}/>
  <nav aria-label="Contacts categories" className="flex flex-wrap gap-2">
   <Link href={collegeContactsTabHref(filter,"ALL")} aria-current={filter.tab==="ALL"?"page":undefined}
     className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-3 py-2 text-sm">All contacts</Link>
   <Link href={collegeContactsTabHref(filter,"FACULTY")} aria-current={filter.tab==="FACULTY"?"page":undefined}
     className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-3 py-2 text-sm">Faculty contacts</Link>
   <Link href={collegeContactsTabHref(filter,"STUDENT")} aria-current={filter.tab==="STUDENT"?"page":undefined}
     className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-3 py-2 text-sm">Student contacts</Link>
  </nav>
  {filter.membershipId&&<div role="status" className="flex flex-wrap items-center gap-3 rounded-[var(--lms-control-radius)] border bg-surface p-3 text-sm">
   <span>Showing the bookmarked contact record only.</span>
   <Link href={collegeContactsWithoutMemberHref(filter)} className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline">Show matching contact directory</Link>
  </div>}
  <p role="status" className="text-xs text-muted-foreground">{activeCollegeContactFilterCount(filter)} applied directory filters. Pagination, sort and selected tab are not counted.</p>
  <p className="text-xs text-muted-foreground">Join-date range uses Asia/Kolkata calendar days. The start must not be after the end.</p>
  <FilterBar title="Filters" activeCount={activeCollegeContactFilterCount(filter)}
    search={<label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-body">Name or email
      <input type="search" name="q" form="college-contacts-filters" maxLength={100}
        defaultValue={filter.q} placeholder="Search contacts"
        className="min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-[var(--lms-teal-deep)]"/>
    </label>}>
  <form id="college-contacts-filters" action="/college/contacts" method="get" className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
   <input type="hidden" name="tab" value={filter.tab}/>
   {filter.membershipId&&<input type="hidden" name="membershipId" value={filter.membershipId}/>}

   <details className="min-w-0 flex-auto basis-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-3" open={activeCollegeContactFilterCount(filter)>0}>
    <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-foreground">Advanced filters</summary>
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
   <label className="min-w-0 flex-1 basis-32 text-sm">Name begins with
    <Select name="initial" defaultValue={filter.initial??""} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="">Any letter</option>{initials.map(letter=><option key={letter} value={letter}>{letter}</option>)}
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Membership
    <Select name="status" defaultValue={filter.status} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option>
     <option value="ENDED">Ended</option><option value="ALL">All statuses</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Contact roles
    <Select name="audience" defaultValue={filter.audience} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="ALL">Any contact roles</option><option value="FACULTY_ONLY">Faculty only</option><option value="LEARNER_ONLY">Learner only</option><option value="DUAL">Faculty and learner</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Contact profile availability
    <Select name="profile" defaultValue={filter.profile} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="ALL">Any</option><option value="PROFILED">Has role profile</option><option value="UNPROFILED">Missing role profile</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Learner active enrollment
    <Select name="enrollment" defaultValue={filter.enrollment} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="ALL">Any</option><option value="ACTIVE">active</option><option value="NONE">none</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Faculty current teaching
    <Select name="teaching" defaultValue={filter.teaching} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="ALL">Any</option><option value="ASSIGNED">assigned</option><option value="NONE">none</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Active Faculty teaching role
    <Select name="teachingRole" defaultValue={filter.teachingRole} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="ALL">Any teaching role</option><option value="PRIMARY">Primary</option><option value="CO_TEACHER">Co-teacher</option><option value="TA">Teaching assistant</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Learner roll number availability
    <Select name="rollPresence" defaultValue={filter.rollPresence} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="ALL">Any</option><option value="PRESENT">present</option><option value="MISSING">missing</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Learner registration availability
    <Select name="registrationPresence" defaultValue={filter.registrationPresence} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="ALL">Any</option><option value="PRESENT">present</option><option value="MISSING">missing</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Faculty academic-title availability
    <Select name="titlePresence" defaultValue={filter.titlePresence} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="ALL">Any</option><option value="PRESENT">present</option><option value="MISSING">missing</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Faculty primary-department coverage
    <Select name="departmentPresence" defaultValue={filter.departmentPresence} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="ALL">Any</option><option value="ASSIGNED">assigned</option><option value="MISSING">missing</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Learner active-class placement
    <Select name="classPresence" defaultValue={filter.classPresence} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="ALL">Any</option><option value="ASSIGNED">assigned</option><option value="NONE">none</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Active class
    <Select name="sectionId" defaultValue={filter.sectionId??""} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="">Any class</option>
     {filter.sectionId&&!choices.sections.some(x=>x.id===filter.sectionId)&&<option value={filter.sectionId}>Selected class (outside first 200)</option>}
     {choices.sections.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </Select>{choices.sectionsTruncated&&<span className="mt-1 block text-xs">First 200 classes shown.</span>}
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Academic program
    <Select name="programId" defaultValue={filter.programId??""} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="">Any program</option>
     {filter.programId&&!choices.programs.some(x=>x.id===filter.programId)&&<option value={filter.programId}>Selected program (outside first 200)</option>}
     {choices.programs.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </Select>{choices.programsTruncated&&<span className="mt-1 block text-xs">First 200 programs shown.</span>}
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Cohort / batch
    <Select name="cohortId" defaultValue={filter.cohortId??""} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="">Any cohort</option>
     {filter.cohortId&&!choices.cohorts.some(x=>x.id===filter.cohortId)&&<option value={filter.cohortId}>Selected cohort (outside first 200)</option>}
     {choices.cohorts.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </Select>{choices.cohortsTruncated&&<span className="mt-1 block text-xs">First 200 cohorts shown.</span>}
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Faculty academic title contains
    <input type="search" name="facultyTitleQ" maxLength={80} defaultValue={filter.facultyTitleQ??""} placeholder="e.g. Associate Professor" className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm"/>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Faculty employment type
    <Select name="employmentType" defaultValue={filter.employmentType??""} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="">Any employment type</option>
     {filter.employmentType&&!choices.employmentTypes.includes(filter.employmentType)&&<option value={filter.employmentType}>Selected type (outside first 100)</option>}
     {choices.employmentTypes.map(value=><option key={value} value={value}>{value}</option>)}
    </Select>{choices.employmentTypesTruncated&&<span className="mt-1 block text-xs">First 100 types shown.</span>}
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Faculty primary department
    <Select name="facultyDepartmentId" defaultValue={filter.facultyDepartmentId??""} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="">Any department</option>
     {filter.facultyDepartmentId&&!choices.departments.some(x=>x.id===filter.facultyDepartmentId)&&<option value={filter.facultyDepartmentId}>Selected department (outside first 200)</option>}
     {choices.departments.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </Select>{choices.departmentsTruncated&&<span className="mt-1 block text-xs">First 200 departments shown.</span>}
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Account status
    <Select name="accountStatus" defaultValue={filter.accountStatus} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="ALL">All accounts</option><option value="ACTIVE">Active account</option><option value="DISABLED">Disabled account</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Joined on or after (IST)
    <input name="joinedFrom" type="date" defaultValue={filter.joinedFrom??""} className="mt-1 block min-h-11 w-full rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm"/>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Joined through (IST)
    <input name="joinedThrough" type="date" defaultValue={filter.joinedThrough??""} className="mt-1 block min-h-11 w-full rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm"/>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Sort
    <Select name="sort" defaultValue={filter.sort} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="NAME">Name A–Z</option><option value="NAME_DESC">Name Z–A</option><option value="NEWEST">Newest joined</option><option value="OLDEST">Longest-serving</option>
    </Select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Rows per page
    <Select name="pageSize" defaultValue={filter.pageSize} className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border bg-surface px-3 text-base sm:text-sm">
     <option value="10">10</option><option value="20">20</option><option value="50">50</option>{filter.pageSize===25?<option value="25">25 (saved view)</option>:null}
    </Select>
   </label>
    </div>
   </details>
   <button type="submit" className="min-h-11 rounded-[var(--lms-control-radius)] border px-4 text-sm font-semibold">Search contacts</button>
   <Link href={clearedCollegeContactsHref(filter.tab)}
    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-3 text-sm">Clear filters</Link>
  </form>
  </FilterBar>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <p className="text-xs text-muted-foreground">Student contact information is masked in the CSV as on screen. Exports are capped at 1,000.</p>
   <Link href={"/api/college/contacts/export?"+new URLSearchParams({
    tab:filter.tab,q:filter.q,...(filter.membershipId?{membershipId:filter.membershipId}:{}),...(filter.initial?{initial:filter.initial}:{}),...(filter.joinedFrom?{joinedFrom:filter.joinedFrom}:{}),...(filter.joinedThrough?{joinedThrough:filter.joinedThrough}:{}),status:filter.status,accountStatus:filter.accountStatus,audience:filter.audience,profile:filter.profile,enrollment:filter.enrollment,teaching:filter.teaching,teachingRole:filter.teachingRole,rollPresence:filter.rollPresence,registrationPresence:filter.registrationPresence,titlePresence:filter.titlePresence,departmentPresence:filter.departmentPresence,classPresence:filter.classPresence,...(filter.cohortId?{cohortId:filter.cohortId}:{}),...(filter.programId?{programId:filter.programId}:{}),...(filter.sectionId?{sectionId:filter.sectionId}:{}),...(filter.facultyDepartmentId?{facultyDepartmentId:filter.facultyDepartmentId}:{}),...(filter.employmentType?{employmentType:filter.employmentType}:{}),...(filter.facultyTitleQ?{facultyTitleQ:filter.facultyTitleQ}:{}),sort:filter.sort,
   }).toString()} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-4 text-sm font-semibold">
    Export filtered contacts CSV
   </Link>
  </div>
  <section aria-label="Contacts" className="space-y-3">
   <p className="text-sm text-muted-foreground">{results.total} matching contacts · Page {filter.page}</p>
   <p className="text-xs text-muted-foreground" aria-label="Current page role breakdown">On this page: {roleCounts.facultyOnly} faculty-only · {roleCounts.learnerOnly} learner-only · {roleCounts.dual} dual-role contacts.</p>
   {results.items.length===0?<div role="status" className="space-y-2 rounded-[var(--lms-control-radius)] border p-4 text-sm"><p>No matching contacts in this college.</p><Link href={clearedCollegeContactsHref(filter.tab)} className="inline-flex min-h-11 items-center font-semibold text-link underline">Clear filters in this tab</Link></div>:
    <DataTable rows={results.items} getRowKey={contact=>contact.membershipId}
      caption="Contacts" empty={<div role="status"><p>No matching contacts in this college.</p><Link href={clearedCollegeContactsHref(filter.tab)} className="inline-flex min-h-11 items-center underline">Clear filters in this tab</Link></div>} rowHref={contact=>"/college/contacts/"+encodeURIComponent(contact.membershipId)}
      columns={[
        {key:"name",header:"Name",mobileLabel:"Name",mobilePriority:"primary" as const,
          cell:contact=><Link href={"/college/contacts/"+encodeURIComponent(contact.membershipId)}
            className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline">{contact.name}</Link>},
        {key:"roles",header:"Roles",mobileLabel:"Roles",mobilePriority:"secondary" as const,
          cell:contact=><span>{contact.roles.join(" / ")||"No contact role"}</span>},
        {key:"status",header:"Membership",mobileLabel:"Membership",mobilePriority:"secondary" as const,
          cell:contact=><StatusBadge tone={contact.status==="ACTIVE"?"success":contact.status==="SUSPENDED"?"warning":"neutral"}>{contact.status}</StatusBadge>},
        {key:"email",header:"Email",mobileLabel:"Email",mobilePriority:"secondary" as const,
          cell:contact=><span className="break-all">{contact.email}</span>},
        {key:"phone",header:"Phone",mobileLabel:"Phone",mobilePriority:"secondary" as const,
          cell:contact=>contact.phone},
        {key:"joined",header:"Joined",mobileLabel:"Joined",mobilePriority:"secondary" as const,
          cell:contact=>dateFormat.format(contact.joinedAt)+" IST"},
        {key:"actions",header:"Related role records",mobileLabel:"Related role records",mobilePriority:"action" as const,
          cell:contact=><div className="flex flex-wrap gap-2">
            <Link href={"/college/contacts/"+encodeURIComponent(contact.membershipId)}
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-[var(--lms-link-text)]">View contact</Link>
            {contactRecordLinks(contact).map(link=><Link key={link.href} href={link.href}
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-[var(--lms-link-text)]">{link.label}</Link>)}
          </div>},
      ]}/>}
  </section>
  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <p>Page {filter.page} of {pageCount} · Showing {range.first}–{range.last} of {results.total} matching contacts</p>
   <div className="flex flex-wrap gap-2">
    {filter.page>2?<Link href={collegeContactsHref({...filter,page:1})} className="rounded-[var(--lms-control-radius)] border px-4 py-2">First</Link>:null}
    <Pagination page={filter.page} pageCount={pageCount} hrefForPage={page=>collegeContactsHref({...filter,page})} label="Contact directory pages"/>
    {filter.page<pageCount-1?<Link href={collegeContactsHref({...filter,page:pageCount})} className="rounded-[var(--lms-control-radius)] border px-4 py-2">Last</Link>:null}
   </div>
  </div>
 </div>;
}