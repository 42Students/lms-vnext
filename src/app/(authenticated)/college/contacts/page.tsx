import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
import {collegeContactsHref,parseCollegeContactsSearchParams} from "@/modules/people/college-contacts-model";
import {listCollegeContacts} from "@/modules/people/college-contacts-service";
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
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="College Admin · People" title="Contacts"
   description="Read-only college contacts. Student contact details are masked; account management is separate."
   actions={<Link href="/college/people" className="rounded-md border px-3 py-2 text-sm font-semibold">Manage memberships</Link>}/>
  <nav aria-label="Contacts categories" className="flex flex-wrap gap-2">
   <Link href={collegeContactsHref({...filter,tab:"ALL",page:1})} aria-current={filter.tab==="ALL"?"page":undefined}
     className="rounded-md border px-3 py-2 text-sm">All contacts</Link>
   <Link href={collegeContactsHref({...filter,tab:"FACULTY",page:1})} aria-current={filter.tab==="FACULTY"?"page":undefined}
     className="rounded-md border px-3 py-2 text-sm">Faculty contacts</Link>
  </nav>
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
     </li>)}
    </ul>}
  </section>
 </div>;
}