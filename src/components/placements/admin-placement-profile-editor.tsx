"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Alert} from "@/components/ui/alert";
import {apiFetch} from "@/lib/api-fetch";

type Skill={id:string;name:string;proficiency:""|"Beginner"|"Intermediate"|"Advanced"|"Expert"};
type Preferences={
 rolePreferences:string[];specificRolePreference:string;
 preferredEmploymentCity:string;workShiftPreference:string;
 [key:string]:unknown;
};
export function AdminPlacementProfileEditor({membershipId,initialSkills,initialPreferences,
 version:initialVersion,resumeAvailable,resumeScanStatus}:{
 membershipId:string;initialSkills:readonly Skill[];initialPreferences:Preferences|null;
 version:number;resumeAvailable:boolean;resumeScanStatus:string|null;
}){
 const router=useRouter();
 const [skills,setSkills]=useState<Skill[]>([...initialSkills]);
 const [preferences,setPreferences]=useState(initialPreferences);
 const [version,setVersion]=useState(initialVersion);
 const [editing,setEditing]=useState<number|null>(null);
 const [name,setName]=useState("");
 const [proficiency,setProficiency]=useState<Skill["proficiency"]>("");
 const [remove,setRemove]=useState<number|null>(null);
 const [roleText,setRoleText]=useState((initialPreferences?.rolePreferences??[]).join(", "));
 const [city,setCity]=useState(initialPreferences?.preferredEmploymentCity??"");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const target="/api/placements/college/students/"+encodeURIComponent(membershipId)+"/profile";
 async function commit(body:Record<string,unknown>){
  if(busy)return;
  setBusy(true);setError("");setSuccess("");
  try{
   const data=await apiFetch<{version:number;skills:Skill[];jobPreferences:Preferences}>(target,{
    method:"PATCH",headers:{"content-type":"application/json"},
    body:JSON.stringify({...body,expectedVersion:version,confirmed:true}),
   });
   setSkills(data.skills);setPreferences(data.jobPreferences);setVersion(data.version);
   setEditing(null);setRemove(null);
   setSuccess("Learner profile saved. The correction was recorded in the activity log.");
   router.refresh();
  }catch(error){setError(error instanceof Error?error.message:"Unable to save profile correction. Refresh before retrying.");}
  finally{setBusy(false);}
 }
 return <div className="space-y-4" aria-label="Authorized student profile sections">
  <details className="border-b border-border pb-3" open>
   <summary className="cursor-pointer py-2 text-sm font-semibold">Resume</summary>
   <p className="mt-2 text-sm text-body">{resumeAvailable
    ?"Verified resume is on file. Use the signed private-document viewer in the authorized learner record."
    :resumeScanStatus==="PENDING"?"Resume scan pending; no private download is exposed."
    :"No scanned resume is available for this learner."}</p>
   <p className="mt-1 text-xs text-muted-foreground">Private resume replacement requires the existing verified upload/receipt workflow; direct file URLs are not accepted.</p>
  </details>
  <details className="border-b border-border pb-3" open>
   <summary className="cursor-pointer py-2 text-sm font-semibold">Skills ({skills.length})</summary>
   <div className="mt-2 overflow-x-auto">
    <table className="w-full min-w-[360px] text-left text-sm">
     <thead><tr className="border-b border-border">
      <th scope="col" className="p-2">Skill</th><th scope="col" className="p-2">Proficiency</th><th scope="col" className="p-2">Actions</th>
     </tr></thead>
     <tbody>{skills.map((row,index)=><tr key={row.id} className="border-b border-border">
      <td className="p-2">{row.name}</td><td className="p-2">{row.proficiency||"Not specified"}</td>
      <td className="p-2"><div className="flex flex-wrap gap-2">
       <Button variant="secondary" type="button" disabled={busy}
        onClick={()=>{setEditing(index);setName(row.name);setProficiency(row.proficiency);setError("");}}>Edit</Button>
       <Button variant="secondary" type="button" disabled={busy}
        onClick={()=>setRemove(index)}>Remove</Button>
      </div></td>
     </tr>)}</tbody>
    </table>
    {skills.length===0?<p className="py-3 text-sm text-muted-foreground">No skills recorded for this learner.</p>:null}
   </div>
   <Button type="button" variant="secondary" className="mt-3"
    disabled={busy||skills.length>=100} onClick={()=>{setEditing(-1);setName("");setProficiency("");setError("");}}>Add skill</Button>
  </details>
  <details className="border-b border-border pb-3" open>
   <summary className="cursor-pointer py-2 text-sm font-semibold">Job Preferences</summary>
   <div className="mt-3 grid max-w-xl gap-3">
    <label className="grid gap-1 text-sm font-semibold">Preferred roles (comma separated)
     <Input value={roleText} maxLength={1500} disabled={busy}
      onChange={event=>setRoleText(event.target.value)}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Preferred employment city
     <Input value={city} maxLength={120} disabled={busy}
      onChange={event=>setCity(event.target.value)}/>
    </label>
    <Button variant="secondary" type="button" className="justify-self-start" disabled={busy}
     onClick={()=>void commit({action:"SET_PREFERENCES",preferences:{
      ...(preferences??{}),rolePreferences:roleText.split(",").map(s=>s.trim()).filter(Boolean),
      preferredEmploymentCity:city.trim(),
     }})}>Save job preferences</Button>
   </div>
  </details>
  <Dialog open={editing!==null} onOpenChange={open=>{if(!open&&!busy)setEditing(null);}}
   title={editing===-1?"Add skill":"Edit skill"} description="Changes are scoped to this student and audited."
   footer={<div className="flex justify-end gap-2">
    <Button type="button" variant="secondary" disabled={busy} onClick={()=>setEditing(null)}>Cancel</Button>
    <Button type="button" disabled={busy||!name.trim()}
     onClick={()=>void commit({action:editing===-1?"ADD_SKILL":"EDIT_SKILL",
      ...(editing!==-1?{index:editing}:{}),skill:{name:name.trim(),proficiency}})}>
     {busy?"Saving…":"Save skill"}
    </Button>
   </div>}>
   <div className="grid gap-3">
    <label className="grid gap-1 text-sm font-semibold">Skill
     <Input value={name} maxLength={120} disabled={busy}
      onChange={event=>setName(event.target.value)} required/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Proficiency
     <Select value={proficiency} disabled={busy}
      onChange={event=>setProficiency(event.target.value as Skill["proficiency"])}>
      {["","Beginner","Intermediate","Advanced","Expert"].map(p=><option key={p} value={p}>{p||"Not specified"}</option>)}
     </Select>
    </label>
   </div>
  </Dialog>
  <ConfirmDialog open={remove!==null} onOpenChange={next=>{if(!next&&!busy)setRemove(null);}}
   title="Remove this skill?" description={remove===null?"":"Remove "+(skills[remove]?.name??"selected skill")+" from this learner's profile? The change is audited."}
   confirmLabel="Remove skill" confirmVariant="danger" pending={busy}
   onConfirm={()=>{if(remove!==null)void commit({action:"DELETE_SKILL",index:remove});}}/>
  {error?<Alert role="alert" tone="warning">{error}</Alert>:null}
  {success?<Alert role="status" tone="success">{success}</Alert>:null}
 </div>;
}
