import Link from "next/link";
import {AuthorizationError} from "@/modules/permissions/policy";
import {ErrorState} from "@/components/ui/error-state";
import { getCurrentRequestContext } from "@/auth/request-context";
import { notFound, redirect } from "next/navigation";
import {FacultyProfileRefresh} from "@/components/people/faculty-profile-refresh";
import { FacultyProfileEditor } from "@/components/people/faculty-profile-editor";
import {FacultyAvatarUpload} from "@/components/people/faculty-avatar-upload";
import { facultyProfileDocumentStorageReady } from "@/modules/people/faculty-profile-readiness";
import { loadOwnFacultyProfileDocumentStaged } from "@/modules/people/faculty-profile-self.staged";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnFacultyProfileWithRuntime } from "@/modules/people/runtime";

export const dynamic = "force-dynamic";

export default async function FacultyProfilePage({searchParams}:{searchParams:Promise<{section?:string|string[]}>}) {
  const context = await getCurrentRequestContext();
  // A different active workspace (including Mentor) is not a faculty profile.
  if (context.membership?.status !== "ACTIVE") notFound();
  if (!context.membership.roles.includes("FACULTY")) {
    if(context.membership.roles.includes("LEARNER"))redirect("/learn/profile");
    if(context.membership.roles.includes("COLLEGE_ADMIN"))redirect("/college/profile");
    notFound();
  }
  const params=await searchParams;
  const section=Array.isArray(params.section)?params.section[0]:params.section;
  if(section==="connect-accounts")redirect("/teacher/profile#faculty-socialProfiles");
  if(section&&section!=="about"&&section!=="contacts")redirect("/teacher/profile#faculty-about");
  if(section==="contacts")redirect("/teacher/profile#faculty-contact");
  // Refresh errors must not be misreported as an empty profile, nor should a
  // stale academic/identity record be submitted for editing. The client-side
  // Refresh control retains the previous verified RSC tree until a new response.
  const profileRead=await getOwnFacultyProfileWithRuntime(context)
    .then(value=>({ok:true as const,value}))
    .catch(error=>({ok:false as const,error}));
  if(!profileRead.ok){
    if(profileRead.error instanceof AuthorizationError)throw profileRead.error;
    return <div className="min-w-0 max-w-full space-y-4">
      <PageHeader title="Profile"/>
      <ErrorState title="Couldn't refresh profile"
        description="We couldn't load your profile. Please try again. Previously saved details have not been changed."
        action={<FacultyProfileRefresh />}/>
    </div>;
  }
  const {person,profile}=profileRead.value;
  // One optional private-document source must not blank a healthy Faculty
  // identity/teaching profile. Keep self-editing disabled until a verified
  // document snapshot is available; don't pretend an outage is an empty doc.
  const readiness = await facultyProfileDocumentStorageReady()
    .then(ready => ({ok:true as const,ready}))
    .catch(() => ({ok:false as const,ready:false}));
  const documentReady = readiness.ready;
  const documentRead = documentReady
    ? await loadOwnFacultyProfileDocumentStaged(context)
        .then(value => ({ok:true as const,value}))
        .catch(error => {
          if(error instanceof AuthorizationError)throw error;
          return {ok:false as const,value:null};
        })
    : {ok:false as const,value:null};
  const selfDocument = documentRead.value;
  const privateDocumentFailed = !readiness.ok || (documentReady && !documentRead.ok);
  const displayName = person.user.displayName?.trim() || person.user.email?.split("@")[0] || "Faculty";
  const initials = displayName.split(/\s+/)
    .slice(0, 2).map(part => part.slice(0, 1).toUpperCase()).join("");
  const document=selfDocument?.document??null;
  const birthday=document?.personalDetails.dateOfBirth??"";
  const dob=/^\d{4}-\d{2}-\d{2}$/.test(birthday)?birthday.split("-").reverse().join("-"):"Not specified";
  const completeness=[
   Boolean(person.user.displayName?.trim()),Boolean(profile?.academicTitle),Boolean(profile?.employmentType),
   Boolean(document?.about.description),Boolean(document?.personalDetails.gender),
   Boolean(document?.personalDetails.dateOfBirth),Boolean(document?.contact.contactMail),
   Boolean(document?.contact.contactMobile),Boolean(document?.education.length),
   Boolean(document?.experiences.length),
  ];
  const completenessScore=document?Math.round(completeness.filter(Boolean).length/completeness.length*100):null;
  const fields: Array<{ label: string; value: string | null }> = [
    { label: "Name", value: person.user.displayName },
    { label: "Email", value: person.user.email },
    { label: "Mobile Number", value: document?.contact.contactMobile || person.user.phoneE164 },
    { label: "Alternate Phone", value: document?.contact.contactPhone ?? null },
    { label: "Date of birth", value: dob },
    { label: "Gender", value: document?.personalDetails.gender ?? null },
    { label: "Description", value: document?.about.description ?? null },
    { label: "Academic title", value: profile?.academicTitle ?? null },
    { label: "Employment type", value: profile?.employmentType ?? null },
  ];

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader title="Profile" actions={<div className="flex flex-wrap items-center gap-3">
        <FacultyProfileRefresh/>
        <Link href="#faculty-profile-sections" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-[var(--lms-on-primary)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px]">Edit About &amp; profile sections →</Link>
      </div>} />
      <section id="faculty-header" aria-label="Faculty profile identity" aria-busy={false} className="flex min-w-0 flex-wrap items-center gap-5 border-b border-[var(--lms-canvas-border)] pb-5">
        <FacultyAvatarUpload initialVersion={selfDocument?.version??0} initials={initials || "F"}/>
        <div className="min-w-0 space-y-1">
          <h2 className="break-words text-xl font-semibold text-[var(--lms-heading)]">{person.user.displayName}</h2>
          <p className="break-all text-sm text-body">{person.user.email || "No email recorded"}</p>
          <p className="text-sm text-muted-foreground">{profile?.academicTitle || "Faculty"} · {profile?.employmentType || "Faculty type not specified"} · College-managed identity</p>
          {document?.about.description?<p className="max-w-2xl whitespace-pre-wrap text-sm text-body">{document.about.description}</p>:null}
          <Link href="/teacher/profile/contacts" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">Update contacts</Link>
        </div>
      </section>
      <section aria-label="Profile completeness" className="space-y-2 border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-[var(--lms-heading)]">Profile completeness</h2>
          <span className="text-sm font-semibold tabular-nums">{completenessScore===null?"Not available":completenessScore+"%"}</span>
        </div>
        <progress aria-label="Profile completeness" max={100} value={completenessScore??0} className="h-2 w-full accent-[var(--lms-primary)]"/>
        <Link href="#faculty-profile-sections" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">Complete your profile</Link>
      </section>
      <nav aria-label="Profile shortcuts" className="flex min-w-0 flex-col items-stretch gap-1 border-b border-[var(--lms-canvas-border)] pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <Link href="/teacher/profile/teaching"
        className="inline-flex min-h-11 min-w-0 items-center justify-center px-2 text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:justify-start md:min-h-9">
        Current teaching assignments →
        </Link>
        <Link href="/teacher/profile/contacts"
        className="inline-flex min-h-11 min-w-0 items-center justify-center px-2 text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:justify-start md:min-h-9">
        Contact details and editing availability
        </Link>
      </nav>
      <section id="contacts" aria-label="Faculty profile details" className="min-w-0 space-y-3 scroll-mt-24 py-4">
        <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">About</h2>
        <dl className="grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 break-all text-sm leading-6 text-foreground">
                {value || "Not specified"}
              </dd>
            </div>
          ))}
        </dl>
        <p className="max-w-prose text-xs leading-5 text-muted-foreground">
          Identity and college-managed employment records are maintained by your college administrator.
        </p>
      </section>
      <section id="faculty-profile-sections" aria-label="Full faculty profile" className="min-w-0 space-y-4 scroll-mt-24 border-t border-[var(--lms-canvas-border)] pt-5">
        <h2 id="social-profiles" className="sr-only">Social Profiles</h2>
        <h2 className="text-[18px] font-semibold text-[var(--lms-heading)]">Profile sections</h2>
        <p className="text-sm text-muted-foreground">About · Personal Details · Contacts · Education/Qualification · Experiences · Certifications · Publications · Awards · Social Profiles</p>
        {!documentReady || !selfDocument ? (
          <div role="status" className="border-y border-[var(--lms-canvas-border)] py-5">
            <p className="font-semibold text-foreground">{privateDocumentFailed?
              "Profile sections temporarily unavailable":"Profile editing unavailable"}</p>
            <p className="mt-2 max-w-prose text-sm text-body">
              {privateDocumentFailed?
               "The private profile sections could not be verified. Your identity and current teaching information remain visible. Retry to load your last saved details.":
               "Private Faculty profile storage awaits an approved database migration. No edits will be sent or saved until it is ready."}
            </p>
            {privateDocumentFailed?<FacultyProfileRefresh />:null}
          </div>
        ) : (
          <FacultyProfileEditor initialDocument={selfDocument.document}
            initialVersion={selfDocument.version} />
        )}
      </section>
    </div>
  );
}
