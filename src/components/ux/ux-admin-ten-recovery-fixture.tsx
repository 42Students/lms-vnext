"use client";

import {useState} from "react";
import AcademicsSectionError from "@/app/(authenticated)/admin/academics/sections/[sectionId]/error";
import AuditError from "@/app/(authenticated)/admin/audit/error";
import BatchPromotionError from "@/app/(authenticated)/admin/batch-promotion/error";
import AdminHistoryError from "@/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/error";
import CollegeSigninError from "@/app/(authenticated)/admin/colleges/[collegeId]/signin/error";
import CourseProgressError from "@/app/(authenticated)/admin/course-progress/error";
import {Heading} from "@/components/ui/heading";

/** Render the production route error components, not a visual copy, on two real viewports.
 * No personal tenant data is needed to exercise route reset and escape controls.
 */
const fixtureError = new Error("Synthetic UX recovery fixture error");

export function AdminTenRecoveryFixture(){
 const [sectionRetries,setSectionRetries]=useState(0);
 const [auditRetries,setAuditRetries]=useState(0);
 const [promotionRetries,setPromotionRetries]=useState(0);
 const [historyRetries,setHistoryRetries]=useState(0);
 const [signinRetries,setSigninRetries]=useState(0);
 const [progressRetries,setProgressRetries]=useState(0);
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
   <section aria-label="Batch promotion recovery" className="min-w-0 space-y-2 rounded-xl border border-border p-4">
    <BatchPromotionError error={fixtureError} reset={()=>setPromotionRetries(n=>n+1)} />
    <p data-testid="promotion-retries" role="status">Promotion retries: {promotionRetries}</p>
   </section>
   <section aria-label="Administrator history recovery" className="min-w-0 space-y-2 rounded-xl border border-border p-4">
    <AdminHistoryError error={fixtureError} reset={()=>setHistoryRetries(n=>n+1)} />
    <p data-testid="history-retries" role="status">History retries: {historyRetries}</p>
   </section>
   <section aria-label="College sign-in recovery" className="min-w-0 space-y-2 rounded-xl border border-border p-4">
    <CollegeSigninError error={fixtureError} reset={()=>setSigninRetries(n=>n+1)} />
    <p data-testid="signin-retries" role="status">Sign-in retries: {signinRetries}</p>
   </section>
   <section aria-label="Course progress recovery" className="min-w-0 space-y-2 rounded-xl border border-border p-4">
    <CourseProgressError error={fixtureError} reset={()=>setProgressRetries(n=>n+1)} />
    <p data-testid="progress-retries" role="status">Progress retries: {progressRetries}</p>
   </section>
  </main>;
}
