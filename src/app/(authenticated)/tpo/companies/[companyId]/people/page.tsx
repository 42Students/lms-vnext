import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { TpoCompanyPersonEditor } from "@/components/placements/tpo-company-person-editor";
import { listTpoCompanyPeople } from "@/modules/placements/tpo-company-person-service";

export default async function TpoCompanyPeoplePage({
  params,
}: { params: Promise<{ companyId: string }> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const { companyId } = await params;
  const company = await listTpoCompanyPeople(context, companyId);
  if (!company) notFound();
  return (
    <div className="space-y-5">
      <Link className="text-sm font-semibold text-primary-text"
        href={"/tpo/companies/" + encodeURIComponent(companyId)}>
        ← Back to company
      </Link>
      <header>
        <h1 className="text-2xl font-bold text-foreground">{company.name} · Contact people</h1>
        <p className="mt-2 text-sm text-body">Persisted linked recruiter leads only, not an independent contacts directory.</p>
      </header>
      {process.env.DB09_TPO_API_READY === "DB09_VERIFIED" ? (
        <TpoCompanyPersonEditor companyId={companyId} contacts={company.contacts}/>
      ) : <p role="status" className="rounded-lg border p-4">DB09 contact writes are unavailable.</p>}
      {company.contacts.length === 0
        ? <p role="status" className="rounded-lg border p-4 text-sm text-body">
            No contact people are linked to this company yet.
          </p>
        : <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
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
