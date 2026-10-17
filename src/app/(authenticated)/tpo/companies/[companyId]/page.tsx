import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { TpoPublicJoinLinkCard } from "@/components/tpo/tpo-public-join-link-card";
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
    <div className="space-y-6">
      <Link
        href="/tpo/companies"
        className="inline-flex min-h-9 items-center text-sm font-semibold text-primary-text hover:underline"
      >
        ← All companies
      </Link>

      <PageHeader
        eyebrow="TPO · Company detail"
        title={company.name}
        description="College-linked contacts, placement drives, hiring records and a timeline drawn from persisted events only."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={"/tpo/placements/new?company="+encodeURIComponent(company.name)}
              className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
              Create drive
            </Link>
            <Link href={"/tpo/recruiters?add=1&company="+encodeURIComponent(company.name)}
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text">
              Add contact
            </Link>
          </div>
        }
      />

      <TpoPublicJoinLinkCard initial={companyLink} scope="COMPANY" companyId={route.companyId} companyName={detail.company.name} />

      <section aria-label="College company relationship" className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">College relationship and trust</h2>
        <p className="mt-2 text-sm text-body">
          Trust is this college&apos;s recorded relationship setting, not a platform-wide employer verification.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <StatusBadge tone={relationship?.isTrusted ? "success" : "neutral"}>
            {relationship?.trustLabel ?? "Trust unavailable"}
          </StatusBadge>
          <StatusBadge>{relationship?.relationshipStatus ?? "Status unavailable"}</StatusBadge>
          <span className="text-sm text-body">
            Updated {relationship?.updatedAt ? dateLabel(new Date(relationship.updatedAt)) + " IST" : "not recorded"}
          </span>
        </div>
        {lifecycle?.status==="ACTIVE"?
         <TpoCompanyTrustSwitch companyId={route.companyId}
           initialTrusted={lifecycle.isTrusted} updatedAt={lifecycle.updatedAt}/>:null}
      </section>

      <nav aria-label="Company CRM views" className="flex flex-wrap gap-3">
        <Link
          href={"/tpo/companies/" + encodeURIComponent(route.companyId) + "/manage"}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground"
        >
          Edit / archive relationship
        </Link>
        <Link
          href={"/tpo/companies/" + encodeURIComponent(route.companyId) + "/people"}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground"
        >
          Manage contact people
        </Link>
        <Link
          href={"/tpo/companies/" + encodeURIComponent(route.companyId) + "/contact-log"}
          className="inline-flex min-h-10 items-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
        >
          View contact activity log →
        </Link>
        <Link
          href={"/tpo/companies/" + encodeURIComponent(route.companyId) + "/feedback"}
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground"
        >
          Internal recruiter feedback
        </Link>
      </nav>

      {!contactsAvailable ? (
        <section
          role="status"
          className="rounded-xl border border-border bg-surface p-4 text-sm leading-6 text-body"
        >
          Recruiter CRM data is unavailable in this database.
          Contact counts and interaction history cannot be
          verified; the drive and hiring sections remain sourced
          from persisted placement records.
        </section>
      ) : null}

      {contactsAvailable && !activitiesAvailable ? (
        <section
          role="status"
          className="rounded-xl border border-border bg-surface p-4 text-sm leading-6 text-body"
        >
          Recruiter contact activity storage is unavailable.
          The timeline below contains only available drive,
          offer and joining events.
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Contacts", company.contacts ?? "Unavailable"],
          ["Drives", company.drives],
          ["Offers", company.offers],
          ["Accepted offers", company.acceptedOffers],
          ["Confirmed joined learners", company.confirmedJoinedLearners],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="text-xs font-semibold text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
              {value}
            </p>
          </div>
        ))}
      </section>

      <section aria-label="College employer hiring pulse" className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Employer hiring pulse</h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Current college-linked drives and stored offer versions. Season counts reflect drives,
          not confirmed hires. A later activity timestamp is unavailable when no event exists.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
            <div key={name} className="rounded-lg border border-border p-3">
              <dt className="text-xs font-semibold text-muted-foreground">{name}</dt>
              <dd className="mt-2 break-words text-sm font-semibold tabular-nums text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-foreground">Students placed, by year</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Distinct confirmed JOINED learners by recorded joining year (IST), not offers issued.
            {hiringPulse.yearsHiring>=2
              ?" Repeat hiring relationship across "+hiringPulse.yearsHiring+" recorded years."
              :" No repeat-year hiring relationship established."}
            {hiringPulse.confirmedJoinsWithoutYear>0
              ?" "+hiringPulse.confirmedJoinsWithoutYear+" confirmed join(s) have no recorded joining date and are excluded from the chart."
              :""}
          </p>
          {hiringPulse.hiredPerYear.length===0
            ?<p role="status" className="mt-3 rounded-md border border-border p-3 text-sm text-muted-foreground">
              No dated, confirmed joins have been recorded for this college-company relationship.
             </p>
            :<ol className="mt-3 space-y-2" aria-label="Confirmed joined learners per year">
              {hiringPulse.hiredPerYear.map(row=><li key={row.year}
                className="grid grid-cols-[4rem_1fr_3rem] items-center gap-3 text-sm">
                <span className="font-medium tabular-nums">{row.year}</span>
                <div className="h-4 rounded-sm bg-surface-secondary" aria-hidden="true">
                  <div className="h-full rounded-sm bg-primary"
                    style={{width:Math.max(3,row.joinedLearners/maxYearlyHires*100)+"%"}}/>
                </div>
                <strong className="text-right tabular-nums">{row.joinedLearners}</strong>
              </li>)}
            </ol>}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="min-w-0 rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              Recruiter contacts
            </h2>
            <p className="mt-1 text-sm text-body">
              Contacts explicitly linked to this college-company
              relationship.
            </p>
          </div>

          {!contactsAvailable ? (
            <p className="p-5 text-sm text-body">
              Contact data is unavailable.
            </p>
          ) : contacts.length === 0 ? (
            <p className="p-5 text-sm text-body">
              No recruiter contacts are linked to this
              company relationship.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {contacts.map((contact) => (
                <li key={contact.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/tpo/recruiters/${encodeURIComponent(contact.id)}`}
                        className="font-semibold text-primary-text hover:underline"
                      >
                        {contact.name}
                      </Link>
                      {contact.designation ? (
                        <p className="mt-1 text-sm text-body">
                          {contact.designation}
                        </p>
                      ) : null}
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {[contact.email, contact.phone]
                          .filter(Boolean)
                          .join(" · ") || "No contact details"}
                      </p>
                      {contact.source ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Source: {contact.source}
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge
                      tone={
                        contact.stage === "NOT_NOW"
                          ? "warning"
                          : "neutral"
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

        <section className="min-w-0 rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              Placement drives
            </h2>
            <p className="mt-1 text-sm text-body">
              All persisted jobs associated with this
              company relationship, including archived history.
            </p>
          </div>

          {drives.length === 0 ? (
            <p className="p-5 text-sm text-body">
              No placement drives are recorded for this company.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <ul aria-label="Company drive cards" className="divide-y divide-border md:hidden">
               {drives.map(drive=><li key={drive.id} className="space-y-2 p-4 text-sm">
                <Link href={"/tpo/placements/jobs/"+encodeURIComponent(drive.id)}
                 className="block break-words font-semibold text-primary-text underline">{drive.title}</Link>
                <p className="text-body">{({PUBLISHED:"Live",CLOSED:"Completed",DRAFT:"Draft",REQUEST:"Sent for review",CANCELLED:"Cancelled"} as Record<string,string>)[drive.status]??"Recorded"}
                 {" · "+drive.employmentType.replaceAll("_"," ")}</p>
                <p className="text-xs text-muted-foreground">Created {dateLabel(drive.createdAt)}</p>
               </li>)}
              </ul>
              <table className="hidden w-full min-w-[34rem] text-left text-sm md:table">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3">Drive</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {drives.map((drive) => (
                    <tr
                      key={drive.id}
                      className="border-t border-border"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/tpo/placements/jobs/${encodeURIComponent(
                            drive.id,
                          )}`}
                          className="font-semibold text-primary-text hover:underline"
                        >
                          {drive.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {drive.employmentType.replaceAll("_", " ")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          tone={
                            drive.status === "PUBLISHED"
                              ? "success"
                              : "neutral"
                          }
                        >
                          {({PUBLISHED:"Live",CLOSED:"Completed",DRAFT:"Draft",REQUEST:"Sent for review",CANCELLED:"Cancelled"} as Record<string,string>)[drive.status]??"Recorded"}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        {dateLabel(drive.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Hiring history
          </h2>
          <p className="mt-1 text-sm text-body">
            Recorded offers and joining outcomes across this
            company&apos;s placement drives. An accepted offer
            does not automatically mean the learner joined.
          </p>
        </div>

        {hiringHistory.length === 0 ? (
          <p className="p-5 text-sm text-body">
            No placement offers are recorded for this company.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <ul aria-label="Company hiring cards" className="divide-y divide-border md:hidden">
             {hiringHistory.map(offer=><li key={offer.id} className="space-y-2 p-4 text-sm">
              <p className="break-words font-semibold text-foreground">{offer.roleTitle}</p>
              <dl className="grid grid-cols-2 gap-2 text-body">
               <div><dt className="text-xs text-muted-foreground">Annual CTC</dt><dd>{currency(offer.annualCtcInr)}</dd></div>
               <div><dt className="text-xs text-muted-foreground">Offer</dt><dd>{({ACCEPTED:"Accepted",DECLINED:"Declined",PENDING:"Pending",WITHDRAWN:"Withdrawn"} as Record<string,string>)[offer.status]??"Recorded"}</dd></div>
               <div><dt className="text-xs text-muted-foreground">Joining</dt><dd>{offer.joiningStatus?({JOINED:"Joined",NOT_JOINED:"Not joined",PENDING:"Pending",DEFERRED:"Deferred"} as Record<string,string>)[offer.joiningStatus]??"Recorded":"Not recorded"}</dd></div>
               <div><dt className="text-xs text-muted-foreground">Issued</dt><dd>{dateLabel(offer.issuedAt)}</dd></div>
              </dl>
              <Link href={"/tpo/placements/jobs/"+encodeURIComponent(offer.jobId)}
               className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Open drive</Link>
             </li>)}
            </ul>
            <table className="hidden w-full min-w-[65rem] text-left text-sm md:table">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Role</th>
                  <th scope="col" className="px-4 py-3">Annual CTC</th>
                  <th scope="col" className="px-4 py-3">Offer</th>
                  <th scope="col" className="px-4 py-3">Joining</th>
                  <th scope="col" className="px-4 py-3">Issued</th>
                  <th scope="col" className="px-4 py-3">Drive</th>
                </tr>
              </thead>
              <tbody>
                {hiringHistory.map((offer) => (
                  <tr
                    key={offer.id}
                    className="border-t border-border align-top"
                  >
                    <td className="px-4 py-3 text-body">
                      {offer.roleTitle}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-body">
                      {currency(offer.annualCtcInr)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={
                          offer.status === "ACCEPTED"
                            ? "success"
                            : offer.status === "DECLINED"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {({ACCEPTED:"Accepted",DECLINED:"Declined",PENDING:"Pending",WITHDRAWN:"Withdrawn"} as Record<string,string>)[offer.status]??"Recorded"}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      {offer.joiningStatus?({JOINED:"Joined",NOT_JOINED:"Not joined",PENDING:"Pending",DEFERRED:"Deferred"} as Record<string,string>)[offer.joiningStatus]??"Recorded":"Not recorded"}
                    </td>
                    <td className="px-4 py-3 text-body">
                      {dateLabel(offer.issuedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tpo/placements/jobs/${encodeURIComponent(
                          offer.jobId,
                        )}`}
                        className="font-semibold text-primary-text hover:underline"
                      >
                        Open drive
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="px-5 py-4 text-xs leading-5 text-muted-foreground">
          Hiring history represents persisted offer records,
          including versions and non-accepted statuses. Confirmed
          joins require an explicit JOINED outcome. No external
          offers or unregistered placement tables are queried.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Company timeline
          </h2>
          <p className="mt-1 text-sm text-body">
            Most recent 100 recorded contact, drive,
            offer and joining events.
          </p>
        </div>

        {timeline.length === 0 ? (
          <p className="p-5 text-sm text-body">
            No persisted timeline events are available.
          </p>
        ) : (
          <ol className="divide-y divide-border">
            {timeline.map((event) => (
              <li key={event.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {event.type.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-body">
                      {event.description}
                    </p>
                    {event.href ? (
                      <Link
                        href={event.href}
                        className="mt-2 inline-block text-sm font-semibold text-primary-text hover:underline"
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
      </section>

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
