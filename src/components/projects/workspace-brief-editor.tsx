"use client";
import {useEffect,useId,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import {workspaceBriefSchema,publishedWorkspaceBriefError,type WorkspaceBrief}
 from "@/modules/projects/workspace-brief-model";

type Draft={goal:string;description:string;deliverables:string;conditions:string;personas:string};
function fromBrief(value:WorkspaceBrief):Draft{
 return {goal:value.goal,description:value.description,
  deliverables:value.deliverables.join("\n"),
  conditions:value.completionConditions.join("\n"),
  personas:value.personas.join("\n")};
}
const list=(value:string)=>value.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
// Ant Design's legacy autoSize constraints: keep a practical minimum without
// letting a long project brief push the Save action arbitrarily far below the fold.
function resizeToLegacyRows(element:HTMLTextAreaElement,minRows:number,maxRows:number){
 const css=window.getComputedStyle(element);
 const lineHeight=Number.parseFloat(css.lineHeight)||22;
 const padding=Number.parseFloat(css.paddingTop)+Number.parseFloat(css.paddingBottom);
 const border=Number.parseFloat(css.borderTopWidth)+Number.parseFloat(css.borderBottomWidth);
 element.style.height="auto";
 element.style.height=Math.max(minRows*lineHeight+padding+border,
  Math.min(maxRows*lineHeight+padding+border,element.scrollHeight))+"px";
 element.style.overflowY=element.scrollHeight>maxRows*lineHeight+padding+border?"auto":"hidden";
}

/** This is a section-scoped form, not a template editor: unrecognized
 * historical overview JSON keys survive in the service-side merge.
 */
export function WorkspaceBriefEditor({projectId,initial,updatedAt,requireDeliverables=false}:{
 projectId:string;initial:WorkspaceBrief;updatedAt:Date|string;
 requireDeliverables?:boolean;
}){
 const router=useRouter(),{showToast}=useToast();
 const currentVersion=new Date(updatedAt).toISOString();
 const [version,setVersion]=useState(currentVersion);
 const [open,setOpen]=useState(true);
 const headingId=useId();
 const deliverablesRef=useRef<HTMLTextAreaElement|null>(null);
 const goalRef=useRef<HTMLTextAreaElement|null>(null);
 const conditionsRef=useRef<HTMLTextAreaElement|null>(null);
 const personasRef=useRef<HTMLTextAreaElement|null>(null);
 const justSaved=useRef<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [draft,setDraft]=useState<Draft>(()=>fromBrief(initial));
 const [stale,setStale]=useState(false);
 const source=fromBrief(initial);
 const dirty=JSON.stringify(draft)!==JSON.stringify(source);
 const update=<K extends keyof Draft,>(name:K,value:Draft[K])=>{
  setDraft(current=>({...current,[name]:value}));
 };
 function discard(){setDraft(fromBrief(initial));setOpen(false);setError("");setStale(false);}
 const guard=useProjectEditorDiscardGuard(open,dirty,busy,discard);
 useEffect(()=>{
  if(currentVersion===version)return;
  if(open&&dirty){
   // Reconcile our own successful PATCH after router.refresh without showing a false conflict.
   if(justSaved.current===JSON.stringify(fromBrief(initial))){
    justSaved.current=null;
    setDraft(fromBrief(initial));setVersion(currentVersion);
    setError("");setStale(false);return;
   }
   // Another writer changed the project while there are unsaved local edits.
   setStale(true);return;
  }
  setDraft(fromBrief(initial));setVersion(currentVersion);
  setError("");setStale(false);
 },[currentVersion,version,open,dirty,initial]);
 async function save(){
  if(busy)return;
  if(!dirty){
   showToast({tone:"info",title:"No changes to save"});return;
  }
  if(stale||version!==currentVersion){
   setError("This workspace changed while you were editing. Reload the overview before saving.");
   return;
  }
  if(requireDeliverables&&!list(draft.deliverables).length){
   setError("Add at least one deliverable.");
   deliverablesRef.current?.focus();
   return;
  }
  const parsed=workspaceBriefSchema.safeParse({
   goal:draft.goal,description:draft.description,
   deliverables:list(draft.deliverables),
   completionConditions:list(draft.conditions),personas:list(draft.personas),
  });
  if(!parsed.success){
   const first=parsed.error.issues[0];
   setError(first?.message??"Check the project brief fields.");
   if(first?.path[0]==="deliverables")deliverablesRef.current?.focus();
   else if(first?.path[0]==="completionConditions")conditionsRef.current?.focus();
   else if(first?.path[0]==="personas")personasRef.current?.focus();
   else goalRef.current?.focus();
   return;
  }
  if(requireDeliverables){
   const validation=publishedWorkspaceBriefError(parsed.data);
   if(validation){setError(validation);return;}
  }
  setBusy(true);setError("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/brief","PATCH",{
    brief:parsed.data,expectedUpdatedAt:version,
   });
   justSaved.current=JSON.stringify(fromBrief(parsed.data));
   // Legacy Overview keeps the editor expanded after a save. The next server
   // snapshot remounts the version token without discarding in-progress edits.
   showToast({tone:"success",title:requireDeliverables?"Overview updated":"Project brief updated"});
   router.refresh();
  }catch(caught){
   const reason=caught instanceof Error?caught.message:"The overview could not be saved.";
   const conflict=/409|CONFLICT|stale|version/i.test(reason);
   setStale(conflict);
   setError(conflict?
     "This project has changed since the brief was loaded. Review the latest version before retrying.":
     "Failed to update overview. "+reason);
   showToast({tone:"error",title:"Failed to update overview",
    description:"Your unsaved brief remains in the form. Reload to compare against the latest version."});
  }finally{setBusy(false);}
 }
 const textClass="mt-1 w-full";
 return <section aria-label="Project brief" className="min-w-0 space-y-4 rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 sm:p-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div>
    <h2 className="text-lg font-semibold text-foreground">Project brief</h2>
    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-body">Learner & mentor view</p>
    <h3 className="mt-1 text-base font-semibold text-foreground">
     Make the project understandable before anyone opens the board.
    </h3>
    <p className="mt-2 text-sm leading-6 text-body">
     This content becomes the shared “About this project” reference for the team.
     Keep it outcome-focused, concrete and easy to scan.
    </p>
   </div>
   <Button type="button" size="sm" variant="secondary" disabled={busy}
    aria-expanded={open}
    onClick={()=>{if(open)guard.requestClose();else{
     setDraft(fromBrief(initial));setStale(false);setError("");setOpen(true);
    }}}>{open?"Close brief editor":"Edit project brief"}</Button>
  </div>
  {open?<div className="space-y-5">
   <section className="space-y-2 border-t border-border pt-4" aria-labelledby={headingId+"-goal"}>
    <h4 id={headingId+"-goal"} className="text-sm font-semibold text-foreground">Goal</h4>
    <p className="text-xs text-body">Why the project exists, who it serves and what success should look like.</p>
    <label className="block text-xs font-semibold text-body">
     Project goal / description
     <Textarea ref={goalRef} className={textClass} rows={4} maxLength={2000} value={draft.goal}
      aria-describedby={headingId+"-goal-help"}
      placeholder="Describe the problem, expected outcome and what a successful project should achieve."
      onInput={event=>resizeToLegacyRows(event.currentTarget,4,9)}
      onChange={event=>update("goal",event.target.value)}/>
     <span id={headingId+"-goal-help"} className="mt-1 block text-xs font-normal text-body">
      Shown as “About this project” on the learner and mentor Overview tab.
     </span>
    </label>
    <label className="block text-xs font-semibold text-body">Description
     <Textarea className={textClass} rows={3} maxLength={4000} value={draft.description}
      onChange={event=>update("description",event.target.value)}/>
    </label>
   </section>
   <div className="grid min-w-0 gap-5 lg:grid-cols-2">
    <section className="min-w-0 space-y-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-4" aria-labelledby={headingId+"-deliverables"}>
     <h4 id={headingId+"-deliverables"} className="text-sm font-semibold text-foreground">Deliverables</h4>
     <p className="text-xs text-body">The concrete outputs the team is expected to produce.</p>
     <label className="block text-xs font-semibold text-body">Deliverables
      <Textarea ref={deliverablesRef} className={textClass} rows={7}
       aria-invalid={requireDeliverables&&!list(draft.deliverables).length}
       aria-describedby={headingId+"-deliverables-help"} value={draft.deliverables}
       onInput={event=>resizeToLegacyRows(event.currentTarget,7,12)}
       placeholder={"Wireframes for all core screens\nWorking prototype\nFinal presentation deck"}
       onChange={event=>update("deliverables",event.target.value)}/>
      <span id={headingId+"-deliverables-help"} className="mt-1 block text-xs font-normal text-body">
       One per line. These appear as a checklist for mentors and students.
      </span>
      {requireDeliverables&&!list(draft.deliverables).length?
       <span role="alert" className="mt-1 block text-xs text-error">Add at least one deliverable.</span>:null}
     </label>
    </section>
    <section className="min-w-0 space-y-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-4" aria-labelledby={headingId+"-dod"}>
     <h4 id={headingId+"-dod"} className="text-sm font-semibold text-foreground">Definition of done</h4>
     <p className="text-xs text-body">
      The project-level conditions that mean the work is genuinely complete.
     </p>
     <label className="block text-xs font-semibold text-body">Completion conditions
      <Textarea ref={conditionsRef} className={textClass} rows={7} value={draft.conditions}
       onInput={event=>resizeToLegacyRows(event.currentTarget,7,12)}
       placeholder={"All acceptance criteria pass\nDeployed to a public URL\nMentor sign-off recorded"}
       onChange={event=>update("conditions",event.target.value)}/>
      <span className="mt-1 block text-xs font-normal text-body">
       One condition per line. Keep these verifiable rather than aspirational.
      </span>
     </label>
    </section>
   </div>
   <section className="space-y-2 border-t border-border pt-4" aria-labelledby={headingId+"-personas"}>
    <h4 id={headingId+"-personas"} className="text-sm font-semibold text-foreground">Personas & ownership</h4>
    <p className="text-xs text-body">Explain the working roles students can take and what each one owns.</p>
    <label className="block text-xs font-semibold text-body">Personas
     <Textarea ref={personasRef} className={textClass} rows={4} value={draft.personas}
      onInput={event=>resizeToLegacyRows(event.currentTarget,4,10)}
      placeholder={"Frontend lead — owns the board UI and component structure\nBackend lead — owns the API and data model"}
      onChange={event=>update("personas",event.target.value)}/>
     <span className="mt-1 block text-xs font-normal text-body">
      One per line. Use a short role name followed by the ownership boundary.
     </span>
    </label>
   </section>
   <p className="text-xs text-body">
    This form uses the loaded workspace version as its optimistic edit token. Updates
    to other project sections may require reloading; your draft is not overwritten.
    Clearing a field removes that field's current value without deleting historical project metadata.
   </p>
   {stale?<p role="alert" className="text-sm text-warning-text">
    The workspace changed while this form was open. Reload before saving to avoid overwriting another edit.
   </p>:null}
   {error?<p role="alert" className="text-sm font-semibold text-error">{error}</p>:null}
   <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
    <Button type="button" loading={busy} disabled={busy}
     onClick={()=>void save()}>{busy?"Saving…":"Save project brief"}</Button>
    <Button type="button" variant="secondary" disabled={busy}
     onClick={guard.requestClose}>Cancel</Button>
    {stale?<Button type="button" variant="secondary" onClick={()=>{
     setDraft(fromBrief(initial));setVersion(currentVersion);setStale(false);setError("");
     router.refresh();
    }}>Reload overview</Button>:null}
    <p className="text-xs text-body">Changes update the Overview seen by mentors and students.</p>
   </div>
  </div>:null}
  <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
   title="Discard unsaved changes?"
   description="You have unsaved changes. Leave without saving them?"
   confirmLabel="Discard changes" pending={busy} onConfirm={guard.confirmDiscard}/>
 </section>;
}
