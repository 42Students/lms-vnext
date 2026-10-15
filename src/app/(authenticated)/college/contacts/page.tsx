import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
import {collegeContactsHref,parseCollegeContactsSearchParams} from "@/modules/people/college-contacts-model";
import {listCollegeContacts} from "@/modules/people/college-contacts-service";
import {listCollegeContactFilterOptions} from "@/modules/people/college-contacts-filter-options-service";
import {contactRecordLinks} from "@/modules/people/college-contacts-links";
type RawSearch=Record<string,string|string[]|undefined>;
const dateFormat=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
const initials="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export default async function CollegeContactsPage({searchParams}:{searchParams:Promise<RawSearch>}){
 const raw=await searchParams;
 let filter:ReturnType<typeof parseCollegeContactsSearchParams>;
 try{filter=parseCollegeContactsSearchParams(raw);}
 catch{return <div className="space-y-4"><PageHeader eyebrow="College Admin · People" title="Contacts"/>
  <ErrorState title="Invalid contact filters" description="A contact filter is invalid. No contacts were loaded."
   action={<Link href="/college/contacts" className="underline">Reset contact filters</Link>}/></div>;}
 const context=await getCurrentRequestContext();
 const [results,choices]=await Promise.all([listCollegeContacts(context,filter),listCollegeContactFilterOptions(context)]);
 const pageCount=Math.max(1,Math.ceil(results.total/results.pageSize));
 if(filter.page>pageCount)redirect(collegeContactsHref({...filter,page:pageCount}));
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="College Admin · People" title="Contacts"
   description="Read-only college contacts. Student contact details are masked; account management is separate."
   actions={<Link href="/college/people" className="rounded-md border px-3 py-2 text-sm font-semibold">Manage memberships</Link>}/>
  <nav aria-label="Contacts categories" className="flex flex-wrap gap-2">
   <Link href={collegeContactsHref({...filter,tab:"ALL",page:1})} aria-current={filter.tab==="ALL"?"page":undefined}
     className="rounded-md border px-3 py-2 text-sm">All contacts</Link>
   <Link href={collegeContactsHref({...filter,tab:"FACULTY",page:1})} aria-current={filter.tab==="FACULTY"?"page":undefined}
     className="rounded-md border px-3 py-2 text-sm">Faculty contacts</Link>
   <Link href={collegeContactsHref({...filter,tab:"STUDENT",page:1})} aria-current={filter.tab==="STUDENT"?"page":undefined}
     className="rounded-md border px-3 py-2 text-sm">Student contacts</Link>
  </nav>
  <p className="text-xs text-muted-foreground">Join-date range uses Asia/Kolkata calendar days. The start must not be after the end.</p>
  <form action="/college/contacts" method="get" className="flex flex-wrap items-end gap-3 rounded-lg border bg-surface p-4">
   <input type="hidden" name="tab" value={filter.tab}/>
   <label className="min-w-0 flex-1 basis-52 text-sm">Name or email
    <input type="search" name="q" maxLength={100} defaultValue={filter.q} placeholder="Search contacts" className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3"/>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Name begins with
    <select name="initial" defaultValue={filter.initial??""} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="">Any letter</option>{initials.map(letter=><option key={letter} value={letter}>{letter}</option>)}
    </select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Membership
    <select name="status" defaultValue={filter.status} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option>
     <option value="ENDED">Ended</option><option value="ALL">All statuses</option>
    </select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Contact roles
    <select name="audience" defaultValue={filter.audience} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="ALL">Any contact roles</option><option value="FACULTY_ONLY">Faculty only</option><option value="LEARNER_ONLY">Learner only</option><option value="DUAL">Faculty and learner</option>
    </select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Contact profile availability
    <select name="profile" defaultValue={filter.profile} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="ALL">Any</option><option value="PROFILED">Has role profile</option><option value="UNPROFILED">Missing role profile</option>
    </select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Learner active enrollment
    <select name="enrollment" defaultValue={filter.enrollment} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="ALL">Any</option><option value="ACTIVE">active</option><option value="NONE">none</option>
    </select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Faculty current teaching
    <select name="teaching" defaultValue={filter.teaching} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="ALL">Any</option><option value="ASSIGNED">assigned</option><option value="NONE">none</option>
    </select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Learner roll number availability
    <select name="rollPresence" defaultValue={filter.rollPresence} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="ALL">Any</option><option value="PRESENT">present</option><option value="MISSING">missing</option>
    </select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Learner registration availability
    <select name="registrationPresence" defaultValue={filter.registrationPresence} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="ALL">Any</option><option value="PRESENT">present</option><option value="MISSING">missing</option>
    </select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Faculty academic-title availability
    <select name="titlePresence" defaultValue={filter.titlePresence} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="ALL">Any</option><option value="PRESENT">present</option><option value="MISSING">missing</option>
    </select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Faculty primary-department coverage
    <select name="departmentPresence" defaultValue={filter.departmentPresence} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="ALL">Any</option><option value="ASSIGNED">assigned</option><option value="MISSING">missing</option>
    </select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Learner active-class placement
    <select name="classPresence" defaultValue={filter.classPresence} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="ALL">Any</option><option value="ASSIGNED">assigned</option><option value="NONE">none</option>
    </select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Cohort / batch
    <select name="cohortId" defaultValue={filter.cohortId??""} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="">Any cohort</option>
     {filter.cohortId&&!choices.cohorts.some(x=>x.id===filter.cohortId)&&<option value={filter.cohortId}>Selected cohort (outside first 200)</option>}
     {choices.cohorts.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
    </select>{choices.cohortsTruncated&&<span className="mt-1 block text-xs">First 200 cohorts shown.</span>}
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Account status
    <select name="accountStatus" defaultValue={filter.accountStatus} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="ALL">All accounts</option><option value="ACTIVE">Active account</option><option value="DISABLED">Disabled account</option>
    </select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Joined on or after (IST)
    <input name="joinedFrom" type="date" defaultValue={filter.joinedFrom??""} className="mt-1 block min-h-10 w-full rounded-md border bg-background px-3"/>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Joined through (IST)
    <input name="joinedThrough" type="date" defaultValue={filter.joinedThrough??""} className="mt-1 block min-h-10 w-full rounded-md border bg-background px-3"/>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Sort
    <select name="sort" defaultValue={filter.sort} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="NAME">Name A–Z</option><option value="NAME_DESC">Name Z–A</option><option value="NEWEST">Newest joined</option><option value="OLDEST">Longest-serving</option>
    </select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Rows per page
    <select name="pageSize" defaultValue={filter.pageSize} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="10">10</option><option value="25">25</option><option value="50">50</option>
    </select>
   </label>
   <button type="submit" className="min-h-10 rounded-md border px-4 text-sm font-semibold">Apply</button>
   <Link href={collegeContactsHref({...filter,q:"",status:"ACTIVE",sort:"NAME",page:1})}
    className="inline-flex min-h-10 items-center rounded-md border px-3 text-sm">Clear filters</Link>
  </form>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <p className="text-xs text-muted-foreground">Student contact information is masked in the CSV as on screen. Exports are capped at 1,000.</p>
   <Link href={"/api/college/contacts/export?"+new URLSearchParams({
    tab:filter.tab,q:filter.q,...(filter.initial?{initial:filter.initial}:{}),...(filter.joinedFrom?{joinedFrom:filter.joinedFrom}:{}),...(filter.joinedThrough?{joinedThrough:filter.joinedThrough}:{}),status:filter.status,accountStatus:filter.accountStatus,audience:filter.audience,profile:filter.profile,enrollment:filter.enrollment,teaching:filter.teaching,rollPresence:filter.rollPresence,registrationPresence:filter.registrationPresence,titlePresence:filter.titlePresence,departmentPresence:filter.departmentPresence,classPresence:filter.classPresence,...(filter.cohortId?{cohortId:filter.cohortId}:{}),sort:filter.sort,
   }).toString()} className="inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-semibold">
    Export filtered contacts CSV
   </Link>
  </div>
  <section aria-label="Contacts" className="space-y-3">
   <p className="text-sm text-muted-foreground">{results.total} matching contacts · Page {filter.page}</p>
   {results.items.length===0?<p className="rounded-lg border p-4 text-sm">No matching contacts in this college.</p>:
    <ul className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
     {results.items.map(contact=><li key={contact.membershipId} className="min-w-0 space-y-2 rounded-lg border bg-surface p-4">
      <h2 className="break-words font-semibold">{contact.name}</h2>
      <p className="text-xs text-muted-foreground">{contact.roles.join(" / ")||"No contact role"} · {contact.status}</p>
      <p className="break-all text-sm">Email: {contact.email}</p>
      <p className="text-sm">Phone: {contact.phone}</p>
      <p className="text-xs text-muted-foreground">Joined {dateFormat.format(contact.joinedAt)} IST</p>
      <div className="flex flex-wrap gap-2"><Link href={"/college/contacts/"+contact.membershipId} className="inline-flex min-h-10 items-center rounded-md border px-3 text-sm font-semibold">View contact</Link>{contactRecordLinks(contact).map(link=>
       <Link key={link.href} href={link.href} className="inline-flex min-h-10 items-center rounded-md border px-3 text-sm font-semibold">{link.label}</Link>)}</div>
     </li>)}
    </ul>}
  </section>
  <nav aria-label="Contact directory pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <p>Page {filter.page} of {pageCount} · {results.total} matching contacts</p>
   <div className="flex flex-wrap gap-2">
    {filter.page>1?<Link href={collegeContactsHref({...filter,page:filter.page-1})} className="rounded-md border px-4 py-2">Previous</Link>:null}
    {filter.page<pageCount?<Link href={collegeContactsHref({...filter,page:filter.page+1})} className="rounded-md border px-4 py-2">Next</Link>:null}
   </div>
  </nav>
 </div>;
}