import { notFound, redirect } from "next/navigation";
import { Banner } from "@/components/ui/banner";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

import { FacultyProfileEditor } from "@/components/people/faculty-profile-editor";
import { facultyProfileDocumentStorageReady } from "@/modules/people/faculty-profile-readiness";
import { loadOwnFacultyProfileDocumentStaged } from "@/modules/people/faculty-profile-self.staged";
import { Heading } from "@/components/ui/heading";
import { Disclosure } from "@/components/ui/disclosure";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";
import { ROLE } from "@/modules/identity/roles";
export const dynamic="force-dynamic";
export default async function FacultyProfileDetailsPage({searchParams}:{
 searchParams:Promise<{section?:string|string[]}>
}){
 const context=await getCurrentRequestContext();
 // Active Faculty membership, not an unrelated Mentor/admin role, owns this
 // self-service document. Staff review/edit uses the separate admin route.
 if(context.user.platformStatus!=="ACTIVE" ||
    context.membership?.status!=="ACTIVE" ||
    !context.membership.roles.includes(ROLE.FACULTY))notFound();
 const raw=await searchParams;
 // Multiple or ambiguous section selectors must never choose an arbitrary entry.
 if(Array.isArray(raw.section))redirect("/teacher/profile");
 const section=raw.section;
 // The old faculty About URL used ?section=connect-accounts or ?section=contacts.
 // The one-page vNext profile owns these live anchors; do not lose bookmarks.
 if(section==="connect-accounts"||section==="social-profiles")
   redirect("/teacher/profile#social-profiles");
 if(section==="contacts")redirect("/teacher/profile#faculty-contact");
 if(section&&section!=="about")redirect("/teacher/profile#contacts");
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
   actions={<ButtonLink variant="secondary" href="/teacher/profile" className="w-full sm:w-auto">← Profile</ButtonLink>} />
  {!ready?<section role="status" className="min-w-0 border-y border-[var(--lms-canvas-border)] py-5">
   <Heading level={2} size="lg" className="leading-[1.4] text-[var(--lms-heading)]">Profile editing unavailable</Heading>
   <p className="mt-2 max-w-prose text-sm leading-[22px] text-body">Private Faculty profile storage awaits an approved database migration. No edits will be sent or saved until it is ready.</p>
  </section>:result.failed||!profile?<Banner tone="error" role="alert">
   We couldn't load your profile. Please try again.
   <TextLink href="/teacher/profile/details" className="ml-2 inline-flex min-h-9 items-center">
    Retry
   </TextLink>
  </Banner>:<div className="min-w-0 space-y-5">
    {profile.version===0 ? <Banner tone="info">
      No record selected. Your profile sections are empty; choose Edit or Add below to create the first saved record.
    </Banner>:null}
    <section aria-label="Saved faculty profile" className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-4">
      <Heading level={2} size="lg" className="mb-3 text-[var(--lms-heading)]">Your saved profile</Heading>
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
    <Disclosure title={<>
        Edit / Add profile sections <span aria-hidden="true">⌄</span>
      </>} defaultOpen={section==="about"||undefined} className="min-w-0" preserveSummary summaryClassName="inline-flex min-h-11 items-center gap-2">
      <p className="mt-2 text-xs text-muted-foreground">You can edit About, personal details,
        contacts, education, experience and research records independently. College-managed identity,
        employment, login email and login phone are read-only.</p>
      <div className="mt-4"><FacultyProfileEditor initialDocument={profile.document}
        initialVersion={profile.version}/></div>
    </Disclosure>
    <p className="text-xs text-muted-foreground">Profile saves show a section-specific status and
      an error with a reload option when the saved version changes.
      You can also manage these sections on the <TextLink href="/teacher/profile">Profile overview</TextLink>.</p>
  </div>}
 </div>;
}
