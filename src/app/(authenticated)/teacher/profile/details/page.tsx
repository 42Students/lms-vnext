import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { FacultyProfileEditor } from "@/components/people/faculty-profile-editor";
import { facultyProfileDocumentStorageReady } from "@/modules/people/faculty-profile-readiness";
import { loadOwnFacultyProfileDocumentStaged } from "@/modules/people/faculty-profile-self.staged";
export const dynamic="force-dynamic";
export default async function FacultyProfileDetailsPage(){
 const context=await getCurrentRequestContext();
 if(!context.membership?.roles.includes("FACULTY"))notFound();
 const ready=await facultyProfileDocumentStorageReady();
 const profile=ready?await loadOwnFacultyProfileDocumentStaged(context):null;
 return <div className="min-w-0 space-y-6">
  <Breadcrumbs items={[{label:"Profile",href:"/teacher/profile"},{label:"About & details"}]}/>
  <PageHeader eyebrow="Faculty · Profile" title="About & details"
   description="Your self-managed profile sections, separate from college-managed employment information."/>
  <Link href="/teacher/profile" className="inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text">← Profile</Link>
  {!ready||!profile?<Card role="status">
   <h2 className="font-semibold text-foreground">Profile editing unavailable</h2>
   <p className="mt-2 text-sm text-body">Private Faculty profile storage awaits an approved database migration. No edits will be sent or saved until it is ready.</p>
  </Card>:<div className="min-w-0 max-w-5xl"><FacultyProfileEditor initialDocument={profile.document} initialVersion={profile.version}/></div>}
 </div>;
}
