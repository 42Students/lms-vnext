"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {apiFetch} from "@/lib/api-fetch";

type Skill={id:string;name:string;proficiency:""|"Beginner"|"Intermediate"|"Advanced"|"Expert"};
type Preferences={
 rolePreferences:string[];specificRolePreference:string;
 workShiftPreference:""|"DAY"|"NIGHT"|"ROTATIONAL"|"FLEXIBLE"|"REMOTE";
 preferredEmploymentCity:string;rolePreference:string;
 examSlotPreference:""|"Morning"|"Afternoon"|"Evening";
 jobNotificationsEnabled:boolean;papInterest:""|"Yes"|"No"|"Need more info";
};
type Saved={version:number;skills:Skill[];jobPreferences:Preferences};
const defaults:Preferences={rolePreferences:[],specificRolePreference:"",
 workShiftPreference:"",preferredEmploymentCity:"",rolePreference:"",
 examSlotPreference:"",jobNotificationsEnabled:true,papInterest:""};
export function AdminPlacementStudentProfileEditor({membershipId,skills:initialSkills,
 preferences:initialPreferences,expectedVersion,readOnly=false}:{
 membershipId:string;skills:readonly Skill[];preferences:Preferences|null;
 expectedVersion:number;readOnly?:boolean;
}){
 const router=useRouter(),{showToast}=useToast();
 const [skills,setSkills]=useState<Skill[]>([...initialSkills]);
 const [preferences,setPreferences]=useState<Preferences>(initialPreferences??defaults);
 const [version,setVersion]=useState(expectedVersion);
 const [editing,setEditing]=useState<number|null>(null);
 const [name,setName]=useState("");
 const [proficiency,setProficiency]=useState<Skill["proficiency"]>("");
 const [removeIndex,setRemoveIndex]=useState<number|null>(null);
 const [editingPreferences,setEditingPreferences]=useState(false);
 const [roles,setRoles]=useState((initialPreferences?.rolePreferences??[]).join(", "));
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 function clearSkill(){setEditing(null);setName("");setProficiency("");}
 async function submit(action:"ADD_SKILL"|"EDIT_SKILL"|"DELETE_SKILL"|"SET_PREFERENCES",
  values:Record<string,unknown>){
  if(pending||readOnly)return;
  setPending(true);setError("");
  try{
   const saved=await apiFetch<Saved>(
    "/api/placements/college/students/"+encodeURIComponent(membershipId)+"/profile",{
    method:"PATCH",headers:{"content-type":"application/json"},
    body:JSON.stringify({action,expectedVersion:version,confirmed:true,...values}),
   });
   setVersion(saved.version);setSkills(saved.skills);setPreferences(saved.jobPreferences);
   setRoles(saved.jobPreferences.rolePreferences.join(", "));
   clearSkill();setRemoveIndex(null);setEditingPreferences(false);
   showToast({tone:"success",title:action==="DELETE_SKILL"?"Skill removed":"Learner profile saved"});
   router.refresh();
  }catch(cause){
   const message=cause instanceof Error?cause.message:"Unable to update learner profile.";
   setError(message);showToast({tone:"error",title:"Profile update failed",description:message});
  }finally{setPending(false);}
 }
 function saveSkill(){
  const value=name.trim();
  if(!value||value.length>120){setError("Enter a skill of 1 to 120 characters.");return;}
  void submit(editing===null?"ADD_SKILL":"EDIT_SKILL",{
   ...(editing===null?{}:{index:editing}),skill:{name:value,proficiency}});
 }
 function savePreferences(){
  const parsed=roles.split(",").map(value=>value.trim()).filter(Boolean);
  if(parsed.length>20||parsed.some(value=>value.length>500)){
   setError("Enter up to 20 roles, each no longer than 500 characters.");return;
  }
  void submit("SET_PREFERENCES",{preferences:{...preferences,rolePreferences:parsed}});
 }
 return <div className="space-y-1">
  <details className="border-b border-border py-2">
   <summary className="min-h-9 cursor-pointer text-sm font-semibold text-[var(--lms-heading)]">Skills</summary>
   <div className="space-y-3 pt-3">
    {skills.length?<ul className="divide-y divide-border border-y border-border">{skills.map((skill,index)=>
     <li key={skill.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
      <span><strong>{skill.name}</strong><span className="ml-2 text-muted-foreground">{skill.proficiency||"Proficiency not specified"}</span></span>
      {!readOnly?<span className="flex gap-2">
       <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={()=>{
        setEditing(index);setName(skill.name);setProficiency(skill.proficiency);setError("");
       }}>Edit</Button>
       <Button type="button" variant="danger" size="sm" disabled={pending}
        onClick={()=>setRemoveIndex(index)}>Remove</Button>
      </span>:null}
     </li>)}</ul>:<p className="text-sm text-muted-foreground">No skills recorded in the authorized learner profile.</p>}
    {!readOnly?editing!==null||name?<div className="grid gap-2 sm:grid-cols-[1fr_170px_auto]">
     <label className="text-xs font-semibold">Skill
      <Input className="mt-1 w-full" maxLength={120} value={name} disabled={pending}
       onChange={event=>setName(event.target.value)}/>
     </label>
     <label className="text-xs font-semibold">Proficiency
      <Select className="mt-1 w-full" value={proficiency} disabled={pending}
       onChange={event=>setProficiency(event.target.value as Skill["proficiency"])}>
       {(["","Beginner","Intermediate","Advanced","Expert"] as const).map(value=>
        <option key={value} value={value}>{value||"Not specified"}</option>)}
      </Select>
     </label>
     <div className="flex items-end gap-2">
      <Button disabled={pending||!name.trim()} onClick={saveSkill}>{editing===null?"Add":"Save"}</Button>
      <Button variant="secondary" disabled={pending} onClick={clearSkill}>Cancel</Button>
     </div>
    </div>:<Button variant="secondary" disabled={pending||skills.length>=100}
      onClick={()=>{setName(" ");setError("");}}>+ Add skill</Button>:null}
   </div>
  </details>
  <details className="border-b border-border py-2">
   <summary className="min-h-9 cursor-pointer text-sm font-semibold text-[var(--lms-heading)]">Job Preferences</summary>
   <div className="space-y-3 pt-3 text-sm">
    {!editingPreferences?<div className="grid gap-2 sm:grid-cols-2">
     <p><strong>Roles:</strong> {preferences.rolePreferences.join(", ")||"Not provided"}</p>
     <p><strong>Specific role:</strong> {preferences.specificRolePreference||"Not provided"}</p>
     <p><strong>Work shift:</strong> {preferences.workShiftPreference||"Not provided"}</p>
     <p><strong>Preferred city:</strong> {preferences.preferredEmploymentCity||"Not provided"}</p>
     <p><strong>Exam slot:</strong> {preferences.examSlotPreference||"Not provided"}</p>
     <p><strong>Job notifications:</strong> {preferences.jobNotificationsEnabled?"Enabled":"Disabled"}</p>
     <p><strong>PAP interest:</strong> {preferences.papInterest||"Not provided"}</p>
    </div>:<div className="grid gap-3 sm:grid-cols-2">
     <label className="text-xs font-semibold">Roles (comma separated)
      <Input className="mt-1 w-full" value={roles} disabled={pending}
       onChange={event=>setRoles(event.target.value)}/>
     </label>
     <label className="text-xs font-semibold">Specific role
      <Input className="mt-1 w-full" maxLength={200} disabled={pending}
       value={preferences.specificRolePreference}
       onChange={event=>setPreferences(p=>({...p,specificRolePreference:event.target.value}))}/>
     </label>
     <label className="text-xs font-semibold">Preferred city
      <Input className="mt-1 w-full" maxLength={120} disabled={pending}
       value={preferences.preferredEmploymentCity}
       onChange={event=>setPreferences(p=>({...p,preferredEmploymentCity:event.target.value}))}/>
     </label>
     <label className="text-xs font-semibold">Work shift
      <Select className="mt-1 w-full" disabled={pending} value={preferences.workShiftPreference}
       onChange={event=>setPreferences(p=>({...p,workShiftPreference:event.target.value as Preferences["workShiftPreference"]}))}>
       {(["","DAY","NIGHT","ROTATIONAL","FLEXIBLE","REMOTE"] as const).map(value=>
        <option key={value} value={value}>{value||"Not specified"}</option>)}
      </Select>
     </label>
     <label className="text-xs font-semibold">Exam slot
      <Select className="mt-1 w-full" disabled={pending} value={preferences.examSlotPreference}
       onChange={event=>setPreferences(p=>({...p,examSlotPreference:event.target.value as Preferences["examSlotPreference"]}))}>
       {(["","Morning","Afternoon","Evening"] as const).map(value=>
        <option key={value} value={value}>{value||"Not specified"}</option>)}
      </Select>
     </label>
     <label className="text-xs font-semibold">PAP interest
      <Select className="mt-1 w-full" disabled={pending} value={preferences.papInterest}
       onChange={event=>setPreferences(p=>({...p,papInterest:event.target.value as Preferences["papInterest"]}))}>
       {(["","Yes","No","Need more info"] as const).map(value=>
        <option key={value} value={value}>{value||"Not specified"}</option>)}
      </Select>
     </label>
     <label className="flex items-center gap-2 text-xs font-semibold sm:col-span-2">
      <Checkbox checked={preferences.jobNotificationsEnabled} disabled={pending}
       onChange={event=>setPreferences(p=>({...p,jobNotificationsEnabled:event.target.checked}))}/>
      Job notifications enabled
     </label>
    </div>}
    {!readOnly?<div className="flex flex-wrap gap-2">
     {editingPreferences?<><Button disabled={pending} onClick={savePreferences}>Save preferences</Button>
      <Button variant="secondary" disabled={pending} onClick={()=>{
       setPreferences(initialPreferences??defaults);setRoles((initialPreferences?.rolePreferences??[]).join(", "));setEditingPreferences(false);
      }}>Cancel</Button></>:<Button variant="secondary" disabled={pending}
       onClick={()=>setEditingPreferences(true)}>Edit job preferences</Button>}
    </div>:null}
   </div>
  </details>
  {error?<p role="alert" className="text-sm text-error">{error} Refresh the student record before retrying a conflicting change.</p>:null}
  <ConfirmDialog open={removeIndex!==null} pending={pending}
   onOpenChange={value=>{if(!value&&!pending)setRemoveIndex(null);}}
   title="Remove skill?"
   description={removeIndex===null?"":'Remove "'+(skills[removeIndex]?.name??"this skill")+'" from the learner profile?'}
   confirmLabel="Remove skill" confirmVariant="danger"
   onConfirm={()=>{if(removeIndex!==null)void submit("DELETE_SKILL",{index:removeIndex});}}/>
 </div>;
}
