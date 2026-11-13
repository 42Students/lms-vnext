import { notFound } from "next/navigation";
import { serializeTpoCohortHistoryCsv } from "@/modules/placements/tpo-batch-history-csv-model";
import { serializeTpoBatchStudentViewCsv } from "@/modules/placements/tpo-batch-student-filtered-export-model";
import { companyDriveCsv } from "@/modules/placements/tpo-company-drive-export-model";
import { companyEngagementCsv } from "@/modules/placements/tpo-company-engagement-csv-model";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";

import { env } from "@/config/env";
export const dynamic = "force-dynamic";
/** Development-only synthetic serializer fixture. Real endpoints and tenant data are untouched. */
export default function TpoBatchCompanyCsvProof() {
 if(process.env.NODE_ENV !== "development" || env.UX_G180_FIXTURE !== "1")notFound();
 const poison = "\u093E=FORMULA(1)";
 const samples = [
  {title:"Cohort decision history",name:"cohort-history.csv",csv:serializeTpoCohortHistoryCsv([{
    id:"action-1",kind:"DECISION",before:null,after:poison,actionId:"a1",
    reversesActionId:null,occurredAt:new Date("2026-11-08T00:00:00Z"),
  }])},
  {title:"Batch student view",name:"batch-students.csv",csv:serializeTpoBatchStudentViewCsv([{
    membershipId:"id-1",name:poison,decision:"ELIGIBLE",ambiguous:false,
    source:"COHORT",registration:{choice:null},
  }])},
  {title:"Company drive history",name:"company-drives.csv",csv:companyDriveCsv([{
    jobTitle:poison,status:"LIVE",createdAt:"bad-date",applied:null,offers:null,
  }])},
  {title:"Company engagement",name:"engagement.csv",csv:companyEngagementCsv([{
    companyName:poison,contacts:2,invited:1,joined:1,drives:1,placed:0,
  }])},
 ];
 return <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
  <Heading level={1} className="text-2xl font-semibold">Placement CSV quality check</Heading>
  <p className="text-sm text-body">Development-only sample files. No actual learner or company data.</p>
  <div className="grid min-w-0 gap-3 sm:grid-cols-2">{samples.map(sample=>
   <section key={sample.name} className="min-w-0 space-y-3 rounded-xl border border-border p-4">
    <Heading level={2} className="break-words text-base font-semibold">{sample.title}</Heading>
    <p className="break-all text-xs text-muted-foreground">{sample.name}</p>
    <ButtonLink variant="secondary" className="focus-ring flex min-h-11 w-full items-center justify-center rounded-lg border border-border p-3 text-center text-sm font-semibold"
      download={sample.name} href={"data:text/csv;charset=utf-8,"+encodeURIComponent(sample.csv)}>
      Download example CSV
    </ButtonLink>
   </section>)}</div>
 </main>;
}
