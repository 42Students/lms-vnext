import Link from "next/link";
import {notFound} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {StatusBadge} from "@/components/ui/status-badge";
import {contactRecordLinks} from "@/modules/people/college-contacts-links";
import {getCollegeContactById} from "@/modules/people/college-contacts-service";

export default async function CollegeContactDetail({params}:{params:Promise<{membershipId:string}>}){
 const {membershipId}=await params;
 if(!z.string().uuid().safeParse(membershipId).success)notFound();
 const contact=await getCollegeContactById(await getCurrentRequestContext(),membershipId);
 if(!contact)notFound();
 const date=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(contact.joinedAt);
 return <div className="min-w-0 max-w-full space-y-5">
  <PageHeader title={contact.name}
   description="College-scoped public contact details. Private learner identity and contact data are not displayed."
   actions={<PageBackLink href="/college/contacts" label="Back to contacts"/>}/>
  <section aria-label="Contact record" className="min-w-0 space-y-3 border-b border-border pb-5">
   <p className="text-sm"><strong>Roles:</strong> {contact.roles.join(", ")||"None recorded"}</p>
   <p className="flex flex-wrap items-center gap-2 text-sm"><strong>College membership:</strong> <StatusBadge tone={contact.status==="ACTIVE"?"success":"warning"}>{contact.status}</StatusBadge></p>
   <p className="break-all text-sm"><strong>Email:</strong> {contact.email}</p>
   <p className="break-words text-sm"><strong>Phone:</strong> {contact.phone}</p>
   <p className="text-sm"><strong>Joined:</strong> {date} IST</p>
   <nav aria-label="Related role records" className="flex flex-wrap gap-2">
    {contactRecordLinks(contact).map(link=><Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">{link.label}</Link>)}
   </nav>
  </section>
 </div>;
}
