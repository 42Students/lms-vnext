"use client";
import { useState } from "react";
import type { FacultyProfileDocument } from "@/modules/people/faculty-profile-document";
import type { FacultySelfSection } from "@/modules/people/faculty-self-section-model";
import { FacultyProfileTextSection } from "./faculty-profile-text-section";
const ABOUT_FIELDS = [{name:"description",label:"About me",multiline:true,maxLength:5000}] as const;
const PERSONAL_DETAILS_FIELDS = [{name:"gender",label:"Gender",maxLength:64},{name:"dateOfBirth",label:"Date of birth",type:"date",maxLength:10},{name:"bloodGroup",label:"Blood group",maxLength:16}] as const;
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
    if(response.status===409){setError("Your profile changed. Reload this page before saving again.");return;}
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
 </div>;
}
