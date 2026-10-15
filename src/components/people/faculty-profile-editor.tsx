"use client";
import { useState } from "react";
import type { FacultyProfileDocument } from "@/modules/people/faculty-profile-document";
import type { FacultySelfSection } from "@/modules/people/faculty-self-section-model";
import { FacultyProfileTextSection } from "./faculty-profile-text-section";
const ABOUT_FIELDS = [{name:"description",label:"About me",multiline:true,maxLength:5000}] as const;
const PERSONAL_DETAILS_FIELDS = [{name:"gender",label:"Gender",maxLength:64},{name:"dateOfBirth",label:"Date of birth",type:"date",maxLength:10},{name:"bloodGroup",label:"Blood group",maxLength:16}] as const;
const ADDRESS_FIELDS = [{name:"currentAddress",label:"Current address",maxLength:2000,multiline:true},{name:"currentCity",label:"Current city",maxLength:160},{name:"currentState",label:"Current state",maxLength:160},{name:"currentPincode",label:"Current postal code",maxLength:16},{name:"permanentAddress",label:"Permanent address",maxLength:2000,multiline:true},{name:"permanentCity",label:"Permanent city",maxLength:160},{name:"permanentState",label:"Permanent state",maxLength:160},{name:"permanentPincode",label:"Permanent postal code",maxLength:16}] as const;
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
  <FacultyProfileTextSection key={"address-"+version} section="address" title="Address"
   description="Private mailing information; never exported to Faculty directories."
   fields={ADDRESS_FIELDS}
   initial={{currentAddress:document.address.currentAddress,currentCity:document.address.currentCity,currentState:document.address.currentState,currentPincode:document.address.currentPincode,permanentAddress:document.address.permanentAddress,permanentCity:document.address.permanentCity,permanentState:document.address.permanentState,permanentPincode:document.address.permanentPincode,city:document.address.city,state:document.address.state,pincode:document.address.pincode}} pending={pending} onSave={save}/>
 </div>;
}
