"use client";
import { Button } from "@/components/ui/button";
import { useRef,useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { beginFacultyProfileSave } from "@/modules/people/faculty-profile-save-lock";
import {FACULTY_PROFILE_NAV,facultyProfileAnchor} from "@/modules/people/faculty-profile-navigation";
import {facultyProfileSaveFailure,facultyProfileUnconfirmedSaveMessage,facultyProfileErrorCode,facultyProfileSaveSectionLabel,facultyProfileReloadRequired,facultyProfileSavedStatus} from "@/modules/people/faculty-profile-error-model";
import {facultyProfileSaveReceipt,FacultyProfileSaveResponseError} from "@/modules/people/faculty-profile-save-response";
import type { FacultyProfileDocument } from "@/modules/people/faculty-profile-document";
import type { FacultySelfSection } from "@/modules/people/faculty-self-section-model";
import { advanceFacultySectionRevision } from "@/modules/people/faculty-section-revision-model";
import { FacultyProfileTextSection } from "./faculty-profile-text-section";
import { FacultyProfileSkills } from "./faculty-profile-skills";
import { FacultyProfileMetadata } from "./faculty-profile-metadata";
import { FacultyProfileRepeatable } from "./faculty-profile-repeatable";
import { newFacultyAward } from "@/modules/people/faculty-profile-row-factories";
import { newFacultyPublication } from "@/modules/people/faculty-profile-row-factories";
import { newFacultyExperience } from "@/modules/people/faculty-profile-row-factories";
import { newFacultyCertification } from "@/modules/people/faculty-profile-row-factories";
import { newFacultyEducation } from "@/modules/people/faculty-profile-row-factories";
import { newFacultyLanguage } from "@/modules/people/faculty-profile-row-factories";
const ABOUT_FIELDS = [{name:"description",label:"About me",multiline:true,maxLength:5000}] as const;
const PERSONAL_DETAILS_FIELDS = [{name:"gender",label:"Gender",maxLength:64},{name:"dateOfBirth",label:"Date of birth",type:"date",maxLength:10},{name:"bloodGroup",label:"Blood group",maxLength:16}] as const;
const ADDRESS_FIELDS = [{name:"currentAddress",label:"Current address",maxLength:2000,multiline:true},{name:"currentCity",label:"Current city",maxLength:160},{name:"currentState",label:"Current state",maxLength:160},{name:"currentPincode",label:"Current postal code",maxLength:16},{name:"permanentAddress",label:"Permanent address",maxLength:2000,multiline:true},{name:"permanentCity",label:"Permanent city",maxLength:160},{name:"permanentState",label:"Permanent state",maxLength:160},{name:"permanentPincode",label:"Permanent postal code",maxLength:16}] as const;
const SOCIAL_PROFILES_FIELDS = [{name:"linkedIn",label:"LinkedIn",maxLength:500,type:"url"},{name:"github",label:"GitHub",maxLength:500,type:"url"},{name:"portfolio",label:"Portfolio",maxLength:500,type:"url"},{name:"twitter",label:"X / Twitter",maxLength:500,type:"url"},{name:"googleScholar",label:"Google Scholar",maxLength:500,type:"url"},{name:"researchGate",label:"ResearchGate",maxLength:500,type:"url"}] as const;
const LANGUAGE_FIELDS = [{name:"language",label:"Language",maxLength:120,required:true},{name:"proficiency",label:"Proficiency",maxLength:64}] as const;
const EDUCATION_FIELDS = [{name:"institutionName",label:"Institution",maxLength:300,required:true},{name:"educationType",label:"Education type",maxLength:100},{name:"degree",label:"Degree",maxLength:100},{name:"field",label:"Field",maxLength:100},{name:"program",label:"Program",maxLength:100},{name:"specialization",label:"Specialization",maxLength:100},{name:"startYear",label:"Start year",maxLength:4},{name:"endYear",label:"End year",maxLength:4},{name:"isCurrentlyPursuing",label:"Currently pursuing",maxLength:1,kind:"checkbox"},{name:"gradingType",label:"Grade type",maxLength:100},{name:"grade",label:"Grade",maxLength:100},{name:"maxGrade",label:"Maximum grade",maxLength:100},{name:"isRecentEducation",label:"Most recent education",maxLength:1,kind:"checkbox"},{name:"qualifyingExam",label:"Qualifying examination",maxLength:100},{name:"examRank",label:"Exam rank",maxLength:200},{name:"score",label:"Score",maxLength:100},{name:"description",label:"Description",maxLength:2000,multiline:true}] as const;
const CERTIFICATIONS_FIELDS = [{name:"name",label:"Certification",maxLength:300,required:true},{name:"authority",label:"Issuing authority",maxLength:300},{name:"certificationDate",label:"Issued on",maxLength:10,kind:"date"},{name:"validityDate",label:"Valid until",maxLength:10,kind:"date"},{name:"certificateLink",label:"Verification URL",maxLength:500,kind:"url"},{name:"description",label:"Description",maxLength:3000,multiline:true}] as const;
const EXPERIENCES_FIELDS = [{name:"organization",label:"Organization",maxLength:200,required:true},{name:"designation",label:"Designation",maxLength:200},{name:"experienceType",label:"Experience type",maxLength:100},{name:"location",label:"Location",maxLength:200},{name:"from",label:"Start date",maxLength:10,kind:"date"},{name:"to",label:"End date",maxLength:10,kind:"date"},{name:"isPaid",label:"Paid experience",maxLength:1,kind:"checkbox"},{name:"salary",label:"Compensation",maxLength:100},{name:"description",label:"Description",maxLength:2000,multiline:true}] as const;
const PUBLICATIONS_FIELDS = [{name:"title",label:"Publication title",maxLength:300,required:true},{name:"journal",label:"Journal",maxLength:300},{name:"year",label:"Year",maxLength:4},{name:"doi",label:"DOI",maxLength:240},{name:"link",label:"Publication URL",maxLength:500,kind:"url"},{name:"authors",label:"Authors",maxLength:2000,multiline:true},{name:"description",label:"Abstract / description",maxLength:5000,multiline:true}] as const;
const AWARDS_FIELDS = [{name:"title",label:"Award title",maxLength:300,required:true},{name:"year",label:"Year",maxLength:4},{name:"awardedBy",label:"Awarded by",maxLength:300},{name:"description",label:"Description",maxLength:3000,multiline:true}] as const;
export function FacultyProfileEditor({initialDocument,initialVersion}:{
 initialDocument:FacultyProfileDocument;initialVersion:number;
}){
 const [document,setDocument]=useState(initialDocument);
 const [version,setVersion]=useState(initialVersion);
 const [sectionRevisions,setSectionRevisions]=useState<Partial<Record<FacultySelfSection,number>>>({});
 const [pending,setPending]=useState(false);
 const [savingSection,setSavingSection]=useState<FacultySelfSection|null>(null);
 const saveInFlight=useRef(false);
 const [error,setError]=useState<string|null>(null);
 const [success,setSuccess]=useState<string|null>(null);
 const [needsReload,setNeedsReload]=useState(false);
 const [reloadOpen,setReloadOpen]=useState(false);
 async function save(section:FacultySelfSection,value:unknown){
  if(!beginFacultyProfileSave(saveInFlight))return;
  setSavingSection(section);setPending(true);setError(null);setSuccess(null);setNeedsReload(false);
  try{
   const response=await fetch("/api/people/faculty-self-document",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section,value,expectedVersion:version}),
   });
   if(!response.ok){
    const problem:unknown=await response.json().catch(()=>null);
    const code=facultyProfileErrorCode(problem);
    setNeedsReload(facultyProfileReloadRequired(code,response.status));
    setError(facultyProfileSaveFailure(code,response.status));return;
   }
   const result=facultyProfileSaveReceipt(await response.json(),version);
   setDocument(result.document);setVersion(result.version);
   setSectionRevisions(current=>advanceFacultySectionRevision(current,section));
   setSuccess(facultyProfileSavedStatus(section,result.version));
  }catch(error){
   if(error instanceof FacultyProfileSaveResponseError){
    setNeedsReload(true);
    setError(facultyProfileUnconfirmedSaveMessage());
   }else setError("Unable to verify the save. The server may have received your request; check the latest profile before retrying.");
  }
  finally{saveInFlight.current=false;setPending(false);setSavingSection(null);}
 }
 return <div className="min-w-0 space-y-5">
  <ConfirmDialog open={reloadOpen} onOpenChange={setReloadOpen}
    title="Reload the latest Faculty profile?" description="Any unsaved changes in every section will be lost."
    confirmLabel="Reload latest profile" onConfirm={() => window.location.reload()} />
  <p className="text-sm text-muted-foreground">Only your own profile is editable. College-managed identity, employment and login details remain unchanged.</p>
  {error?<div role="alert" className="space-y-2 rounded-[var(--lms-control-radius,9px)] border border-border p-3 text-sm text-error">
   <p>{error}</p>
   {needsReload?<Button variant="secondary" type="button" onClick={()=>{
    setReloadOpen(true);
   }} className="min-h-11 px-4 sm:min-h-9">Reload latest profile</Button>:null}
  </div>:null}
  {pending&&savingSection?<p role="status" className="rounded-[var(--lms-control-radius,9px)] border border-border p-3 text-sm text-foreground">
    Saving {facultyProfileSaveSectionLabel(savingSection)}…</p>:null}
  {success?<p role="status" className="rounded-[var(--lms-control-radius,9px)] border border-border p-3 text-sm text-foreground">{success}</p>:null}
  <nav aria-label="Profile sections" className="rounded-[var(--lms-canvas-radius,12px)] border border-border bg-surface p-4">
    <p className="mb-3 text-sm font-semibold text-foreground">Jump to a profile section</p>
    <div className="flex flex-wrap gap-2">{FACULTY_PROFILE_NAV.map(item=><a key={item.section}
      className="rounded-[var(--lms-control-radius,9px)] border border-border px-3 py-2 text-sm text-primary-text hover:underline"
      href={"#"+facultyProfileAnchor(item.section)}>{item.label}</a>)}</div>
  </nav>
  <FacultyProfileTextSection key={"about-"+(sectionRevisions.about??0)} section="about" title="About"
   description="Introduce your teaching and research interests."
   fields={ABOUT_FIELDS} initial={{description:document.about.description}} pending={pending} onSave={save}/>
  <FacultyProfileTextSection key={"personalDetails-"+(sectionRevisions.personalDetails??0)} section="personalDetails" title="Personal details"
   description="Self-reported details only; college identity records remain separate."
   fields={PERSONAL_DETAILS_FIELDS}
   initial={{gender:document.personalDetails.gender,dateOfBirth:document.personalDetails.dateOfBirth,bloodGroup:document.personalDetails.bloodGroup}} pending={pending} onSave={save}/>
  <FacultyProfileTextSection key={"address-"+(sectionRevisions.address??0)} section="address" title="Address"
   description="Private mailing information; never exported to Faculty directories."
   fields={ADDRESS_FIELDS}
   initial={{currentAddress:document.address.currentAddress,currentCity:document.address.currentCity,currentState:document.address.currentState,currentPincode:document.address.currentPincode,permanentAddress:document.address.permanentAddress,permanentCity:document.address.permanentCity,permanentState:document.address.permanentState,permanentPincode:document.address.permanentPincode,city:document.address.city,state:document.address.state,pincode:document.address.pincode}} pending={pending} onSave={save}/>
  <FacultyProfileTextSection key={"socialProfiles-"+(sectionRevisions.socialProfiles??0)} section="socialProfiles" title="Social profiles"
   description="Optional HTTPS links to professional work and research."
   fields={SOCIAL_PROFILES_FIELDS}
   initial={{linkedIn:document.socialProfiles.linkedIn,github:document.socialProfiles.github,portfolio:document.socialProfiles.portfolio,twitter:document.socialProfiles.twitter,googleScholar:document.socialProfiles.googleScholar,researchGate:document.socialProfiles.researchGate}} pending={pending} onSave={save}/>
  <FacultyProfileSkills key={"skills-"+(sectionRevisions.skills??0)} initial={document.skills} pending={pending} onSave={save}/>
  <FacultyProfileMetadata key={"metadata-"+(sectionRevisions.metadata??0)} initial={document.metadata} pending={pending} onSave={save}/>
  <FacultyProfileRepeatable key={"awards-"+(sectionRevisions.awards??0)}
   section="awards" title="Awards" description="Maintain your own awards history. Draft deletions require Save."
   initial={document.awards} fields={AWARDS_FIELDS} maxItems={100}
   create={newFacultyAward} pending={pending} onSave={save}/>
  <FacultyProfileRepeatable key={"publications-"+(sectionRevisions.publications??0)}
   section="publications" title="Publications" description="Maintain your own publications history. Draft deletions require Save."
   initial={document.publications} fields={PUBLICATIONS_FIELDS} maxItems={100}
   create={newFacultyPublication} pending={pending} onSave={save}/>
  <FacultyProfileRepeatable key={"experiences-"+(sectionRevisions.experiences??0)}
   section="experiences" title="Experience" description="Manage your own experience history. Nothing changes until you save."
   initial={document.experiences} fields={EXPERIENCES_FIELDS} maxItems={50}
   create={newFacultyExperience} pending={pending} onSave={save}/>
  <FacultyProfileRepeatable key={"certifications-"+(sectionRevisions.certifications??0)}
   section="certifications" title="Certifications" description="Manage your own certifications history. Nothing changes until you save."
   initial={document.certifications} fields={CERTIFICATIONS_FIELDS} maxItems={50}
   create={newFacultyCertification} pending={pending} onSave={save}/>
  <FacultyProfileRepeatable key={"education-"+(sectionRevisions.education??0)}
   section="education" title="Education"
   description="Edit your own education records. Removals are drafts until saved."
   initial={document.education} fields={EDUCATION_FIELDS} maxItems={30}
   create={newFacultyEducation} pending={pending} onSave={save}/>
  <FacultyProfileRepeatable key={"languages-"+(sectionRevisions.languages??0)}
   section="languages" title="Languages"
   description="Edit your own languages records. Removals are drafts until saved."
   initial={document.languages} fields={LANGUAGE_FIELDS} maxItems={30}
   create={newFacultyLanguage} pending={pending} onSave={save}/>
 </div>;
}
