import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoActorAudit } from "@/modules/placements/tpo-actor-audit-service";
import { tpoActorAuditQuerySchema } from "@/modules/placements/tpo-actor-audit-model";

type SearchParams = {
  actorId?: string | string[];
  entityType?: string | string[];
  entityId?: string | string[];
  from?: string | string[];
  to?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
};
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
export default async function TpoActorAuditPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const raw = await searchParams;
  const filters = {
    ...(first(raw.actorId) ? { actorId: first(raw.actorId) } : {}),
    ...(first(raw.entityType) ? { entityType: first(raw.entityType) } : {}),
    ...(first(raw.entityId) ? { entityId: first(raw.entityId) } : {}),
    ...(first(raw.from) ? { from: first(raw.from) } : {}),
    ...(first(raw.to) ? { to: first(raw.to) } : {}),
    ...(first(raw.page) ? { page: first(raw.page) } : {}),
    ...(first(raw.pageSize) ? { pageSize: first(raw.pageSize) } : {}),
  };
  const parsed = tpoActorAuditQuerySchema.safeParse(filters);
  if (!parsed.success) {
    return <section role="alert" className="rounded-xl border border-border bg-surface p-6">
      <h1 className="text-lg font-semibold text-foreground">Invalid audit filters</h1>
      <Link className="mt-2 inline-block text-primary-text underline" href="/tpo/audit/actors">
        Clear filters
      </Link>
    </section>;
  }
  const data = await getTpoActorAudit(context, parsed.data);
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(parsed.data)) {
    if (key !== "page" && value !== undefined && value !== "") search.set(key, String(value));
  }
  const exportHref = "/api/placements/tpo/audit/actors/export?" + search.toString();
  const urlForPage = (page: number) => {
    const params = new URLSearchParams(search);
    params.set("page", String(page));
    return "/tpo/audit/actors?" + params.toString();
  };
  const dateTime = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
  });
  return <div className="space-y-6">
    <Link href="/tpo/audit" className="text-sm font-semibold text-primary-text hover:underline">
      ← All audit sources
    </Link>
    <PageHeader eyebrow="TPO · Oversight" title="Actor and entity audit"
      description="Canonical placement activity events with exact persisted actor, entity and IST date filters."
      actions={<a href={exportHref}
        className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
        Export matching CSV (first 2,000)
      </a>} />
    <p className="text-sm leading-6 text-body">
      Only the canonical PLACEMENTS activity stream has consistent actor/entity attribution.
      Domain-history and share events remain on the original Audit log. An empty result
      does not prove no action occurred in a domain without an activity writer.
    </p>
    <form action="/tpo/audit/actors" method="get"
      className="grid gap-3 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-3">
      {([
        ["actorId", "Actor user UUID", "00000000-0000-4000-8000-000000000000"],
        ["entityType", "Entity type", "placement_offer"],
        ["entityId", "Entity ID", "Stored subject ID"],
      ] as const).map(([name, label, placeholder]) => <label key={name}
        className="grid gap-1 text-sm font-semibold text-foreground">
        {label}
        <input name={name} defaultValue={parsed.data[name] ?? ""} placeholder={placeholder}
          className="min-h-10 rounded-md border border-border bg-surface px-3 text-sm font-normal text-foreground"/>
      </label>)}
      {(["from", "to"] as const).map((name) => <label key={name}
        className="grid gap-1 text-sm font-semibold text-foreground">
        {name === "from" ? "From (IST)" : "Through (IST)"}
        <input type="date" name={name} defaultValue={parsed.data[name] ?? ""}
          className="min-h-10 rounded-md border border-border bg-surface px-3 text-sm font-normal text-foreground"/>
      </label>)}
      <label className="grid gap-1 text-sm font-semibold text-foreground">
        Page size
        <select name="pageSize" defaultValue={String(parsed.data.pageSize)}
          className="min-h-10 rounded-md border border-border bg-surface px-3 text-sm font-normal text-foreground">
          {[25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <div className="flex flex-wrap items-end gap-3 sm:col-span-2 lg:col-span-3">
        <button type="submit" className="min-h-10 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary">
          Apply filters
        </button>
        <Link href="/tpo/audit/actors" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">
          Reset filters
        </Link>
      </div>
    </form>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">
        {data.total} matching canonical record(s)
      </h2>
      {data.rows.length === 0 ? (
        <p role="status" className="rounded-xl border border-border bg-surface p-6 text-sm text-body">
          {data.total === 0
            ? "No canonical placement events match these exact filters."
            : "This page is outside the available records. Choose an earlier page."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="bg-surface-subtle">
              <tr>{["Recorded (IST)", "Actor", "Action", "Entity type", "Entity ID"].map(
                (heading) => <th key={heading} scope="col" className="border-b border-border p-3">{heading}</th>,
              )}</tr>
            </thead>
            <tbody>{data.rows.map((row) => <tr key={row.id} className="border-b border-border last:border-0">
              <td className="p-3"><time dateTime={row.occurredAt}>
                {dateTime.format(new Date(row.occurredAt))}
              </time></td>
              <td className="p-3 text-sm">{row.actorName?.trim()||"System / unknown"}</td>
              <td className="p-3">{row.eventType}</td>
              <td className="p-3">{row.entityType}</td>
              <td className="p-3 font-mono text-xs">{row.entityId}</td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
      <nav aria-label="Actor audit pagination" className="flex items-center justify-between gap-3 text-sm">
        <span>Page {data.page} of {data.totalPages}</span>
        <div className="flex gap-4">
          {data.page > 1 && <Link href={urlForPage(data.page - 1)}
            className="font-semibold text-primary-text">← Previous</Link>}
          {data.page < data.totalPages && <Link href={urlForPage(data.page + 1)}
            className="font-semibold text-primary-text">Next →</Link>}
        </div>
      </nav>
    </section>
    <p className="text-xs text-muted-foreground">
      TPO-only tenant scope. Export is capped at 2,000 rows and uses neutralized CSV
      formula cells. No private metadata, IP addresses or free-text notes are exported.
    </p>
  </div>;
}
