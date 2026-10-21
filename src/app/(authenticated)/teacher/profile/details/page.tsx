import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Banner } from "@/components/ui/banner";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

import { FacultyProfileEditor } from "@/components/people/faculty-profile-editor";
import { facultyProfileDocumentStorageReady } from "@/modules/people/faculty-profile-readiness";
import { loadOwnFacultyProfileDocumentStaged } from "@/modules/people/faculty-profile-self.staged";
export const dynamic="force-dynamic";
export default async function FacultyProfileDetailsPage({searchParams}:{
 searchParams:Promise<{section?:string|string[]}>
}){
 const raw=await searchParams;
 const section=Array.isArray(raw.section)?raw.section[0]:raw.section;
 // The old faculty About URL used ?section=connect-accounts or ?section=contacts.
 // The one-page vNext profile owns these live anchors; do not lose bookmarks.
 if(section==="connect-accounts"||section==="social-profiles")
   redirect("/teacher/profile#social-profiles");
 if(section==="contacts")redirect("/teacher/profile#faculty-contact");
 if(section&&section!=="about")redirect("/teacher/profile#contacts");
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
  </Banner>:<div className="min-w-0 space-y-5">
    {profile.version===0 ? <Banner tone="info">
      No record selected. Your profile sections are empty; choose Edit or Add below to create the first saved record.
    </Banner>:null}
    <section aria-label="Saved faculty profile" className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-4">
      <h2 className="mb-3 text-lg font-semibold text-[var(--lms-heading)]">Your saved profile</h2>
      <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div><dt className="text-xs font-semibold text-muted-foreground">About</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-body">
            {profile.document.about.description||"Not specified"}</dd></div>
        <div><dt className="text-xs font-semibold text-muted-foreground">Personal details</dt>
          <dd className="mt-1 text-sm text-body">
            {profile.document.personalDetails.gender||"Not specified"}
          </dd></div>
        <div><dt className="text-xs font-semibold text-muted-foreground">Contact email (self-reported)</dt>
          <dd className="mt-1 break-all text-sm text-body">
            {profile.document.contact.contactMail||"Not specified"}</dd></div>
        <div><dt className="text-xs font-semibold text-muted-foreground">Education / Qualification</dt>
          <dd className="mt-1 text-sm text-body">{profile.document.education.length} saved record(s)</dd></div>
        <div><dt className="text-xs font-semibold text-muted-foreground">Experience</dt>
          <dd className="mt-1 text-sm text-body">{profile.document.experiences.length} saved record(s)</dd></div>
        <div><dt className="text-xs font-semibold text-muted-foreground">Social Profiles</dt>
          <dd className="mt-1 text-sm text-body">
            {profile.document.socialProfiles.linkedIn?"LinkedIn on file":"No LinkedIn profile provided"}
          </dd></div>
      </dl>
    </section>
    <details className="group min-w-0 border-y border-[var(--lms-canvas-border)] py-4"
      open={section==="about"||undefined}>
      <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--lms-control-radius)] px-3 text-sm font-semibold text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
        Edit / Add profile sections <span aria-hidden="true">⌄</span>
      </summary>
      <p className="mt-2 text-xs text-muted-foreground">You can edit About, personal details,
        contacts, education, experience and research records independently. College-managed identity,
        employment, login email and login phone are read-only.</p>
      <div className="mt-4"><FacultyProfileEditor initialDocument={profile.document}
        initialVersion={profile.version}/></div>
    </details>
    <p className="text-xs text-muted-foreground">Profile saves show a section-specific status and
      an error with a reload option when the saved version changes.
      You can also manage these sections on the <Link href="/teacher/profile"
        className="font-semibold text-link underline">Profile overview</Link>.</p>
  </div>}
 </div>;
}
