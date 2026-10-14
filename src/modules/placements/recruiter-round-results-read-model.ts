import { z } from "zod";
export const recruiterResultTableQuerySchema = z.object({
  jobId: z.string().uuid().optional(),
  roundId: z.string().uuid().optional(),
  outcome: z.enum(["ALL","RECORDED","UNRECORDED","PASS","FAIL","HOLD","ABSENT"]).default("ALL"),
}).strict();

export type RecruiterResultRound = {
  id:string; name:string; sequence:number; kind:string; status:string;
  participants: readonly {
    applicationId:string; displayName:string|null;
    result:{status:string;outcome:string;scorePercent:number|null;waitlistRank:number|null} | null;
  }[];
};
export function projectRecruiterRoundResults(
  rounds: readonly RecruiterResultRound[], selectedRoundId: string,
  outcome:"ALL"|"RECORDED"|"UNRECORDED"|"PASS"|"FAIL"|"HOLD"|"ABSENT",
) {
  const round = rounds.find(item=>item.id === selectedRoundId);
  if (!round) return null;
  const rows=round.participants.map(person=>({
    key:person.applicationId,
    name:person.displayName?.trim() || "Candidate",
    outcome:person.result?.outcome ?? null,
    status:person.result?.status ?? "UNRECORDED",
    scorePercent:person.result?.scorePercent ?? null,
    waitlistRank:person.result?.waitlistRank ?? null,
  }));
  const counts={
    all: rows.length,
    recorded:rows.filter(row=>row.outcome!==null).length,
    unrecorded:rows.filter(row=>row.outcome===null).length,
    pass:rows.filter(row=>row.outcome==="PASS").length,
    fail:rows.filter(row=>row.outcome==="FAIL").length,
    hold:rows.filter(row=>row.outcome==="HOLD").length,
    absent:rows.filter(row=>row.outcome==="ABSENT").length,
  };
  const filtered=rows.filter(row=>outcome==="ALL" ||
    (outcome==="RECORDED"&&row.outcome!==null) ||
    (outcome==="UNRECORDED"&&row.outcome===null) || row.outcome===outcome);
  return {round:{id:round.id,name:round.name,sequence:round.sequence,kind:round.kind,status:round.status},counts,rows:filtered};
}
export function recruiterResultTableHref(input:{jobId:string;roundId?:string;outcome?:string}) {
 const params=new URLSearchParams({jobId:input.jobId});
 if(input.roundId) params.set("roundId",input.roundId);
 if(input.outcome && input.outcome!=="ALL") params.set("outcome",input.outcome);
 return "/hr/round-results?"+params.toString();
}
