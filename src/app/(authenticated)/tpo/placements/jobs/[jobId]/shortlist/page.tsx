import { Pagination } from "@/components/ui/pagination";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { tpoShortlistQuerySchema } from "@/modules/placements/tpo-shortlist-model";
import { getTpoDriveShortlist } from "@/modules/placements/tpo-shortlist-service";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";
import { istDateTimeFormatter } from "@/lib/format-date";

type SearchParams = { page?: string | string[] };
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
const dateLabel = istDateTimeFormatter;

export default async function TpoDriveShortlistPage({
  params, searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const [{ jobId }, query] = await Promise.all([params, searchParams]);
  if(Array.isArray(query.page))return <section className="min-w-0 space-y-3">
    <PageHeader title="Current shortlist"/>
    <Alert tone="error">Only one shortlist page number can be selected.</Alert>
    <TextLink href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/shortlist"}
     className="inline-flex min-h-11 items-center md:min-h-9">Clear filters</TextLink>
  </section>;
  const validated = tpoShortlistQuerySchema.safeParse({
    jobId,
    ...(first(query.page) ? { page: first(query.page) } : {}),
  });
  if (!validated.success) notFound();
  let data: Awaited<ReturnType<typeof getTpoDriveShortlist>>;
  try {
    data = await getTpoDriveShortlist(context, validated.data);
  } catch (error) {
    if (error instanceof PlacementsServiceError &&
      error.code === "PLACEMENT_JOB_NOT_FOUND") notFound();
    throw error;
  }

  const pathname = "/tpo/placements/jobs/" + encodeURIComponent(data.job.id) + "/shortlist";
  return (
    <div className="min-w-0 space-y-4">

      <PageHeader
        eyebrow="TPO · Applicants"
        title={data.job.title + " · Current shortlist"}
        description="Current SHORTLISTED screening decisions for submitted applications belonging to active college learners."
        actions={<>
          <ButtonLink variant="secondary" href={"/tpo/placements/jobs/" + encodeURIComponent(data.job.id)}
            className="w-full sm:w-auto">← Drive workspace</ButtonLink>
          <ButtonLink variant="secondary" href={"/api/placements/jobs/" + encodeURIComponent(data.job.id) + "/shortlist/export"}
            className="w-full sm:w-auto">Export shortlist CSV</ButtonLink>
        </>}
      />
      <ButtonLink variant="secondary"
        href={"/tpo/placements/jobs/" + encodeURIComponent(data.job.id) + "/share-preview"}
        className="w-full sm:w-auto"
      >
        Recruiter-visible shortlist report →
      </ButtonLink>
      <p className="text-sm leading-[22px] text-body">
        {data.total} shortlisted application(s). This is an application-level count:
        one learner may have multiple role-option applications. Withdrawn or
        subsequently rejected applications are not counted. Private screening
        comments are not exported.
      </p>
      <section aria-label="Current shortlist entries" className="min-w-0 space-y-3">
        <Heading level={2} size="base" className="text-[var(--lms-heading)]">Current shortlist</Heading>
      <DataTable<(typeof data.rows)[number]> caption="Current shortlist"
        rows={data.rows} getRowKey={item=>item.applicationId}
        empty={<EmptyState title="No currently shortlisted submitted applications appear on this page. A previously shortlisted learner may have withdrawn or changed screening state." />}
        columns={[
          {key:"learner",header:"Learner",mobilePriority:"primary",cell:item=><strong>{item.displayName}</strong>},
          {key:"roll",header:"Roll number",mobilePriority:"secondary",cell:item=>item.rollNumber??"Not recorded"},
          {key:"role",header:"Role option",mobilePriority:"secondary",cell:item=>item.roleTitle},
          {key:"when",header:"Shortlisted at (IST)",mobilePriority:"secondary",cell:item=>item.shortlistedAtIso
            ?dateLabel.format(new Date(item.shortlistedAtIso))+" IST":"Decision timestamp unavailable"},
        ]}/>
      </section>
      <Pagination label="Shortlist pagination" page={data.page} pageCount={data.totalPages} hrefForPage={target=>pathname+"?page="+target}/>
    </div>
  );
}
