"use client";

import {useState} from "react";
import AcademicsSectionError from "@/app/(authenticated)/admin/academics/sections/[sectionId]/error";
import AuditError from "@/app/(authenticated)/admin/audit/error";
import {Heading} from "@/components/ui/heading";

const fixtureError = new Error("Synthetic UX recovery fixture error");

export function AdminTenRecoveryFixture(){
 const [sectionRetries,setSectionRetries]=useState(0);
 const [auditRetries,setAuditRetries]=useState(0);
 return <main className="mx-auto w-full max-w-[70rem] min-w-0 space-y-6 px-4 py-6 md:px-8">
   <Heading level={1} className="text-2xl font-bold">Super Admin recovery acceptance</Heading>
   <section aria-label="Academic section recovery" className="min-w-0 space-y-2 rounded-xl border border-border p-4">
    <AcademicsSectionError error={fixtureError} reset={()=>setSectionRetries(n=>n+1)} />
    <p data-testid="section-retries" role="status">Academic retries: {sectionRetries}</p>
   </section>
   <section aria-label="Audit log recovery" className="min-w-0 space-y-2 rounded-xl border border-border p-4">
    <AuditError error={fixtureError} reset={()=>setAuditRetries(n=>n+1)} />
    <p data-testid="audit-retries" role="status">Audit retries: {auditRetries}</p>
   </section>
  </main>;
}
