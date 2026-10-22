import {PageHeader} from "@/components/ui/page-header";
import {Disclosure} from "@/components/ui/disclosure";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
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
    <div className="min-w-0 space-y-4">
      <PageHeader title={company.name+" · Contact people"} description="Persisted linked recruiter leads only, not an independent contacts directory." actions={<><Link className="lms-inline-link inline-flex min-h-11 items-center text-sm font-semibold text-link underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
        href={"/tpo/companies/" + encodeURIComponent(companyId)}>
        ← Back to company
      </Link></>}/>
      {process.env["DB09_TPO_API_READY"] === "DB09_VERIFIED" ? (
        <Disclosure title="Add or edit contact person" className="border-b border-[var(--lms-canvas-border)]" contentClassName="pt-3"><TpoCompanyPersonEditor companyId={companyId} contacts={company.contacts}/></Disclosure>
      ) : <Alert tone="warning">DB09 contact writes are unavailable.</Alert>}
      {company.contacts.length === 0
        ? <EmptyState title="No contact people are linked to this company yet." action={<Link href={"/tpo/companies/"+encodeURIComponent(companyId)} className="md:min-h-9 inline-flex min-h-11 items-center font-semibold text-link underline">← Back to company</Link>}/>
        : <ul className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
            {company.contacts.map(contact => (
              <li key={contact.id} className="min-w-0 space-y-1 py-4 text-sm">
                <strong>{contact.name}</strong>
                <span className="block text-body sm:ml-2 sm:inline">{contact.designation ?? "Designation not recorded"}</span>
                <p className="mt-1 break-all text-muted-foreground">{contact.email ?? "Email not recorded"}</p>
              </li>
            ))}
          </ul>}
    </div>
  );
}
