import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {PageBackLink} from "@/components/ui/page-back-link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { TpoRoundCalendarControl } from "@/components/placements/tpo-round-calendar-control";
import { hasMembershipRole } from "@/modules/identity/context";
import { listTpoCalendarRoundChoices } from "@/modules/placements/tpo-round-calendar-service";
import {getTpoBlockedDates} from "@/modules/placements/tpo-configuration-read-service";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import {z} from "zod";
import { ROLE } from "@/modules/identity/roles";
export default async function TpoRoundCalendarPage({searchParams}:{
 searchParams:Promise<{page?:string|string[];q?:string|string[]}>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, ROLE.TPO)) redirect("/dashboard");
  const raw=await searchParams;
  const parsed=z.strictObject({
    page:z.coerce.number().int().min(1).max(10000).default(1),
    q:z.string().trim().max(100).default(""),
  }).safeParse(raw);
  if(!parsed.success||Object.values(raw).some(Array.isArray))return <div className="min-w-0 space-y-4">
    <PageHeader title="Invalid round filters"/>
    <p role="alert" className="text-sm text-body">Provide one valid page and search value. No rounds were queried.</p>
    <TextLink href="/tpo/calendar/rounds" className="inline-flex min-h-11 items-center">Clear round filters</TextLink>
  </div>;
  const [result,blockedDates] = await Promise.all([listTpoCalendarRoundChoices(context,parsed.data),getTpoBlockedDates(context)]);
  const link=(page:number)=>"/tpo/calendar/rounds?"+new URLSearchParams({
   ...(result.q?{q:result.q}:{}),page:String(page),
  }).toString();
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Drive round scheduling"
      description="Schedule an existing pending drive round, reschedule an active one or cancel it. All times are IST." actions={<PageBackLink href="/tpo/calendar" label="Calendar"/>} />
    <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-[8px] border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]" aria-label="Filter rounds">
     <Label stack className="w-full min-w-0 flex-1 md:min-w-56">Find rounds
      <Input type="search" name="q" maxLength={100} defaultValue={result.q}
       placeholder="Company, drive or round name" />
     </Label>
     <Button type="submit" variant="primary" className="min-h-11 w-full px-4 md:w-auto md:min-h-9">Find</Button>
     <TextLink href="/tpo/calendar/rounds" className="inline-flex min-h-11 items-center justify-center text-[14px] md:min-h-9">Clear</TextLink>
    </form>
    <p role="status" className="text-[13px] text-[var(--lms-muted-text)]">Page {result.page}: {result.rows.length} rounds{result.limited?" · more available":""}</p>
    <TpoRoundCalendarControl blockedDates={blockedDates.ready?blockedDates.rows.map(row=>row.day):[]} blockedDatesAvailable={blockedDates.ready}
     choices={result.rows.map((row) => ({
      ...row, updatedAt: row.updatedAt.toISOString(),
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
    }))} />
    {(result.page>1||result.limited)?<nav aria-label="Round pages" className="flex min-w-0 flex-wrap items-center gap-3">
     {result.page>1?<ButtonLink variant="secondary" href={link(result.page-1)}>Previous 200</ButtonLink>:null}
     {result.limited?<ButtonLink variant="secondary" href={link(result.page+1)}>Next 200</ButtonLink>:null}
    </nav>:null}
    <p className="text-sm text-body leading-[22px]">Venue checks use persisted on-campus bookings.
      Unknown duration is a blocker, not an assumed clear venue.
      A pending round is created under its drive before being scheduled here.</p>
  </div>;
}
