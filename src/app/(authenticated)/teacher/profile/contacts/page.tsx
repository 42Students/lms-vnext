import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {getOwnFacultyContactAvailability} from "@/modules/people/faculty-contact-availability-service";

export default async function FacultyOwnContactPage(){
 const data=await getOwnFacultyContactAvailability(await getCurrentRequestContext(),{});
 return <div className="min-w-0 max-w-full space-y-6">
 <PageHeader eyebrow="Faculty · Profile" title="Contact details"
  description="Your college-managed sign-in details and the status of optional contact fields."
  actions={<Link href="/teacher/profile" className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Profile</Link>}/>
 <section className="border-b border-border pb-5">
  <h2 className="font-semibold text-foreground">Registered identity contact</h2>
  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
   <div><dt className="text-xs text-muted-foreground">Login email</dt>
    <dd className="mt-1 break-words text-sm text-body">{data.loginEmail??"Not provided"}</dd></div>
   <div><dt className="text-xs text-muted-foreground">Login phone</dt>
    <dd className="mt-1 break-words text-sm text-body">{data.loginPhone??"Not provided"}</dd></div>
  </dl>
  <p className="mt-3 text-xs text-muted-foreground">These identity fields are managed by your college and are not editable here.</p>
 </section>
 <section role="status" className="border-b border-border pb-5">
  <h2 className="font-semibold text-foreground">Alternate contact editing unavailable</h2>
  <p className="mt-2 text-sm text-body">{data.reason}</p>
  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
   <div><dt className="text-xs text-muted-foreground">Alternate phone</dt>
    <dd className="text-sm text-body">Storage not registered</dd></div>
   <div><dt className="text-xs text-muted-foreground">Contact email</dt>
    <dd className="text-sm text-body">Storage not registered</dd></div>
  </dl>
 </section>
 <p className="text-xs text-muted-foreground">
  A contact edit form will be enabled only after separate private Faculty contact
  fields and authorized update policy are migrated. No information has been saved.
 </p>
 </div>;
}
