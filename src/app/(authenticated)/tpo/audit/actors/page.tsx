import { DateInput } from "@/components/ui/date-input";
import { Pagination } from "@/components/ui/pagination";
import { Disclosure } from "@/components/ui/disclosure";
import { EmptyState } from "@/components/ui/empty-state";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {DataTable} from "@/components/ui/data-table";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoActorAudit } from "@/modules/placements/tpo-actor-audit-service";
import { tpoActorAuditQuerySchema } from "@/modules/placements/tpo-actor-audit-model";
import {tpoAuditEntityHref} from "@/modules/placements/tpo-audit-entity-link-model";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { istDateTimeFormatter } from "@/lib/format-date";
import { formatNumberIN } from "@/lib/safe-format";

import { ROLE } from "@/modules/identity/roles";
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
  if (!context.membership || !hasMembershipRole(context, ROLE.TPO)) redirect("/dashboard");
  await requireTpoBatchActor(context);
  const raw = await searchParams;
  // An ambiguous filter must not be reduced to its first value before the
  // persisted, college-scoped actor and entity history query is executed.
  const allowedKeys = new Set([
    "actorId", "entityType", "entityId", "from", "to", "sort", "page", "pageSize",
  ]);
  const invalidFilterKeys = Object.keys(raw).some(key => !allowedKeys.has(key)) ||
    Object.values(raw).some(Array.isArray);
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
  if (invalidFilterKeys || !parsed.success) {
    return <section role="alert" className="min-w-0 space-y-3">
      <PageHeader title="Invalid audit filters" />
      <TextLink className="inline-flex min-h-11 items-center text-sm md:min-h-9" href="/tpo/audit/actors">
        Clear filters
      </TextLink>
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
  const dateTime = istDateTimeFormatter;
  const hasExactFilters = Boolean(parsed.data.actorId || parsed.data.entityType || parsed.data.entityId ||
    parsed.data.from || parsed.data.to);
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Actor and entity audit"
      description="Canonical placement activity events with exact persisted actor, entity and IST date filters."
      actions={<>
        <ButtonLink variant="secondary" href={exportHref}
          className="w-full md:w-auto">
          Export matching CSV (first 2,000)
        </ButtonLink>
        <TextLink href="/tpo/audit"
          className="inline-flex min-h-11 w-full items-center justify-center text-sm md:min-h-9 md:w-auto">
          ← All audit sources
        </TextLink>
      </>}/>
    <form role="search" aria-label="audit actors filters" action="/tpo/audit/actors" method="get"
      className="min-w-0 space-y-4 border-b border-[var(--lms-canvas-border)] pb-4">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {([
          ["actorId", "Actor user UUID", "00000000-0000-4000-8000-000000000000"],
          ["entityType", "Entity type", "placement_offer"],
        ] as const).map(([name, label, placeholder]) => <Label stack key={name}
          className="min-w-0">
          {label}
          <Input name={name} defaultValue={parsed.data[name] ?? ""} placeholder={placeholder}
          className="min-h-11 md:min-h-9 w-full"/>
        </Label>)}
        {(["from", "to"] as const).map((name) => <Label stack key={name}
          className="min-w-0">
          {name === "from" ? "From (IST)" : "Through (IST)"}
          <DateInput mode="date" name={name} defaultValue={parsed.data[name] ?? ""}
          className="min-h-11 md:min-h-9 w-full"/>
        </Label>)}
      </div>
      <Disclosure title="Entity ID · Sort date · Page size"
        defaultOpen={Boolean(parsed.data.entityId || parsed.data.sort !== "NEWEST" || parsed.data.pageSize !== 25)}
        className="border-t border-[var(--lms-canvas-border)]" contentClassName="pt-3">
        <div className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Label stack className="min-w-0">
            Entity ID
            <Input name="entityId" defaultValue={parsed.data.entityId ?? ""} placeholder="Stored subject ID"
              className="min-h-11 w-full md:min-h-9"/>
          </Label>
          <Label stack className="min-w-0">
            Sort date
            <Select name="sort" defaultValue={parsed.data.sort}
        className="min-h-11 md:min-h-9 w-full">
        <option value="NEWEST">Newest first</option><option value="OLDEST">Oldest first</option>
       </Select>
      </Label>
          <Label stack className="min-w-0">
            Page size
            <Select name="pageSize" defaultValue={String(parsed.data.pageSize)}
          className="min-h-11 md:min-h-9 w-full">
          {[25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
        </Select>
      </Label>
        </div>
      </Disclosure>
      <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Button type="submit" className="w-full sm:w-auto">Apply filters</Button>
        <TextLink href="/tpo/audit/actors" className="inline-flex min-h-11 items-center justify-center px-3 text-sm md:min-h-9">
          Reset filters
        </TextLink>
      </div>
    </form>
    <section className="min-w-0 space-y-4">
      <Heading level={2} className="m-0 text-[length:var(--lms-font-lg)] leading-7 text-[var(--lms-heading)]">
        {formatNumberIN(data.total)} matching canonical record(s)
      </Heading>
      <DataTable
        caption="Matching canonical placement audit records"
        rows={data.rows}
        getRowKey={(row)=>row.id}
        empty={<EmptyState
          title={data.total===0
            ?"No canonical placement events match these exact filters."
            :"This page is outside the available records. Choose an earlier page."}
          action={<ButtonLink variant="secondary" href={data.total===0
              ?(hasExactFilters?"/tpo/audit/actors":"/tpo/audit")
              :urlForPage(data.totalPages)}>
            {data.total===0?(hasExactFilters?"Reset filters":"← All audit sources"):"Choose an earlier page."}
          </ButtonLink>}/>} 
        columns={[
          {key:"action",header:"Action",mobileLabel:"Action",mobilePriority:"primary",
           cell:(row)=>row.eventType},
          {key:"when",header:"Recorded (IST)",mobileLabel:"Recorded (IST)",mobilePriority:"secondary",
           cell:(row)=><time dateTime={row.occurredAt}>{dateTime.format(new Date(row.occurredAt))}</time>},
          {key:"actor",header:"Actor",mobileLabel:"Actor",mobilePriority:"secondary",
           cell:(row)=>row.actorName?.trim()||"System / unknown"},
          {key:"type",header:"Entity type",mobileLabel:"Entity type",mobilePriority:"secondary",
           cell:(row)=>row.entityType},
          {key:"entity",header:"Entity ID",mobileLabel:"Entity ID",mobilePriority:"action",
           cell:(row)=>tpoAuditEntityHref(row.entityType,row.entityId)?
            <TextLink href={tpoAuditEntityHref(row.entityType,row.entityId)!}
             className="inline-flex min-h-11 items-center">
             Open {row.entityType.replaceAll("_"," ")} →
            </TextLink>:
            <span title="No safe direct page is registered for this entity type">{row.entityId}</span>},
        ]}
      />
      {data.totalPages>1?<Pagination label="Actor audit pagination" page={data.page} pageCount={data.totalPages} hrefForPage={page=>urlForPage(page)}/>:null}
    </section>
    <div className="min-w-0 space-y-2 border-t border-[var(--lms-canvas-border)] pt-4">
      <p className="max-w-[72ch] text-sm text-body leading-[22px]">
        Only the canonical PLACEMENTS activity stream has consistent actor/entity attribution.
        Domain-history and share events remain on the original Audit log. An empty result
        does not prove no action occurred in a domain without an activity writer.
      </p>
      <p className="max-w-[72ch] text-xs text-muted-foreground leading-5">
        TPO-only tenant scope. Export is capped at 2,000 rows and uses neutralized CSV
        formula cells. No private metadata, IP addresses or free-text notes are exported.
      </p>
    </div>
  </div>;
}
