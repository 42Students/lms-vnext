"use client";
import { useState } from "react";
import type { FacultyProfileDocument } from "@/modules/people/faculty-profile-document";
import type { FacultySelfSection } from "@/modules/people/faculty-self-section-model";
import { FacultyProfileTextSection } from "./faculty-profile-text-section";
import { FacultyProfileSkills } from "./faculty-profile-skills";
import { FacultyProfileRepeatable } from "./faculty-profile-repeatable";
import { newFacultyCertification } from "@/modules/people/faculty-profile-row-factories";
import { newFacultyEducation } from "@/modules/people/faculty-profile-row-factories";
import { newFacultyLanguage } from "@/modules/people/faculty-profile-row-factories";
const ABOUT_FIELDS = [{name:"description",label:"About me",multiline:true,maxLength:5000}] as const;
const PERSONAL_DETAILS_FIELDS = [{name:"gender",label:"Gender",maxLength:64},{name:"dateOfBirth",label:"Date of birth",type:"date",maxLength:10},{name:"bloodGroup",label:"Blood group",maxLength:16}] as const;
const ADDRESS_FIELDS = [{name:"currentAddress",label:"Current address",maxLength:2000,multiline:true},{name:"currentCity",label:"Current city",maxLength:160},{name:"currentState",label:"Current state",maxLength:160},{name:"currentPincode",label:"Current postal code",maxLength:16},{name:"permanentAddress",label:"Permanent address",maxLength:2000,multiline:true},{name:"permanentCity",label:"Permanent city",maxLength:160},{name:"permanentState",label:"Permanent state",maxLength:160},{name:"permanentPincode",label:"Permanent postal code",maxLength:16}] as const;
const SOCIAL_PROFILES_FIELDS = [{name:"linkedIn",label:"LinkedIn",maxLength:500,type:"url"},{name:"github",label:"GitHub",maxLength:500,type:"url"},{name:"portfolio",label:"Portfolio",maxLength:500,type:"url"},{name:"twitter",label:"X / Twitter",maxLength:500,type:"url"},{name:"googleScholar",label:"Google Scholar",maxLength:500,type:"url"},{name:"researchGate",label:"ResearchGate",maxLength:500,type:"url"}] as const;
const LANGUAGE_FIELDS = [{name:"language",label:"Language",maxLength:120,required:true},{name:"proficiency",label:"Proficiency",maxLength:64}] as const;
const EDUCATION_FIELDS = [{name:"institutionName",label:"Institution",maxLength:300,required:true},{name:"degree",label:"Degree",maxLength:100},{name:"field",label:"Field",maxLength:100},{name:"program",label:"Program",maxLength:100},{name:"specialization",label:"Specialization",maxLength:100},{name:"startYear",label:"Start year",maxLength:4},{name:"endYear",label:"End year",maxLength:4},{name:"isCurrentlyPursuing",label:"Currently pursuing",maxLength:1,kind:"checkbox"},{name:"gradingType",label:"Grade type",maxLength:100},{name:"grade",label:"Grade",maxLength:100},{name:"maxGrade",label:"Maximum grade",maxLength:100},{name:"isRecentEducation",label:"Most recent education",maxLength:1,kind:"checkbox"},{name:"description",label:"Description",maxLength:2000,multiline:true}] as const;
const CERTIFICATIONS_FIELDS = [{name:"name",label:"Certification",maxLength:300,required:true},{name:"authority",label:"Issuing authority",maxLength:300},{name:"certificationDate",label:"Issued on",maxLength:10,kind:"date"},{name:"validityDate",label:"Valid until",maxLength:10,kind:"date"},{name:"certificateLink",label:"Verification URL",maxLength:500,kind:"url"},{name:"description",label:"Description",maxLength:3000,multiline:true}] as const;
export function FacultyProfileEditor({initialDocument,initialVersion}:{
 initialDocument:FacultyProfileDocument;initialVersion:number;
}){
 const [document,setDocument]=useState(initialDocument);
 const [version,setVersion]=useState(initialVersion);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [success,setSuccess]=useState<string|null>(null);
 async function save(section:FacultySelfSection,value:unknown){
  if(pending)return;
  setPending(true);setError(null);setSuccess(null);
  try{
   const response=await fetch("/api/people/faculty-self-document",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section,value,expectedVersion:version}),
   });
   if(!response.ok){
    if(response.status===409){
     const problem=await response.json().catch(()=>({error:"UNKNOWN"})) as {error?:string};
     setError(problem.error==="PRIVATE_IDENTITY_STORAGE_NOT_READY"
      ?"Profile storage is not registered. Your edits have not been saved."
      :problem.error==="FACULTY_PROFILE_VERSION_CONFLICT"
       ?"Your profile changed. Reload this page before saving again."
       :"This change was rejected. Review your fields and retry.");return;
    }
    setError("Could not save your profile. Check the fields and retry.");return;
   }
   const result=await response.json() as {document:FacultyProfileDocument;version:number};
   setDocument(result.document);setVersion(result.version);setSuccess("Profile saved.");
  }catch{setError("Unable to connect. Your unsaved changes remain in this form.");}
  finally{setPending(false);}
 }
 return <div className="space-y-5">
  <p className="text-sm text-muted-foreground">Only your own profile is editable. College-managed identity, employment and login details remain unchanged.</p>
  {error?<p role="alert" className="rounded-md border border-border p-3 text-sm text-error">{error}</p>:null}
  {success?<p role="status" className="rounded-md border border-border p-3 text-sm text-foreground">{success}</p>:null}
  <FacultyProfileTextSection key={"about-"+version} section="about" title="About"
   description="Introduce your teaching and research interests."
   fields={ABOUT_FIELDS} initial={{description:document.about.description}} pending={pending} onSave={save}/>
  <FacultyProfileTextSection key={"personalDetails-"+version} section="personalDetails" title="Personal details"
   description="Self-reported details only; college identity records remain separate."
   fields={PERSONAL_DETAILS_FIELDS}
   initial={{gender:document.personalDetails.gender,dateOfBirth:document.personalDetails.dateOfBirth,bloodGroup:document.personalDetails.bloodGroup}} pending={pending} onSave={save}/>
  <FacultyProfileTextSection key={"address-"+version} section="address" title="Address"
   description="Private mailing information; never exported to Faculty directories."
   fields={ADDRESS_FIELDS}
   initial={{currentAddress:document.address.currentAddress,currentCity:document.address.currentCity,currentState:document.address.currentState,currentPincode:document.address.currentPincode,permanentAddress:document.address.permanentAddress,permanentCity:document.address.permanentCity,permanentState:document.address.permanentState,permanentPincode:document.address.permanentPincode,city:document.address.city,state:document.address.state,pincode:document.address.pincode}} pending={pending} onSave={save}/>
  <FacultyProfileTextSection key={"socialProfiles-"+version} section="socialProfiles" title="Social profiles"
   description="Optional HTTPS links to professional work and research."
   fields={SOCIAL_PROFILES_FIELDS}
   initial={{linkedIn:document.socialProfiles.linkedIn,github:document.socialProfiles.github,portfolio:document.socialProfiles.portfolio,twitter:document.socialProfiles.twitter,googleScholar:document.socialProfiles.googleScholar,researchGate:document.socialProfiles.researchGate}} pending={pending} onSave={save}/>
  <FacultyProfileSkills key={"skills-"+version} initial={document.skills} pending={pending} onSave={save}/>
  <FacultyProfileRepeatable key={"certifications-"+version}
   section="certifications" title="Certifications" description="Manage your own certifications history. Nothing changes until you save."
   initial={document.certifications} fields={CERTIFICATIONS_FIELDS} maxItems={50}
   create={newFacultyCertification} pending={pending} onSave={save}/>
  <FacultyProfileRepeatable key={"education-"+version}
   section="education" title="Education"
   description="Edit your own education records. Removals are drafts until saved."
   initial={document.education} fields={EDUCATION_FIELDS} maxItems={30}
   create={newFacultyEducation} pending={pending} onSave={save}/>
  <FacultyProfileRepeatable key={"languages-"+version}
   section="languages" title="Languages"
   description="Edit your own languages records. Removals are drafts until saved."
   initial={document.languages} fields={LANGUAGE_FIELDS} maxItems={30}
   create={newFacultyLanguage} pending={pending} onSave={save}/>
 </div>;
}
