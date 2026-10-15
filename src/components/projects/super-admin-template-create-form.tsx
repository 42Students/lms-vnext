"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {initialSuperAdminTemplateDraft} from "@/modules/projects/super-admin-template-create-model";
import {projectMutation} from "@/components/projects/project-api";

export function SuperAdminTemplateCreateForm(){
 const router=useRouter();
 const [values,setValues]=useState({slug:"",title:"",summary:"",goal:"",release:"Release 1",sprint:"Sprint 1",task:"",priority:"MEDIUM",acceptanceCriteria:"",releaseDescription:"",sprintDescription:"",taskDescription:"",overviewDescription:"",resourceTitle:"",resourceUrl:""});
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const edit=(key:keyof typeof values,value:string)=>setValues(old=>({...old,[key]:value}));
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(saving)return;
  setError("");setSaving(true);
  try{
   const payload=initialSuperAdminTemplateDraft(values);
   const result=await projectMutation("/api/projects/templates","POST",payload) as {template:{id:string}};
   router.push("/admin/projects/templates/"+encodeURIComponent(result.template.id));
   router.refresh();
  }catch(caught){
   setError(caught instanceof Error?caught.message:"Template creation failed.");
  }finally{setSaving(false);}
 }
 const fields=[
  {key:"title",label:"Template title",limit:200,required:true},
  {key:"slug",label:"Slug",limit:64,required:true},
  {key:"release",label:"First release",limit:200,required:true},
  {key:"sprint",label:"First sprint",limit:200,required:true},
  {key:"task",label:"First task",limit:200,required:true},
 ] as const;
 return <form onSubmit={event=>void submit(event)} className="mx-auto grid max-w-3xl gap-5 rounded-xl border border-border bg-surface p-4 sm:p-6">
  <p className="m-0 text-sm text-body">The draft starts with one release, one sprint and one task. Review and publish after creation.</p>
  <div className="grid min-w-0 gap-4 sm:grid-cols-2">
   {fields.map(field=><label key={field.key} className="grid min-w-0 gap-1 text-sm font-semibold text-body">
    {field.label}<input required={field.required} maxLength={field.limit} disabled={saving}
     value={values[field.key]} onChange={event=>edit(field.key,field.key==="slug"?event.target.value.toLowerCase():event.target.value)}
     pattern={field.key==="slug"?"[a-z0-9]+(?:-[a-z0-9]+)*":undefined}
     className="min-h-11 min-w-0 rounded-md border border-border bg-background px-3 text-foreground"/>
   </label>)}
  </div>
  <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">Summary (optional)
   <textarea maxLength={2000} disabled={saving} value={values.summary} onChange={event=>edit("summary",event.target.value)}
    className="min-h-24 min-w-0 rounded-md border border-border bg-background p-3 text-foreground"/>
  </label>
  <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">Goal (optional)
   <textarea maxLength={2000} disabled={saving} value={values.goal} onChange={event=>edit("goal",event.target.value)}
    className="min-h-24 min-w-0 rounded-md border border-border bg-background p-3 text-foreground"/>
  </label>
  <label className="grid gap-1 text-sm font-semibold text-body">First task priority
   <select disabled={saving} value={values.priority} onChange={event=>edit("priority",event.target.value)} className="min-h-11 rounded-md border border-border bg-background px-3 text-foreground">
    <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
   </select>
  </label>
  <label className="grid gap-1 text-sm font-semibold text-body">First task acceptance criteria (optional)
   <textarea maxLength={4000} disabled={saving} value={values.acceptanceCriteria} onChange={event=>edit("acceptanceCriteria",event.target.value)} className="min-h-24 rounded-md border border-border bg-background p-3 text-foreground"/>
  </label>
  <label className="grid gap-1 text-sm font-semibold text-body">First release description (optional)
   <textarea maxLength={4000} disabled={saving} value={values.releaseDescription} onChange={event=>edit("releaseDescription",event.target.value)} className="min-h-24 rounded-md border border-border bg-background p-3 text-foreground"/>
  </label>
  <label className="grid gap-1 text-sm font-semibold text-body">First sprint description (optional)
   <textarea maxLength={4000} disabled={saving} value={values.sprintDescription} onChange={event=>edit("sprintDescription",event.target.value)} className="min-h-24 rounded-md border border-border bg-background p-3 text-foreground"/>
  </label>
  <label className="grid gap-1 text-sm font-semibold text-body">First task description (optional)
   <textarea maxLength={4000} disabled={saving} value={values.taskDescription} onChange={event=>edit("taskDescription",event.target.value)} className="min-h-24 rounded-md border border-border bg-background p-3 text-foreground"/>
  </label>
  <label className="grid gap-1 text-sm font-semibold text-body">Overview description (optional)
   <textarea maxLength={4000} disabled={saving} value={values.overviewDescription} onChange={event=>edit("overviewDescription",event.target.value)} className="min-h-24 rounded-md border border-border bg-background p-3 text-foreground"/>
  </label>
  <fieldset className="min-w-0 space-y-3 rounded-lg border border-border p-3">
   <legend className="px-2 text-sm font-semibold text-body">Starting resource link (optional)</legend>
   <p className="text-xs text-muted-foreground">Add a public HTTP(S) resource. Both title and URL are required when adding one.</p>
   <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">Resource title
    <input maxLength={200} disabled={saving} value={values.resourceTitle} onChange={event=>edit("resourceTitle",event.target.value)} className="min-h-11 min-w-0 rounded-md border border-border bg-background px-3 text-foreground"/>
   </label>
   <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">Resource URL
    <input type="url" maxLength={2048} disabled={saving} value={values.resourceUrl} onChange={event=>edit("resourceUrl",event.target.value)} className="min-h-11 min-w-0 rounded-md border border-border bg-background px-3 text-foreground"/>
   </label>
  </fieldset>
  {error?<p role="alert" className="break-words text-sm text-error-text">{error}</p>:null}
  <div className="flex flex-wrap justify-end gap-3">
   <Link href="/admin/projects/templates" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm">Cancel</Link>
   <button type="submit" disabled={saving} className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-50">{saving?"Creating…":"Create draft template"}</button>
  </div>
 </form>;
}
