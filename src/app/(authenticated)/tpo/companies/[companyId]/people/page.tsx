import {PageHeader} from "@/components/ui/page-header";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { hasMembershipRole } from "@/modules/identity/context";
import { TpoCompanyPersonEditor } from "@/components/placements/tpo-company-person-editor";
import { listTpoCompanyPeople } from "@/modules/placements/tpo-company-person-service";

export default async function TpoCompanyPeoplePage({
  params,
}: { params: Promise<{ companyId: string }> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  await requireTpoBatchActor(context);
  const { companyId } = await params;
  const company = await listTpoCompanyPeople(context, companyId);
  if (!company) notFound();
  return (
    <div className="space-y-5">
      <Link className="text-sm font-semibold text-link"
        href={"/tpo/companies/" + encodeURIComponent(companyId)}>
        ← Back to company
      </Link>
      <PageHeader eyebrow="TPO · Companies" title={company.name+" · Contact people"} description="Persisted linked recruiter leads only, not an independent contacts directory."/>
      {process.env.DB09_TPO_API_READY === "DB09_VERIFIED" ? (
        <TpoCompanyPersonEditor companyId={companyId} contacts={company.contacts}/>
      ) : <p role="status" className="border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 py-3">DB09 contact writes are unavailable.</p>}
      {company.contacts.length === 0
        ? <p role="status" className="rounded-[var(--lms-canvas-radius)] border p-4 text-sm text-body">
            No contact people are linked to this company yet.
          </p>
        : <ul className="divide-y divide-border rounded-[var(--lms-canvas-radius)] border border-border bg-surface">
            {company.contacts.map(contact => (
              <li key={contact.id} className="p-4 text-sm">
                <strong>{contact.name}</strong>
                <span className="ml-2 text-body">{contact.designation ?? "Designation not recorded"}</span>
                <p className="mt-1 break-all text-muted-foreground">{contact.email ?? "Email not recorded"}</p>
              </li>
            ))}
          </ul>}
    </div>
  );
}
