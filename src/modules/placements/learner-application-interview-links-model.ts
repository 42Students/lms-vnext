import {isCareerRoundVisible} from "./learner-round-visibility-policy";
export type OwnApplicationInterviewRound={
  applicationId:string;roundId:string;roundKind:string;
  scheduledAt:string|null;exception:{scheduledAt:string}|null;
};
export type OwnApplicationInterviewLink={applicationId:string;href:string};
/** Input must already be membership-scoped by placement request service. */
export function ownApplicationInterviewLinks(
  rounds:readonly OwnApplicationInterviewRound[],snapshotNowIso:string,
):OwnApplicationInterviewLink[]{
  const now=Date.parse(snapshotNowIso);
  const eligible=rounds.filter(row=>isCareerRoundVisible("INTERVIEW",row.roundKind));
  const when=(row:OwnApplicationInterviewRound)=>{
    const raw=row.exception?.scheduledAt??row.scheduledAt;
    const time=raw?Date.parse(raw):Number.NaN;
    return Number.isFinite(time)?time:Number.POSITIVE_INFINITY;
  };
  const byApp=new Map<string,OwnApplicationInterviewRound[]>();
  for(const row of eligible){
    const prev=byApp.get(row.applicationId)??[];
    prev.push(row);
    byApp.set(row.applicationId,prev);
  }
  return [...byApp.entries()].map(([applicationId,rows])=>{
    const ordered=[...rows].sort((a,b)=>{
      const ta=when(a),tb=when(b);
      const pa=Number.isFinite(now)&&ta<now?1:0;
      const pb=Number.isFinite(now)&&tb<now?1:0;
      return pa-pb||ta-tb||a.roundId.localeCompare(b.roundId);
    });
    const chosen=ordered[0]!;
    return {applicationId,
      href:"/learn/my-placements/interviews?applicationId="+encodeURIComponent(applicationId)+
        "&roundId="+encodeURIComponent(chosen.roundId)};
  });
}
