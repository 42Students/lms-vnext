"use client";

import { TpoGrid } from "@/components/tpo/grid/tpo-grid";
import type { TpoGridColumn } from "@/modules/placements/tpo-grid-model";

/** All rows originate from the authorized employer/college/round read on the server. */
export type HrRoundResultSheetRow = {
  key: string;
  name: string;
  outcome: string | null;
  status: string | null;
  scorePercent: number | null;
  waitlistRank: number | null;
};

const columns: readonly TpoGridColumn<HrRoundResultSheetRow>[] = [
  { key:"candidate", label:"Candidate", read:row=>row.name },
  { key:"outcome", label:"Outcome", read:row=>row.outcome??"NOT RECORDED" },
  { key:"status", label:"Result status", read:row=>row.outcome?row.status:null },
  { key:"score", label:"Score", read:row=>row.scorePercent===null?null:row.scorePercent+"%",
    sortKind:"number", sortValue:row=>row.scorePercent },
  { key:"waitlist", label:"Waitlist rank", read:row=>row.waitlistRank,
    sortKind:"number", sortValue:row=>row.waitlistRank },
];

export function HrRoundResultsGrid({rows,scopeKey}:{
  rows:readonly HrRoundResultSheetRow[];
  /** Employer, college, drive and round identifiers must all be part of the storage scope. */
  scopeKey:string;
}) {
  return <TpoGrid rows={rows} rowKey={row=>row.key} columns={columns}
    mobilePrimaryKeys={["candidate","outcome","status"]}
    storageKey={"hr-results:"+scopeKey}/>;
}
