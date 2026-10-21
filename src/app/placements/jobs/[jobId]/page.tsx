import Link from "next/link";
import type {Metadata} from "next";
import {PageHeader} from "@/components/ui/page-header";

export const metadata:Metadata={
 title:"Shared placement job link · 42Students",
 robots:{index:false,follow:false},
};

/** Legacy PublicJobResponseDTO was only a declared response type; the old
 * repository has no live consumer for it. We do not treat its slug/id as a
 * public authorization or expose targeted college job and employer details.
 * Private jobs remain readable only in the member's selected college.
 */
export default function RetiredPublicPlacementJobPage(){
 return <main className="mx-auto my-6 w-full max-w-2xl rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 sm:p-6">
  <div className="space-y-4">
   <PageHeader title="This shared job link is no longer public"
    description="Placement job details are available in your college workspace."/>
   <p className="text-sm leading-6 text-body">
    To protect private recruiting arrangements and student eligibility, individual
    placement drive details are not published on public links. Historical links
    do not grant access to a job or an application.
   </p>
   <div className="flex flex-wrap gap-3">
    <Link href="/login?next=%2Flearn%2Fmy-placements%2Fjobs"
     className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-[var(--lms-on-primary)]">
     Sign in to browse college drives
    </Link>
    <Link href="/placements"
     className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
     Public placement information
    </Link>
   </div>
  </div>
 </main>;
}
