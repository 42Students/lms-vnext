import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { AuthorizationError } from "@/modules/permissions/policy";
import { Disclosure } from "@/components/ui/disclosure";
import type { RequestContext } from "@/modules/identity/context";
import {
  listPlacementCompanies,
  listPlacementRelationshipOwners,
} from "@/modules/placements/company-service";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";
import { listPlacementRecruiterGrants } from "@/modules/placements/recruiter-service";
import { listPlacementSeasons } from "@/modules/placements/season-service";
import { PlacementEmployerRelationships } from "./placement-employer-relationships";
import { PlacementRecruiterAccess } from "./placement-recruiter-access";
import { PlacementOperationsOverview } from "./placement-operations-overview";
import { PlacementSeasonManager } from "./placement-season-manager";

export async function PlacementOperationsWorkspace({
  context,
  collegeId,
  basePath,
  staleDays = 7,
}: {
  context: RequestContext;
  collegeId: string;
  basePath: string;
  staleDays?: number;
}) {
  // The old drives landing keeps independent panels usable when a secondary
  // data source fails. Never turn a failed read into an empty-success dataset.
  const [
    operationsResult,
    relationshipsResult,
    ownersResult,
    recruiterGrantsResult,
    seasonsResult,
  ] = await Promise.allSettled([
    getPlacementTpoOperations(
      context,
      collegeId,
      undefined,
      staleDays,
    ),
    listPlacementCompanies(
      context,
      collegeId,
    ),
    listPlacementRelationshipOwners(
      context,
      collegeId,
    ),
    listPlacementRecruiterGrants(
      context,
      collegeId,
    ),
    listPlacementSeasons(
      context,
      collegeId,
    ),
  ]);
  for (const result of [
    operationsResult, relationshipsResult, ownersResult,
    recruiterGrantsResult, seasonsResult,
  ]) {
    if (result.status === "rejected" && result.reason instanceof AuthorizationError) {
      throw result.reason;
    }
  }
  const operations = operationsResult.status === "fulfilled" ? operationsResult.value : null;
  const relationships = relationshipsResult.status === "fulfilled" ? relationshipsResult.value : null;
  const owners = ownersResult.status === "fulfilled" ? ownersResult.value : null;
  const recruiterGrants = recruiterGrantsResult.status === "fulfilled" ? recruiterGrantsResult.value : null;
  const seasons = seasonsResult.status === "fulfilled" ? seasonsResult.value : null;
  const retry = (
    <Link href={basePath} className="ml-2 font-semibold text-link underline underline-offset-2">
      Retry
    </Link>
  );

  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      {operations ? <PlacementOperationsOverview
        operations={operations}
        basePath={basePath}
        showDriveSearch={basePath.startsWith("/admin/")}
        staleDays={staleDays}
      /> : <Alert tone="warning">
        Couldn&apos;t load drives. Check your connection and retry.{retry}
        Other placement settings remain available.
      </Alert>}
      {seasons ? <Disclosure title="Placement season" defaultOpen={!seasons.some(season=>season.status==="ACTIVE")} className="border-b border-[var(--lms-canvas-border)]">
      <PlacementSeasonManager
        collegeId={collegeId}
        seasons={seasons.map((season) => ({
          id: season.id,
          name: season.name,
          code: season.code,
          startDate: season.startDate,
          endDate: season.endDate,
          status:
            season.status as
              | "ACTIVE"
              | "CLOSED",
        }))}
      />
      </Disclosure> : <Alert tone="warning">
        Placement season data could not be refreshed.{retry}
      </Alert>}
      {relationships && owners ? <Disclosure title="Companies" className="border-b border-[var(--lms-canvas-border)]">
      <PlacementEmployerRelationships
        relationships={relationships.map(
          (item) => ({
            relationshipId:
              item.relationshipId,
            companyId: item.companyId,
            name: item.name,
            websiteUrl: item.websiteUrl,
            primaryDomain:
              item.primaryDomain,
            isTrusted: item.isTrusted,
            ownerMembershipId:
              item.ownerMembershipId,
          }),
        )}
        owners={owners}
      />
      </Disclosure> : <Alert tone="warning">
        Company relationships could not be refreshed.{retry}
      </Alert>}
      {relationships && recruiterGrants ? <Disclosure title="Recruiter access" className="border-b border-[var(--lms-canvas-border)]">
      <PlacementRecruiterAccess
        relationships={relationships.map(
          (item) => ({
            relationshipId:
              item.relationshipId,
            name: item.name,
          }),
        )}
        grants={recruiterGrants.map(
          (grant) => ({
            grantId: grant.grantId,
            recruiterUserId:
              grant.recruiterUserId,
            companyRelationshipId:
              grant.companyRelationshipId,
            companyId: grant.companyId,
            companyName:
              grant.companyName,
            displayName:
              grant.displayName,
            email: grant.email,
            title: grant.title,
          }),
        )}
      />
      </Disclosure> : <Alert tone="warning">
        Recruiter access could not be refreshed.{retry}
      </Alert>}
      <Disclosure title="Student placement lookup" className="border-b border-[var(--lms-canvas-border)]">
        <p className="pb-3 text-sm text-body">
          Find a student&apos;s placement registration, applications and outcomes
          within the selected college.{" "}
          <Link href={basePath+"/student-lookup"}
            className="font-semibold text-link underline underline-offset-2">
            Open student placement lookup
          </Link>
        </p>
      </Disclosure>
    </div>
  );
}
