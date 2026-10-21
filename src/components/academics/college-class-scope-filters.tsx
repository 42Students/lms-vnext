"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";

type Cohort = { id: string; code: string; name: string; programId: string };
type Program = { id: string; code: string; name: string };

/** Legacy Classes: compact, coupled Program and Batch filters, with page reset. */
export function CollegeClassScopeFilters({ programs, cohorts, selectedProgram = "", selectedBatch = "" }: {
  programs: Program[]; cohorts: Cohort[]; selectedProgram?: string; selectedBatch?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [program, setProgram] = useState(selectedProgram);
  const [batch, setBatch] = useState(selectedBatch);
  const eligible = cohorts.filter(cohort => !program || cohort.programId === program);
  function navigate(nextProgram: string, nextBatch: string) {
    const params = new URLSearchParams(window.location.search);
    if (nextProgram) params.set("programId", nextProgram);
    else params.delete("programId");
    if (nextBatch) params.set("cohortCode", nextBatch);
    else params.delete("cohortCode");
    params.delete("page");
    startTransition(() => router.replace("/college/classes" + (params.size ? "?" + params.toString() : ""), { scroll: false }));
  }
  return <>
    <label className="grid min-w-[165px] gap-1 text-[13px] font-semibold text-muted-foreground">
      Program
      <Select name="programId" value={program} disabled={pending} className="min-h-9 w-[165px]"
        onChange={event => { setProgram(event.target.value); setBatch(""); navigate(event.target.value, ""); }}>
        <option value="">All programs</option>
        {programs.map(item => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
      </Select>
    </label>
    <label className="grid min-w-[165px] gap-1 text-[13px] font-semibold text-muted-foreground">
      Batch
      <Select name="cohortCode" value={batch} disabled={pending || !program || !eligible.length}
        className="min-h-9 w-[165px]"
        onChange={event => { setBatch(event.target.value); navigate(program, event.target.value); }}>
        <option value="">{!program ? "Select a program first" : "All batches"}</option>
        {eligible.map(item => <option key={item.id} value={item.code}>{item.name} ({item.code})</option>)}
      </Select>
    </label>
    <span className="sr-only" role="status" aria-live="polite">{pending ? "Updating class filters" : ""}</span>
  </>;
}
