import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getFacultyContactDetail } from "@/modules/courses/faculty-contacts-service";
import { facultyContactRoleLabel } from "@/modules/courses/faculty-contact-detail-model";

export default async function FacultyContactDetailPage({
  params,
}: {
  params: Promise<{ contactsTab: string; membershipId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const contact = await getFacultyContactDetail(context, await params);
  const name = contact.displayName?.trim() || "Unnamed contact";
  const back = "/teacher/contacts/" + contact.contactsTab;

  return <div className="space-y-6">
    <PageHeader eyebrow="Faculty · Contacts" title={name}
      description="Active college directory contact · Read-only"
      actions={<Link href={back}
        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
        Back to Contacts
      </Link>} />
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-foreground">Contact details</h2>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <div><dt className="text-xs font-semibold text-muted-foreground">Email</dt>
          <dd className="mt-1 break-all text-sm text-foreground">
            {contact.email ? <a href={"mailto:" + contact.email}
              className="font-semibold text-primary-text hover:underline">{contact.email}</a>
              : "Not available"}
          </dd>
        </div>
        <div><dt className="text-xs font-semibold text-muted-foreground">Phone</dt>
          <dd className="mt-1 break-all text-sm text-foreground">
            {contact.phoneE164 ? <a href={"tel:" + contact.phoneE164}
              className="font-semibold text-primary-text hover:underline">{contact.phoneE164}</a>
              : "Not available"}
          </dd>
        </div>
      </dl>
    </section>
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-foreground">Current college roles</h2>
      {contact.roles.length === 0
        ? <EmptyState title="No active roles recorded"
            description="This membership currently has no registered college role." />
        : <ul className="mt-4 flex flex-wrap gap-2">{contact.roles.map(role =>
          <li key={role} className="rounded-full border border-border bg-surface-subtle px-3 py-2 text-sm text-body">
            {facultyContactRoleLabel(role)}
          </li>)}</ul>}
    </section>
    <p className="text-xs leading-5 text-muted-foreground">
      Only directory-listed contact information is shown. Private profile sections,
      documents, identity verification and role-specific academic records are not exposed here.
      Inactive or outside-college contacts are not visible.
    </p>
  </div>;
}
