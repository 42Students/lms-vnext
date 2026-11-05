import {notFound} from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { getFacultyContactDetail } from "@/modules/courses/faculty-contacts-service";
import { facultyContactRoleLabel,facultyContactDetailParamsSchema,facultyContactDetailHidden,facultyContactDirectoryQuery } from "@/modules/courses/faculty-contact-detail-model";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";

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

  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader eyebrow="Faculty · Contacts" title={name}
      description="Active college directory contact · Read-only"
      actions={<ButtonLink variant="secondary" href={back}
        className="w-full sm:w-auto">
        Back to Contacts
      </ButtonLink>} />
    <div className="grid min-w-0 gap-4 md:grid-cols-2">
    <section className="min-w-0 border-b border-border pb-6">
      <Heading level={2} size="lg" className="leading-[1.4] text-[var(--lms-heading)]">Public department</Heading>
      <p className="mt-3 text-sm text-body leading-[22px]">
        {contact.departmentName ?? "No department recorded"}
      </p>
    </section>
    <section className="min-w-0 border-b border-border pb-6">
      <Heading level={2} size="lg" className="leading-[1.4] text-[var(--lms-heading)]">Current college roles</Heading>
      {contact.roles.length === 0
        ? <div role="status" className="mt-3 space-y-1 text-sm leading-5 text-body">
            <p className="font-semibold">No active roles recorded</p>
            <p>This membership currently has no registered college role.</p>
          </div>
        : <ul aria-label="Current college roles" className="mt-3 flex min-w-0 flex-wrap gap-2">{contact.roles.map(role =>
          <li key={role} className="list-none"><Badge tone="neutral">{facultyContactRoleLabel(role)}</Badge></li>)}</ul>}
    </section>
    </div>
    <p className="max-w-3xl text-xs leading-[1.6] text-muted-foreground">
      Only the public name, role and department are shown. Private contact details, profile sections,
      documents, identity verification and role-specific academic records are not exposed here.
      Inactive or outside-college contacts are not visible.
    </p>
  </div>;
}
