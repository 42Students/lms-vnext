import Link from "next/link";
import {notFound} from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getFacultyContactDetail } from "@/modules/courses/faculty-contacts-service";
import { facultyContactRoleLabel,facultyContactDetailParamsSchema,facultyContactDetailHidden,facultyContactDirectoryQuery } from "@/modules/courses/faculty-contact-detail-model";

export default async function FacultyContactDetailPage({
  params,searchParams,
}: {
  params: Promise<{ contactsTab: string; membershipId: string }>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  const parsed=facultyContactDetailParamsSchema.safeParse(await params);
  if(!parsed.success)notFound();
  let contact:Awaited<ReturnType<typeof getFacultyContactDetail>>;
  try {
    contact=await getFacultyContactDetail(context,parsed.data);
  } catch(error) {
    if(facultyContactDetailHidden(error))notFound();
    throw error;
  }
  const name = contact.displayName?.trim() || "Unnamed contact";
  const back = "/teacher/contacts/" + contact.contactsTab +
    facultyContactDirectoryQuery(await searchParams);

  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Faculty · Contacts" title={name}
      description="Active college directory contact · Read-only"
      actions={<Link href={back}
        className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Back to Contacts
      </Link>} />
    <section className="border-b border-border pb-5">
      <h2 className="text-lg font-semibold text-foreground">Public department</h2>
      <p className="mt-3 text-sm text-body">
        {contact.departmentName ?? "No department recorded"}
      </p>
    </section>
    <section className="border-b border-border pb-5">
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
      Only the public name, role and department are shown. Private contact details, profile sections,
      documents, identity verification and role-specific academic records are not exposed here.
      Inactive or outside-college contacts are not visible.
    </p>
  </div>;
}
