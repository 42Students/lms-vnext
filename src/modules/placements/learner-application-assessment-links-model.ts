import {isCareerRoundVisible} from "./learner-round-visibility-policy";
export type OwnApplicationAssessmentRound={
  applicationId:string;roundId:string;roundKind:string;
  scheduledAt:string|null;exception:{scheduledAt:string}|null;
};
export type OwnApplicationAssessmentLink={applicationId:string;href:string};
/** Operates only on membership-scoped persisted placement request rounds. */
export function ownApplicationAssessmentLinks(
  rounds:readonly OwnApplicationAssessmentRound[],snapshotNowIso:string,
):OwnApplicationAssessmentLink[]{
  const now=Date.parse(snapshotNowIso);
  const relevant=rounds.filter(row=>isCareerRoundVisible("ASSESSMENT",row.roundKind));
  const when=(row:OwnApplicationAssessmentRound)=>{
    const raw=row.exception?.scheduledAt??row.scheduledAt;
    const timestamp=raw?Date.parse(raw):Number.NaN;
    return Number.isFinite(timestamp)?timestamp:Number.POSITIVE_INFINITY;
  };
  const byApplication=new Map<string,OwnApplicationAssessmentRound[]>();
  for(const row of relevant)byApplication.set(row.applicationId,
    [...(byApplication.get(row.applicationId)??[]),row]);
  return [...byApplication].map(([applicationId,own])=>{
    const chosen=[...own].sort((a,b)=>{
      const aa=when(a),bb=when(b);
      const overdueA=Number.isFinite(now)&&aa<now?1:0;
      const overdueB=Number.isFinite(now)&&bb<now?1:0;
      return overdueA-overdueB||aa-bb||a.roundId.localeCompare(b.roundId);
    })[0]!;
    return {applicationId,
      href:"/learn/my-placements/assessments?applicationId="+encodeURIComponent(applicationId)+
        "&roundId="+encodeURIComponent(chosen.roundId)};
  });
}
