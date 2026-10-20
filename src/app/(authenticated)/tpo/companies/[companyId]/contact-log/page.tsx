import {DataTable} from "@/components/ui/data-table";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { TpoCompanyInteractionForm } from "@/components/placements/tpo-company-interaction-form";
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
  await requireTpoBatchActor(context);
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
    <div className="min-w-0 space-y-5">
      <Link
        href={"/tpo/companies/" + encodeURIComponent(companyId)}
        className="lms-inline-link inline-flex min-h-11 items-center text-sm font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
      >
        ← Company details
      </Link>
      <PageHeader
        
        title={log.companyName + " · Contact log"}
        description="Read-only CRM interaction history for contacts explicitly linked to this college-company relationship."
      />
      {!log.available ? (
        <Alert tone="warning">
          Contact-activity tables are not available in this database. No zero
          activity count is inferred.
        </Alert>
      ) : (
        <>
          {log.writeEnabled && log.contacts.length > 0 ? (
            <TpoCompanyInteractionForm
              key={log.contacts.map((item) => item.id + item.updatedAtIso).join(":")}
              companyId={companyId}
              contacts={log.contacts}
            />
          ) : log.contacts.length === 0 ? (
            <Alert tone="warning">
              No active, explicitly linked recruiter contacts are available
              for a new activity. Link a contact before recording one.
            </Alert>
          ) : (
            <Alert tone="warning">
              The CRM write gate is unavailable for this company. Existing
              activity remains read-only.
            </Alert>
          )}
          <form method="get" action={path} className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-semibold text-foreground">
              Interaction type
              <Select
                name="type"
                defaultValue={log.type}
                className="mt-2 block min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground"
              >
                {["ALL", "CALL", "WHATSAPP", "EMAIL", "MEETING", "NOTE", "SYSTEM"].map((type) => (
                  <option key={type} value={type}>{type === "ALL" ? "All types" : type}</option>
                ))}
              </Select>
            </label>
            <Button
              type="submit"
              className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link"
            >
              Filter
            </Button>
          </form>
          <p className="text-sm text-body">
            {log.total} recorded interaction(s). Most recent first; 25 per page.
          </p>
          <DataTable
            caption="Recorded company contact interactions"
            rows={log.rows}
            getRowKey={(row)=>row.id}
            empty={<EmptyState title="No recorded contact interactions match this filter." description="Calls, emails and messages are not inferred from invitations or drives."/>}
            columns={[
              {key:"contact",header:"Contact",mobileLabel:"Contact",mobilePriority:"primary",cell:(row)=>row.contactName},
              {key:"type",header:"Type",mobileLabel:"Type",mobilePriority:"secondary",cell:(row)=>row.type},
              {key:"outcome",header:"Outcome",mobileLabel:"Outcome",mobilePriority:"secondary",cell:(row)=>row.outcome},
              {key:"recorded",header:"Recorded (IST)",mobileLabel:"Recorded (IST)",mobilePriority:"secondary",
               cell:(row)=><time dateTime={row.occurredAtIso}>{dateFormat.format(new Date(row.occurredAtIso))}</time>},
            ]}
          />
          <nav aria-label="Contact log pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-body">Page {log.page} of {log.pages}</span>
            <div className="flex gap-3">
              {log.page > 1 ? (
                <Link href={href(log.page - 1)} className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
                  ← Previous
                </Link>
              ) : null}
              {log.pages !== null && log.page < log.pages ? (
                <Link href={href(log.page + 1)} className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
                  Next →
                </Link>
              ) : null}
            </div>
          </nav>
        </>
      )}
      <p className="text-xs leading-5 text-muted-foreground">
        This log includes persisted, explicitly linked CRM activity only.
        Unlinked contacts, private notes, phone numbers, email addresses and
        external conversations are not displayed. Entries are internal
        records, not evidence of actual message delivery.
      </p>
    </div>
  );
}
