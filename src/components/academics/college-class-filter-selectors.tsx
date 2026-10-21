"use client";
import { useState } from "react";
import { Select } from "@/components/ui/select";

type Program = { id: string; name: string; code: string };
type Cohort = { id: string; name: string; code: string; programId: string };

export function CollegeClassFilterSelectors({ programs, cohorts, programId, cohortCode }: {
  programs: Program[]; cohorts: Cohort[]; programId: string; cohortCode: string;
}) {
  const [selectedProgram, setSelectedProgram] = useState(programId);
  return <>
    <label className="grid gap-2 text-[13px] font-semibold text-muted-foreground">Program
      <Select name="programId" value={selectedProgram} className="min-h-9 w-full md:max-w-[165px]"
        onChange={event => {
          const form = event.currentTarget.form;
          const batch = form?.elements.namedItem("cohortCode");
          if (batch instanceof HTMLSelectElement) batch.value = "";
          setSelectedProgram(event.target.value);
          form?.requestSubmit();
        }}>
        <option value="">All programs</option>
        {programs.map(program => <option key={program.id} value={program.id}>{program.name} ({program.code})</option>)}
      </Select>
    </label>
    <label className="grid gap-2 text-[13px] font-semibold text-muted-foreground">Batch
      <Select name="cohortCode" key={selectedProgram} defaultValue={cohortCode} className="min-h-9 w-full md:max-w-[165px]"
        onChange={event => event.currentTarget.form?.requestSubmit()}>
        <option value="">All batches</option>
        {cohorts.filter(cohort => !selectedProgram || cohort.programId === selectedProgram).map(cohort =>
          <option key={cohort.id} value={cohort.code}>{cohort.name} ({cohort.code})</option>)}
      </Select>
    </label>
  </>;
}
