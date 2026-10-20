"use client";

import { TpoGrid } from "@/components/tpo/grid/tpo-grid";
import type { TpoGridColumn } from "@/modules/placements/tpo-grid-model";

/** One authorized page of pre-issue selection history; no applicant data is fetched here. */
export type HrSelectionSheetRow = {
  id: string;
  candidate: string;
  role: string;
  ctcLpa: string;
  ctcSort: number | null;
  status: string;
};

const columns: readonly TpoGridColumn<HrSelectionSheetRow>[] = [
  { key:"candidate", label:"Candidate", read:row=>row.candidate },
  { key:"role", label:"Role", read:row=>row.role },
  { key:"ctc", label:"CTC (LPA)", read:row=>row.ctcLpa,
    sortKind:"number", sortValue:row=>row.ctcSort },
  { key:"status", label:"Status", read:row=>row.status },
];

/** Reuse the sheet chrome only; verification and releasing selections remain college-only. */
export function HrJobSelectionGrid({rows,scopeKey}:{
  rows: readonly HrSelectionSheetRow[];
  scopeKey: string;
}) {
  return <TpoGrid rows={rows} columns={columns} rowKey={row=>row.id}
    mobilePrimaryKeys={["candidate","role","ctc","status"]}
    storageKey={"hr-selection:"+scopeKey}/>;
}
