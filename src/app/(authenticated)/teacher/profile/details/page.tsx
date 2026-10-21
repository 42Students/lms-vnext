import Link from "next/link";
import { notFound } from "next/navigation";
import { Banner } from "@/components/ui/banner";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

import { FacultyProfileEditor } from "@/components/people/faculty-profile-editor";
import { facultyProfileDocumentStorageReady } from "@/modules/people/faculty-profile-readiness";
import { loadOwnFacultyProfileDocumentStaged } from "@/modules/people/faculty-profile-self.staged";
export const dynamic="force-dynamic";
export default async function FacultyProfileDetailsPage(){
 const context=await getCurrentRequestContext();
 // Active Faculty membership, not an unrelated Mentor/admin role, owns this
 // self-service document. Staff review/edit uses the separate admin route.
 if(context.user.platformStatus!=="ACTIVE" ||
    context.membership?.status!=="ACTIVE" ||
    !context.membership.roles.includes("FACULTY"))notFound();
 const ready=await facultyProfileDocumentStorageReady();
 const result=ready
  ?await loadOwnFacultyProfileDocumentStaged(context)
    .then(profile=>({profile,failed:false as const}))
    .catch(()=>({profile:null,failed:true as const}))
  :{profile:null,failed:false as const};
 const profile=result.profile;
 return <div className="min-w-0 max-w-full space-y-5">
  <Breadcrumbs items={[{label:"Profile",href:"/teacher/profile"},{label:"About & details"}]}/>
  <PageHeader title="About & details"
   description="Your self-managed profile sections, separate from college-managed employment information."
   actions={<Link href="/teacher/profile" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">← Profile</Link>} />
  {!ready?<section role="status" className="min-w-0 border-y border-[var(--lms-canvas-border)] py-5">
   <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Profile editing unavailable</h2>
   <p className="mt-2 max-w-prose text-sm leading-[22px] text-body">Private Faculty profile storage awaits an approved database migration. No edits will be sent or saved until it is ready.</p>
  </section>:result.failed||!profile?<Banner tone="error" role="alert">
   We couldn't load your profile. Please try again.
   <Link href="/teacher/profile/details" className="ml-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline">
    Retry
   </Link>
  </Banner>:<div className="min-w-0"><FacultyProfileEditor initialDocument={profile.document} initialVersion={profile.version}/></div>}
 </div>;
}
