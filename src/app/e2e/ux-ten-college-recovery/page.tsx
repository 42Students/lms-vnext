import { notFound } from "next/navigation";
import { UXTenCollegeRecoveryPreview } from "@/components/ux/ux-ten-college-recovery-preview";
import { UXTenCollegeAtomicRecoveryPreview } from "@/components/ux/ux-ten-college-atomic-recovery-preview";
import CollegeHallLoading from "@/app/(authenticated)/college/lecture-halls/[hallId]/loading";
import { env } from "@/config/env";
export const dynamic = "force-dynamic";
/** Synthetic-only fixture: never bypass auth or expose account records. */
export default function UXTenCollegeRecoveryFixture() {
  if(process.env.NODE_ENV!=="development"||env.UX_TEN_COLLEGE_FIXTURE!=="1")notFound();
  return <main className="mx-auto w-full max-w-4xl min-w-0 space-y-8 px-4 py-8">
    <h1 className="text-2xl font-semibold">College route recovery acceptance</h1>
    <section aria-label="Lecture hall loading recovery" className="min-w-0 space-y-3"><CollegeHallLoading/></section>
    <UXTenCollegeRecoveryPreview/>
    <UXTenCollegeAtomicRecoveryPreview/>
  </main>;
}
