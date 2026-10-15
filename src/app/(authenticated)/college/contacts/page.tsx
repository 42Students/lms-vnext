import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
import {collegeContactsHref,parseCollegeContactsSearchParams} from "@/modules/people/college-contacts-model";
import {listCollegeContacts} from "@/modules/people/college-contacts-service";
import {contactRecordLinks} from "@/modules/people/college-contacts-links";
type RawSearch=Record<string,string|string[]|undefined>;
const dateFormat=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
export default async function CollegeContactsPage({searchParams}:{searchParams:Promise<RawSearch>}){
 const raw=await searchParams;
 let filter:ReturnType<typeof parseCollegeContactsSearchParams>;
 try{filter=parseCollegeContactsSearchParams(raw);}
 catch{return <div className="space-y-4"><PageHeader eyebrow="College Admin · People" title="Contacts"/>
  <ErrorState title="Invalid contact filters" description="A contact filter is invalid. No contacts were loaded."
   action={<Link href="/college/contacts" className="underline">Reset contact filters</Link>}/></div>;}
 const results=await listCollegeContacts(await getCurrentRequestContext(),filter);
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
  <form action="/college/contacts" method="get" className="flex flex-wrap items-end gap-3 rounded-lg border bg-surface p-4">
   <input type="hidden" name="tab" value={filter.tab}/>
   <label className="min-w-0 flex-1 basis-52 text-sm">Name or email
    <input type="search" name="q" maxLength={100} defaultValue={filter.q} placeholder="Search contacts" className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3"/>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Membership
    <select name="status" defaultValue={filter.status} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option>
     <option value="ENDED">Ended</option><option value="ALL">All statuses</option>
    </select>
   </label>
   <label className="min-w-0 flex-1 basis-32 text-sm">Account status
    <select name="accountStatus" defaultValue={filter.accountStatus} className="mt-1 block min-h-10 w-full min-w-0 rounded-md border bg-background px-3">
     <option value="ALL">All accounts</option><option value="ACTIVE">Active account</option><option value="DISABLED">Disabled account</option>
    </select>
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
    tab:filter.tab,q:filter.q,status:filter.status,accountStatus:filter.accountStatus,sort:filter.sort,
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
      <div className="flex flex-wrap gap-2">{contactRecordLinks(contact).map(link=>
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