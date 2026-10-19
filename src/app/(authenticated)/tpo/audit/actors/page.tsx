import { Pagination } from "@/components/ui/pagination";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {DataTable} from "@/components/ui/data-table";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoActorAudit } from "@/modules/placements/tpo-actor-audit-service";
import { tpoActorAuditQuerySchema } from "@/modules/placements/tpo-actor-audit-model";
import {tpoAuditEntityHref} from "@/modules/placements/tpo-audit-entity-link-model";

type SearchParams = {
  actorId?: string | string[];
  entityType?: string | string[];
  entityId?: string | string[];
  from?: string | string[];
  to?: string | string[];
  sort?:string|string[];
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
  await requireTpoBatchActor(context);
  const raw = await searchParams;
  const filters = {
    ...(first(raw.actorId) ? { actorId: first(raw.actorId) } : {}),
    ...(first(raw.entityType) ? { entityType: first(raw.entityType) } : {}),
    ...(first(raw.entityId) ? { entityId: first(raw.entityId) } : {}),
    ...(first(raw.from) ? { from: first(raw.from) } : {}),
    ...(first(raw.to) ? { to: first(raw.to) } : {}),
    ...(first(raw.sort) ? { sort: first(raw.sort) } : {}),
    ...(first(raw.page) ? { page: first(raw.page) } : {}),
    ...(first(raw.pageSize) ? { pageSize: first(raw.pageSize) } : {}),
  };
  const parsed = tpoActorAuditQuerySchema.safeParse(filters);
  if (!parsed.success) {
    return <section role="alert" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-6">
      <PageHeader title="Invalid audit filters" />
      <Link className="mt-2 inline-block text-[var(--lms-teal-deep)] underline" href="/tpo/audit/actors">
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
    <Link href="/tpo/audit" className="text-sm font-semibold text-[var(--lms-teal-deep)] hover:underline">
      ← All audit sources
    </Link>
    <PageHeader eyebrow="TPO · Oversight" title="Actor and entity audit"
      description="Canonical placement activity events with exact persisted actor, entity and IST date filters."
      actions={<a href={exportHref}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary">
        Export matching CSV (first 2,000)
      </a>} />
    <p className="text-sm leading-6 text-body">
      Only the canonical PLACEMENTS activity stream has consistent actor/entity attribution.
      Domain-history and share events remain on the original Audit log. An empty result
      does not prove no action occurred in a domain without an activity writer.
    </p>
    <form action="/tpo/audit/actors" method="get"
      className="grid gap-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-3">
      {([
        ["actorId", "Actor user UUID", "00000000-0000-4000-8000-000000000000"],
        ["entityType", "Entity type", "placement_offer"],
        ["entityId", "Entity ID", "Stored subject ID"],
      ] as const).map(([name, label, placeholder]) => <label key={name}
        className="grid gap-1 text-sm font-semibold text-foreground">
        {label}
        <Input name={name} defaultValue={parsed.data[name] ?? ""} placeholder={placeholder}
          className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-normal text-foreground"/>
      </label>)}
      {(["from", "to"] as const).map((name) => <label key={name}
        className="grid gap-1 text-sm font-semibold text-foreground">
        {name === "from" ? "From (IST)" : "Through (IST)"}
        <Input type="date" name={name} defaultValue={parsed.data[name] ?? ""}
          className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-normal text-foreground"/>
      </label>)}
      <label className="grid gap-1 text-sm font-semibold text-foreground">
       Sort date
       <Select name="sort" defaultValue={parsed.data.sort}
        className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3">
        <option value="NEWEST">Newest first</option><option value="OLDEST">Oldest first</option>
       </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-foreground">
        Page size
        <Select name="pageSize" defaultValue={String(parsed.data.pageSize)}
          className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-normal text-foreground">
          {[25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
        </Select>
      </label>
      <div className="flex flex-wrap items-end gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit">Apply filters</Button>
        <Link href="/tpo/audit/actors" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)]">
          Reset filters
        </Link>
      </div>
    </form>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">
        {data.total} matching canonical record(s)
      </h2>
      <DataTable
        caption="Matching canonical placement audit records"
        rows={data.rows}
        getRowKey={(row)=>row.id}
        empty={<p role="status" className="text-sm text-body">
          {data.total===0
            ?"No canonical placement events match these exact filters."
            :"This page is outside the available records. Choose an earlier page."}
        </p>}
        columns={[
          {key:"when",header:"Recorded (IST)",mobileLabel:"Recorded (IST)",mobilePriority:"secondary",
           cell:(row)=><time dateTime={row.occurredAt}>{dateTime.format(new Date(row.occurredAt))}</time>},
          {key:"actor",header:"Actor",mobileLabel:"Actor",mobilePriority:"secondary",
           cell:(row)=>row.actorName?.trim()||"System / unknown"},
          {key:"action",header:"Action",mobileLabel:"Action",mobilePriority:"primary",
           cell:(row)=>row.eventType},
          {key:"type",header:"Entity type",mobileLabel:"Entity type",mobilePriority:"secondary",
           cell:(row)=>row.entityType},
          {key:"entity",header:"Entity ID",mobileLabel:"Entity ID",mobilePriority:"action",
           cell:(row)=>tpoAuditEntityHref(row.entityType,row.entityId)?
            <Link href={tpoAuditEntityHref(row.entityType,row.entityId)!}
             className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline">
             Open {row.entityType.replaceAll("_"," ")} →
            </Link>:
            <span title="No safe direct page is registered for this entity type">{row.entityId}</span>},
        ]}
      />
      <Pagination label="Actor audit pagination" page={data.page} pageCount={data.totalPages} hrefForPage={page=>urlForPage(page)}/>
    </section>
    <p className="text-xs text-muted-foreground">
      TPO-only tenant scope. Export is capped at 2,000 rows and uses neutralized CSV
      formula cells. No private metadata, IP addresses or free-text notes are exported.
    </p>
  </div>;
}
