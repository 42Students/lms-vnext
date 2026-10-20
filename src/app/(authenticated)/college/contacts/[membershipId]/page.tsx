import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { contactRecordLinks } from "@/modules/people/college-contacts-links";
import { getCollegeContactById } from "@/modules/people/college-contacts-service";

export default async function CollegeContactDetail({params}:{params:Promise<{membershipId:string}>}){
 const {membershipId}=await params;
 if(!z.string().uuid().safeParse(membershipId).success)notFound();
 const contact=await getCollegeContactById(await getCurrentRequestContext(),membershipId);
 if(!contact)notFound();
 const links = contactRecordLinks(contact);
 const date=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(contact.joinedAt);
 return <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)]">
  <PageHeader title={contact.name}
   description="College-scoped public contact details. Private learner identity and contact data are not displayed."
   actions={<PageBackLink href="/college/contacts" label="Back to contacts" />}/>
  <section aria-label="Contact record" className="min-w-0 max-w-[920px]">
   <dl className="grid min-w-0 gap-y-[var(--lms-space-3)] text-sm leading-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-x-[var(--lms-space-4)]">
    <dt className="font-semibold text-[var(--lms-heading)]">Roles:</dt>
    <dd className="m-0 min-w-0 break-words text-body">{contact.roles.join(", ")||"None recorded"}</dd>
    <dt className="font-semibold text-[var(--lms-heading)]">College membership:</dt>
    <dd className="m-0 min-w-0"><StatusBadge tone={contact.status==="ACTIVE"?"success":"warning"}>{contact.status}</StatusBadge></dd>
    <dt className="font-semibold text-[var(--lms-heading)]">Email:</dt>
    <dd className="m-0 min-w-0 break-words text-body [overflow-wrap:anywhere]">{contact.email}</dd>
    <dt className="font-semibold text-[var(--lms-heading)]">Phone:</dt>
    <dd className="m-0 min-w-0 break-words text-body">{contact.phone}</dd>
    <dt className="font-semibold text-[var(--lms-heading)]">Joined:</dt>
    <dd className="m-0 min-w-0 text-body">{date} IST</dd>
   </dl>
   {links.length > 0 ? <nav aria-label="Related role records" className="mt-[var(--lms-space-4)] flex min-w-0 flex-col gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)] sm:flex-row sm:flex-wrap">
    {links.map(link=><Link key={link.href} href={link.href} className="inline-flex min-h-11 min-w-0 items-center justify-center break-words rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-[var(--lms-space-4)] text-sm font-semibold text-link hover:border-[var(--lms-primary)] hover:text-primary-text md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] sm:justify-start">{link.label}</Link>)}
   </nav> : null}
  </section>
 </div>;
}
