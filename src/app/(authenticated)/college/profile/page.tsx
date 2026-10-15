import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { getOwnAccountSummary } from "@/modules/people/own-account-service";
import { collegeAdminProfileSections } from "@/modules/people/college-admin-profile-view-model";

export default async function CollegeAdminProfilePage() {
  const context=await getCurrentRequestContext();
  if(!context.membership||context.membership.status!=="ACTIVE"||!hasMembershipRole(context,"COLLEGE_ADMIN"))
    redirect("/dashboard");
  const account=await getOwnAccountSummary(context);
  if(!account)return <EmptyState title="Profile unavailable" description="Your account could not be loaded. Sign out and sign in again." />;
  return <main className="mx-auto w-full min-w-0 max-w-5xl space-y-6">
    <PageHeader eyebrow="College Admin" title="My profile"
      description="Your personal and contact details. College contact information is managed separately."
      actions={<Link href="/account/security" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Signed-in devices</Link>}
    />
    <nav aria-label="Profile sections" className="flex flex-wrap gap-2">
      {collegeAdminProfileSections(account).map(section=><a key={section.key} href={"#"+section.key}
        className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">{section.title}</a>)}
    </nav>
    <div className="grid min-w-0 gap-4 md:grid-cols-2">
      {collegeAdminProfileSections(account).map(section=><section id={section.key} key={section.key}
        className="min-w-0 scroll-mt-20 space-y-3 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
        {section.unavailable?<p className="text-sm text-muted-foreground">{section.unavailable}</p>:null}
        <dl className="grid min-w-0 gap-3">{section.fields.map(field=><div key={field.label} className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field.label}</dt>
          <dd className="mt-1 break-words text-sm font-semibold text-foreground">{field.value||"Not provided"}</dd>
        </div>)}</dl>
      </section>)}
    </div>
    <Link href="/college/college-profile" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Edit college display and support contacts
    </Link>
  </main>;
}
