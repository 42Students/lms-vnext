import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  getTpoCompanyContactLog,
  tpoCompanyContactLogQuerySchema,
} from "@/modules/placements/tpo-company-contact-log-service";

type SearchParams = { page?: string | string[]; type?: string | string[] };
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export default async function TpoCompanyContactLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const [{ companyId }, search] = await Promise.all([params, searchParams]);
  const parsed = tpoCompanyContactLogQuerySchema.safeParse({
    companyId,
    ...(first(search.page) ? { page: first(search.page) } : {}),
    ...(first(search.type) ? { type: first(search.type) } : {}),
  });
  if (!parsed.success) notFound();

  const log = await getTpoCompanyContactLog(context, parsed.data);
  if (!log) notFound();

  const path = "/tpo/companies/" + encodeURIComponent(companyId) + "/contact-log";
  const href = (page: number) => path + "?" + new URLSearchParams({
    page: String(page), type: log.type,
  }).toString();

  return (
    <div className="space-y-6">
      <Link
        href={"/tpo/companies/" + encodeURIComponent(companyId)}
        className="text-sm font-semibold text-primary-text hover:underline"
      >
        ← Company details
      </Link>
      <PageHeader
        eyebrow="TPO · Companies"
        title={log.companyName + " · Contact log"}
        description="Read-only CRM interaction history for contacts explicitly linked to this college-company relationship."
      />
      {!log.available ? (
        <section role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
          Contact-activity tables are not available in this database. No zero
          activity count is inferred.
        </section>
      ) : (
        <>
          <form method="get" action={path} className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-semibold text-foreground">
              Interaction type
              <select
                name="type"
                defaultValue={log.type}
                className="mt-2 block min-h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
              >
                {["ALL", "CALL", "WHATSAPP", "EMAIL", "MEETING", "NOTE", "SYSTEM"].map((type) => (
                  <option key={type} value={type}>{type === "ALL" ? "All types" : type}</option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="min-h-10 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text"
            >
              Filter
            </button>
          </form>
          <p className="text-sm text-body">
            {log.total} recorded interaction(s). Most recent first; 25 per page.
          </p>
          {log.rows.length === 0 ? (
            <p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
              No recorded contact interactions match this filter. Calls,
              emails and messages are not inferred from invitations or drives.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="bg-surface-subtle">
                  <tr>
                    {["Contact", "Type", "Outcome", "Recorded (IST)"].map((heading) => (
                      <th key={heading} scope="col" className="border-b border-border px-4 py-3 font-semibold text-foreground">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {log.rows.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-foreground">{row.contactName}</td>
                      <td className="px-4 py-3 text-body">{row.type}</td>
                      <td className="px-4 py-3 text-body">{row.outcome}</td>
                      <td className="px-4 py-3 text-body">
                        <time dateTime={row.occurredAtIso}>
                          {dateFormat.format(new Date(row.occurredAtIso))}
                        </time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <nav aria-label="Contact log pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-body">Page {log.page} of {log.pages}</span>
            <div className="flex gap-3">
              {log.page > 1 ? (
                <Link href={href(log.page - 1)} className="font-semibold text-primary-text hover:underline">
                  ← Previous
                </Link>
              ) : null}
              {log.pages !== null && log.page < log.pages ? (
                <Link href={href(log.page + 1)} className="font-semibold text-primary-text hover:underline">
                  Next →
                </Link>
              ) : null}
            </div>
          </nav>
        </>
      )}
      <p className="text-xs leading-5 text-muted-foreground">
        This log includes persisted, explicitly linked CRM activity only.
        Unlinked contacts, message content, notes, phone numbers, email
        addresses and external conversations are not included.
      </p>
    </div>
  );
}
