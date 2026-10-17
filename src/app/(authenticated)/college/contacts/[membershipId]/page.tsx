import Link from "next/link";
import {notFound} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {contactRecordLinks} from "@/modules/people/college-contacts-links";
import {getCollegeContactById} from "@/modules/people/college-contacts-service";

export default async function CollegeContactDetail({params}:{params:Promise<{membershipId:string}>}){
 const {membershipId}=await params;
 if(!z.string().uuid().safeParse(membershipId).success)notFound();
 const contact=await getCollegeContactById(await getCurrentRequestContext(),membershipId);
 if(!contact)notFound();
 const date=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(contact.joinedAt);
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="College Admin · Contacts" title={contact.name}
   description="College-scoped public contact details. Private learner identity and contact data are not displayed."
   actions={<Link href="/college/contacts" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Back to contacts</Link>}/>
  <section aria-label="Contact record" className="min-w-0 space-y-3 rounded-xl border border-border bg-surface p-5">
   <p className="text-sm"><strong>Roles:</strong> {contact.roles.join(", ")||"None recorded"}</p>
   <p className="text-sm"><strong>College membership:</strong> {contact.status}</p>
   <p className="break-all text-sm"><strong>Email:</strong> {contact.email}</p>
   <p className="text-sm"><strong>Phone:</strong> {contact.phone}</p>
   <p className="text-sm"><strong>Joined:</strong> {date} IST</p>
   <nav aria-label="Related role records" className="flex flex-wrap gap-2">
    {contactRecordLinks(contact).map(link=><Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold">{link.label}</Link>)}
   </nav>
  </section>
 </div>;
}
