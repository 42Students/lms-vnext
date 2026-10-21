import {DataTable} from "@/components/ui/data-table";
import {MetricBar} from "@/components/ui/metric-bar";
import yearStyles from "@/components/tpo/legacy-company-year-chart.module.css";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { PageHeader } from "@/components/ui/page-header";
import { Disclosure } from "@/components/ui/disclosure";
import { StatTile } from "@/components/ui/stat-tile";
import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { TpoPublicJoinLinkCard } from "@/components/tpo/tpo-public-join-link-card";
import {TpoCompanyTeamConversation} from "@/components/tpo/tpo-company-team-conversation";
import {TpoCompanyTrustSwitch} from "@/components/placements/tpo-company-trust-switch";
import {getTpoCompanyLifecycle} from "@/modules/placements/tpo-company-lifecycle-service";
import { StatusBadge } from "@/components/ui/status-badge";
import { can } from "@/modules/permissions/policy";
import { tpoCompanyDetailQuerySchema } from "@/modules/placements/tpo-companies-view-service";
import { getTpoCompanyDetailReadOnly } from "@/modules/placements/tpo-company-detail-read-service";
import { getTpoPublicJoinLinkStatus } from "@/modules/placements/tpo-public-join-link-service";

function dateLabel(value: Date | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function currency(value: number | null) {
  return value === null
    ? "Not recorded"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value);
}

export default async function TpoCompanyDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const context = await getCurrentRequestContext();

  if (
    !context.membership ||
    !can(context,"placements.manage",{collegeId:context.membership.collegeId})
  ) {
    redirect("/dashboard");
  }

  await requireTpoBatchActor(context);
  const route = await params;

  const parsed = tpoCompanyDetailQuerySchema.safeParse({
    collegeId: context.membership.collegeId,
    companyId: route.companyId,
  });

  if (!parsed.success) notFound();

  const detail = await getTpoCompanyDetailReadOnly(
    context,
    parsed.data.companyId,
  );

  if (!detail) notFound();
  const companyLink = await getTpoPublicJoinLinkStatus(context, "COMPANY", route.companyId);
  const lifecycle = await getTpoCompanyLifecycle(context,route.companyId);

  const {
    company,
    contacts,
    drives,
    hiringHistory,
    timeline,
    contactsAvailable,
    activitiesAvailable,
    relationship,
    hiringPulse,
  } = detail;
  const maxYearlyHires=Math.max(1,...hiringPulse.hiredPerYear.map(row=>row.joinedLearners));

  return (
    <div className="min-w-0 space-y-4">
      <PageHeader
        eyebrow="TPO · Company detail"
        title={company.name}
        description="College-linked contacts, placement drives, hiring records and a timeline drawn from persisted events only."
        actions={
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href={"/tpo/placements/new?company="+encodeURIComponent(company.name)}
              className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-on-primary">
              Create drive
            </Link>
            <Link href={"/tpo/recruiters?add=1&company="+encodeURIComponent(company.name)}
              className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
              Add contact
            </Link>
      <Link
        href="/tpo/companies"
        className="lms-inline-link inline-flex min-h-11 items-center text-sm font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
      >
        ← All companies
      </Link>

          </div>
        }
      />

      <section aria-label="College company relationship" className="border-b border-[var(--lms-canvas-border)] py-4">
        <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-7">College relationship and trust</h2>
        <p className="mt-2 text-sm text-body leading-[22px]">
          Trust is this college&apos;s recorded relationship setting, not a platform-wide employer verification.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <StatusBadge tone={relationship?.isTrusted ? "success" : "neutral"}>
            {relationship?.trustLabel ?? "Trust unavailable"}
          </StatusBadge>
          <StatusBadge tone={relationship?.relationshipStatus==="ACTIVE"?"success":"neutral"}>{relationship?.relationshipStatus ?? "Status unavailable"}</StatusBadge>
          <span className="text-sm text-body">
            Updated {relationship?.updatedAt ? dateLabel(new Date(relationship.updatedAt)) + " IST" : "not recorded"}
          </span>
        </div>
        {lifecycle?.status==="ACTIVE"?
         <TpoCompanyTrustSwitch companyId={route.companyId}
           initialTrusted={lifecycle.isTrusted} updatedAt={lifecycle.updatedAt}/>:null}
      </section>

      {!contactsAvailable ? (
        <Alert tone="warning">
          Recruiter CRM data is unavailable in this database.
          Contact counts and interaction history cannot be
          verified; the drive and hiring sections remain sourced
          from persisted placement records.
        </Alert>
      ) : null}

      {contactsAvailable && !activitiesAvailable ? (
        <Alert tone="warning">
          Recruiter contact activity storage is unavailable.
          The timeline below contains only available drive,
          offer and joining events.
        </Alert>
      ) : null}

      <section className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-5">
        {([
          ["Contacts", company.contacts ?? "Unavailable"],
          ["Drives", company.drives],
          ["Offers", company.offers],
          ["Accepted offers", company.acceptedOffers],
          ["Confirmed joined learners", company.confirmedJoinedLearners],
        ] as const).map(([label, value]) => (
          <StatTile key={label} label={label} value={value} className={tpoTileStyles.tile} />
        ))}
      </section>

      <Disclosure title="Company access, email domain and recruiter join link" className="border-b border-[var(--lms-canvas-border)]" contentClassName="pt-3">
      <TpoPublicJoinLinkCard initial={companyLink} scope="COMPANY" companyId={route.companyId} companyName={detail.company.name} />
      <TpoCompanyTeamConversation companyId={route.companyId} companyName={company.name} actorMembershipId={context.membership.id} />

      </Disclosure>
      <Disclosure title="Company CRM views" className="border-b border-[var(--lms-canvas-border)]" contentClassName="pt-3">
      <nav aria-label="Company CRM views" className="flex flex-wrap gap-3">
        <Link href={"/tpo/companies/"+encodeURIComponent(route.companyId)+"/team"}
         className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
         Open in Team · Company discussion
        </Link>
        <Link
          href={"/tpo/companies/" + encodeURIComponent(route.companyId) + "/manage"}
          className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)]"
        >
          Edit / archive relationship
        </Link>
        <Link
          href={"/tpo/companies/" + encodeURIComponent(route.companyId) + "/people"}
          className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)]"
        >
          Manage contact people
        </Link>
        <Link
          href={"/tpo/companies/" + encodeURIComponent(route.companyId) + "/contact-log"}
          className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-[650] text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
        >
          View contact activity log →
        </Link>
        <Link
          href={"/tpo/companies/" + encodeURIComponent(route.companyId) + "/feedback"}
          className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)]"
        >
          Internal recruiter feedback
        </Link>
      </nav>

      </Disclosure>
      <Disclosure title="Employer hiring pulse" className="border-b border-[var(--lms-canvas-border)]" contentClassName="pt-3">
      <section aria-label="College employer hiring pulse" className="border-b border-[var(--lms-canvas-border)] py-4">
        <h2 className="sr-only">Employer hiring pulse</h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Current college-linked drives and stored offer versions. Season counts reflect drives,
          not confirmed hires. A later activity timestamp is unavailable when no event exists.
        </p>
        <dl className="mt-4 grid min-w-0 gap-0 overflow-hidden border-y border-border md:grid-cols-2 xl:grid-cols-5">
          {[
            ["Currently published drives", String(hiringPulse.activeDrives)],
            ["Seasons with recorded drives", String(hiringPulse.seasonsWithDrives)],
            ["Distinct learners with accepted offers", String(hiringPulse.distinctAcceptedLearners)],
            ["Distinct confirmed joined learners", String(hiringPulse.distinctConfirmedJoinedLearners)],
            ["Years hiring (confirmed)", String(hiringPulse.yearsHiring)],
            ["Latest recorded event", hiringPulse.latestRecordedEventIso
              ? dateLabel(new Date(hiringPulse.latestRecordedEventIso)) + " IST"
              : "Not recorded"],
          ].map(([name, value]) => (
            <div key={name} className="min-w-0 border-b border-r border-border px-3 py-3 last:border-r-0">
              <dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">{name}</dt>
              <dd className={name==="Latest recorded event"?"mt-2 break-words text-[var(--lms-font-sm)] font-semibold leading-5 text-[var(--lms-body-text)]":"mt-2 break-words text-[var(--lms-font-2xl)] font-semibold leading-[1.3] tabular-nums text-[var(--lms-heading)]"}>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 border-t border-border pt-4">
          <h3 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] min-[768px]:text-[var(--lms-font-lg)] min-[768px]:leading-[26px]">Students placed, by year</h3>
          <p className="mt-1 text-xs text-muted-foreground leading-5">
            Distinct confirmed JOINED learners by recorded joining year (IST), not offers issued.
            {hiringPulse.yearsHiring>=2
              ?" Repeat hiring relationship across "+hiringPulse.yearsHiring+" recorded years."
              :" No repeat-year hiring relationship established."}
            {hiringPulse.confirmedJoinsWithoutYear>0
              ?" "+hiringPulse.confirmedJoinsWithoutYear+" confirmed join(s) have no recorded joining date and are excluded from the chart."
              :""}
          </p>
          {hiringPulse.hiredPerYear.length===0
            ?<EmptyState title="No dated, confirmed joins have been recorded for this college-company relationship."/>
            :<ol className="mt-3 space-y-2" aria-label="Confirmed joined learners per year">
              {hiringPulse.hiredPerYear.map(row=><li key={row.year}
                className={yearStyles.yearRow}>
                <span className={yearStyles.year}>{row.year}</span>
                <MetricBar role="img" className={yearStyles.track} label={row.year+": "+row.joinedLearners+" confirmed joined learners"}
                  value={row.joinedLearners} maximum={maxYearlyHires} unit="learners" />
                <strong className={yearStyles.count}>{row.joinedLearners}</strong>
              </li>)}
            </ol>}
        </div>
      </section>

      </Disclosure>
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <section className="min-w-0 border-b border-[var(--lms-canvas-border)] py-3">
          <div className="border-b border-[var(--lms-canvas-border)] py-4">
            <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-7">
              Recruiter contacts
            </h2>
            <p className="mt-1 text-sm text-body leading-[22px]">
              Contacts explicitly linked to this college-company
              relationship.
            </p>
          </div>

          {!contactsAvailable ? (
            <p className="py-4 text-sm text-body leading-[22px]">
              Contact data is unavailable.
            </p>
          ) : contacts.length === 0 ? (
            <p className="py-4 text-sm text-body leading-[22px]">
              No recruiter contacts are linked to this
              company relationship.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--lms-canvas-border)]">
              {contacts.map((contact) => (
                <li key={contact.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/tpo/recruiters/${encodeURIComponent(contact.id)}`}
                        className="font-semibold text-link hover:underline"
                      >
                        {contact.name}
                      </Link>
                      {contact.designation ? (
                        <p className="mt-1 text-sm text-body leading-[22px]">
                          {contact.designation}
                        </p>
                      ) : null}
                      <p className="mt-1 break-all text-xs text-muted-foreground leading-5">
                        {[contact.email, contact.phone]
                          .filter(Boolean)
                          .join(" · ") || "No contact details"}
                      </p>
                      {contact.source ? (
                        <p className="mt-1 text-xs text-muted-foreground leading-5">
                          Source: {contact.source}
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge
                      tone={
                        contact.stage === "NOT_NOW"
                          ? "warning"
                          : contact.stage === "JOINED" || contact.stage === "RECRUITED" ? "success" : contact.stage === "DRIVE_PLANNED" ? "info" : "neutral"
                      }
                    >
                      {({NOT_NOW:"Not now",DRIVE_PLANNED:"Drive planned",RECRUITED:"Recruited",JOINED:"Joined",INVITED:"Invited",CONTACTED:"Contacted",NEW:"New"} as Record<string,string>)[contact.stage]??"Recorded"}
                    </StatusBadge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="min-w-0 border-b border-[var(--lms-canvas-border)] py-3">
          <div className="border-b border-[var(--lms-canvas-border)] py-4">
            <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-7">
              Placement drives
            </h2>
            <p className="mt-1 text-sm text-body leading-[22px]">
              All persisted jobs associated with this
              company relationship, including archived history.
            </p>
          </div>

          {drives.length === 0 ? (
            <p className="py-4 text-sm text-body leading-[22px]">
              No placement drives are recorded for this company.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                caption="Company placement drives"
                rows={drives} getRowKey={drive=>drive.id}
                empty={<EmptyState title="No placement drives are recorded for this company."/>}
                columns={[
                  {key:"drive",header:"Drive",mobileLabel:"Drive",mobilePriority:"primary",
                   cell:drive=><div className="min-w-0">
                    <Link href={"/tpo/placements/jobs/"+encodeURIComponent(drive.id)}
                     className="lms-inline-link inline-flex min-h-11 items-center break-words font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">{drive.title}</Link>
                    <p className="mt-1 text-xs text-muted-foreground leading-5">{drive.employmentType.replaceAll("_"," ")}</p>
                   </div>},
                  {key:"status",header:"Status",mobileLabel:"Status",mobilePriority:"secondary",
                   cell:drive=><StatusBadge tone={drive.status==="PUBLISHED"?"success":drive.status==="DRAFT"?"warning":drive.status==="CANCELLED"?"error":"neutral"}>
                    {({PUBLISHED:"Live",CLOSED:"Completed",DRAFT:"Draft",REQUEST:"Sent for review",CANCELLED:"Cancelled"} as Record<string,string>)[drive.status]??"Recorded"}
                   </StatusBadge>},
                  {key:"created",header:"Created",mobileLabel:"Created",mobilePriority:"secondary",
                   cell:drive=>dateLabel(drive.createdAt)},
                ]}
              />
            </div>
          )}
        </section>
      </div>

      <section className="min-w-0 border-y border-[var(--lms-canvas-border)]">
        <div className="border-b border-[var(--lms-canvas-border)] py-4">
          <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-7">
            Hiring history
          </h2>
          <p className="mt-1 text-sm text-body leading-[22px]">
            Recorded offers and joining outcomes across this
            company&apos;s placement drives. An accepted offer
            does not automatically mean the learner joined.
          </p>
        </div>

        {hiringHistory.length === 0 ? (
          <p className="py-4 text-sm text-body leading-[22px]">
            No placement offers are recorded for this company.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              caption="Company hiring history"
              rows={hiringHistory} getRowKey={offer=>offer.id}
              empty={<EmptyState title="No placement offers are recorded for this company."/>}
              columns={[
                {key:"role",header:"Role",mobileLabel:"Role",mobilePriority:"primary",cell:offer=>offer.roleTitle},
                {key:"ctc",header:"Annual CTC",mobileLabel:"Annual CTC",mobilePriority:"secondary",
                 cell:offer=>currency(offer.annualCtcInr)},
                {key:"offer",header:"Offer",mobileLabel:"Offer",mobilePriority:"secondary",
                 cell:offer=><StatusBadge tone={offer.status==="ACCEPTED"?"success":offer.status==="DECLINED"?"error":offer.status==="PENDING"?"warning":"neutral"}>
                  {({ACCEPTED:"Accepted",DECLINED:"Declined",PENDING:"Pending",WITHDRAWN:"Withdrawn"} as Record<string,string>)[offer.status]??"Recorded"}
                 </StatusBadge>},
                {key:"joining",header:"Joining",mobileLabel:"Joining",mobilePriority:"secondary",
                 cell:offer=>offer.joiningStatus?({JOINED:"Joined",NOT_JOINED:"Not joined",PENDING:"Pending",DEFERRED:"Deferred"} as Record<string,string>)[offer.joiningStatus]??"Recorded":"Not recorded"},
                {key:"issued",header:"Issued",mobileLabel:"Issued",mobilePriority:"secondary",
                 cell:offer=>dateLabel(offer.issuedAt)},
                {key:"drive",header:"Drive",mobileLabel:"Drive",mobilePriority:"action",
                 cell:offer=><Link href={"/tpo/placements/jobs/"+encodeURIComponent(offer.jobId)}
                  className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Open drive</Link>},
              ]}
            />
          </div>
        )}

        <p className="px-6 py-4 text-xs leading-5 text-muted-foreground">
          Hiring history represents persisted offer records,
          including versions and non-accepted statuses. Confirmed
          joins require an explicit JOINED outcome. No external
          offers or unregistered placement tables are queried.
        </p>
      </section>

      <Disclosure title="Company timeline" className="border-b border-[var(--lms-canvas-border)]" contentClassName="pt-3">
      <section className="min-w-0 border-y border-[var(--lms-canvas-border)]">
        <div className="border-b border-[var(--lms-canvas-border)] py-4">
          <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-7">
            Company timeline
          </h2>
          <p className="mt-1 text-sm text-body leading-[22px]">
            Most recent 100 recorded contact, drive,
            offer and joining events.
          </p>
        </div>

        {timeline.length === 0 ? (
          <p className="py-4 text-sm text-body leading-[22px]">
            No persisted timeline events are available.
          </p>
        ) : (
          <ol className="divide-y divide-[var(--lms-canvas-border)]">
            {timeline.map((event) => (
              <li key={event.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-[22px]">
                      {event.type.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-body leading-[22px]">
                      {event.description}
                    </p>
                    {event.href ? (
                      <Link
                        href={event.href}
                        className="mt-2 inline-block text-sm font-semibold text-link hover:underline"
                      >
                        Open related record →
                      </Link>
                    ) : null}
                  </div>
                  <time
                    dateTime={event.at.toISOString()}
                    className="text-xs text-muted-foreground"
                  >
                    {dateLabel(event.at)} IST
                  </time>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>      </Disclosure>

      <p className="text-xs leading-5 text-muted-foreground">
        Only canonical company relationships and explicitly
        linked recruiter contacts contribute to this page.
        Unlinked CRM names are shown separately in the companies
        directory. Company documents and the legacy interaction
        workflow remain outside this read-only implementation.
      </p>
    </div>
  );
}
