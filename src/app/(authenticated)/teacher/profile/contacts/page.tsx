import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {getOwnFacultyContactAvailability} from "@/modules/people/faculty-contact-availability-service";
import {facultyProfileDocumentStorageReady} from "@/modules/people/faculty-profile-readiness";
import {loadOwnFacultyProfileDocumentStaged} from "@/modules/people/faculty-profile-self.staged";
import {FacultyContactEditor} from "@/components/people/faculty-contact-editor";

export default async function FacultyOwnContactPage(){
 const context=await getCurrentRequestContext();
 const [data,ready]=await Promise.all([
  getOwnFacultyContactAvailability(context,{}),facultyProfileDocumentStorageReady(),
 ]);
 const current=ready?await loadOwnFacultyProfileDocumentStaged(context):null;
 const contact=current?.document.contact;
 const editable=Boolean(current);
 return <div className="min-w-0 max-w-full space-y-6">
 <PageHeader title="Contact details"
  description="Your registered contact numbers and email, with college-managed sign-in details."
  actions={<Link href="/teacher/profile" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Profile</Link>}/>
 <section className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-6">
  <h2 className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">Registered identity contact</h2>
  <dl className="grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2">
   <div><dt className="text-xs text-muted-foreground">Login email</dt>
    <dd className="mt-1 break-all text-sm leading-6 text-body">{data.loginEmail??"Not provided"}</dd></div>
   <div><dt className="text-xs text-muted-foreground">Login phone</dt>
    <dd className="mt-1 break-all text-sm leading-6 text-body">{data.loginPhone??"Not provided"}</dd></div>
  </dl>
  <p className="mt-3 text-xs text-muted-foreground leading-5">These identity fields are managed by your college and are not editable here.</p>
 </section>
 <section className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] py-4">
  <h2 className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">Contacts</h2>
  {!editable?<p role="status" className="mt-2 text-sm text-body leading-[22px]">{data.reason}</p>:null}
  <dl className="grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2">
   <div><dt className="text-xs text-muted-foreground">Primary mobile</dt>
    <dd className="text-sm text-body">{contact?.contactMobile||data.loginPhone||"Not provided"}</dd></div>
   <div><dt className="text-xs text-muted-foreground">Alternate phone</dt>
    <dd className="text-sm text-body">{contact?.contactPhone||"Not provided"}</dd></div>
   <div><dt className="text-xs text-muted-foreground">Contact email</dt>
    <dd className="break-all text-sm text-body">{contact?.contactMail||"Not provided"}</dd></div>
  </dl>
 </section>
 {editable?<div className="space-y-2">
  <FacultyContactEditor key={current!.version} initial={current!.document.contact}
   initialVersion={current!.version}/>
  <p className="text-xs text-muted-foreground">Primary mobile number is required when updating contacts. Your college-managed login email and login phone are unchanged.</p>
 </div>:<p className="max-w-prose text-xs leading-5 text-muted-foreground">Contact editing will be available when private Faculty profile storage is ready. No changes have been submitted.</p>}
 </div>;
}
