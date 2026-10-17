"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { projectApiError, projectMutation } from "./project-api";
import { previewClassTeams, type ProjectTeam } from "@/modules/projects/class-team-split-model";
import { moveMemberBalanced } from "@/modules/projects/class-team-balanced-move";
import { swapClassTeamMembers } from "@/modules/projects/class-team-swap-model";
import { previewVersion } from "@/modules/projects/class-team-preview-token";
import {classTeamCreatorEmptyMessages} from "@/modules/projects/class-team-creator-empty-model";
import {canRefreshClassTeamRoster} from "@/modules/projects/class-team-roster-refresh-model";
import {isValidClassTeamBaseSlug} from "@/modules/projects/class-team-slug-model";
import {classTeamCreationFeedback} from "@/modules/projects/class-team-create-feedback-model";
import {mayBeginClassTeamCreation} from "@/modules/projects/class-team-create-once-model";
import {canEditClassTeamPlanner} from "@/modules/projects/class-team-edit-guard-model";
import type { AssignedProjectTemplateChoice } from "./project-create-control";

type ClassChoice = { id:string;name:string;code:string };
type Learner = {membershipId:string;rollNumber:string;displayName:string};
type Roster = {classId:string;className:string;revision:string;members:Learner[]};

export function ClassTeamWorkspaceCreator({collegeId,basePath,templates,initialTemplateId}:{
 collegeId:string;basePath:string;templates:readonly AssignedProjectTemplateChoice[];initialTemplateId?:string|null;
}) {
  const router=useRouter();
  const [classes,setClasses]=useState<ClassChoice[]>([]);
  const [classId,setClassId]=useState("");
  const [roster,setRoster]=useState<Roster|null>(null);
  const [templateId,setTemplateId]=useState(templates.some(t=>t.templateId===initialTemplateId)?initialTemplateId!:templates[0]?.templateId??"");
  const [mode,setMode]=useState<"TEAMS"|"WHOLE_CLASS"|"INDIVIDUAL">("TEAMS");
  const [order,setOrder]=useState<"ROLL"|"SHUFFLE">("ROLL");
  const [size,setSize]=useState(5);
  const [seed,setSeed]=useState("class-project");
  const [title,setTitle]=useState("");
  const [slug,setSlug]=useState("");
  const [groups,setGroups]=useState<ProjectTeam[]>([]);
  const [loading,setLoading]=useState(true);
  const [rosterLoading,setRosterLoading]=useState(false);
  const [rosterRefreshKey,setRosterRefreshKey]=useState(0);
  const [pending,setPending]=useState(false);
  const createInFlight=useRef(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [preflight,setPreflight]=useState<{toCreate:number;alreadyCovered:number;eligible:number;duplicates:number;
  items:{membershipId:string;status:"TO_CREATE"|"ALREADY_COVERED"|"DUPLICATE"}[]}|null>(null);
  const [outcome,setOutcome]=useState<{created:{projectId:string;title:string;learnerMembershipId:string}[];alreadyCovered:number;requested:number}|null>(null);
  const [prevCollegeId,setPrevCollegeId]=useState(collegeId);
  if(prevCollegeId!==collegeId){setPrevCollegeId(collegeId);setLoading(true);}
  useEffect(()=>{
    const controller=new AbortController();
    void fetch("/api/projects/class-team-classes?collegeId="+encodeURIComponent(collegeId),{signal:controller.signal})
      .then(async response=>{
        if(!response.ok)throw Error(await projectApiError(response));
        return response.json() as Promise<{classes:ClassChoice[]}>;
      }).then(body=>{if(!controller.signal.aborted)setClasses(body.classes);})
      .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Could not load classes");})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[collegeId]);
  const rosterKey=collegeId+"|"+classId+"|"+rosterRefreshKey;
  const [prevRosterKey,setPrevRosterKey]=useState(rosterKey);
  if(prevRosterKey!==rosterKey){
    setPrevRosterKey(rosterKey);
    setRoster(null);setGroups([]);
    if(classId){setRosterLoading(true);setError("");}
  }
  useEffect(()=>{
    if(!classId)return;
    const controller=new AbortController();
    void fetch("/api/projects/class-team-roster?collegeId="+encodeURIComponent(collegeId)+"&classId="+encodeURIComponent(classId),{signal:controller.signal})
      .then(async response=>{
        if(!response.ok)throw Error(await projectApiError(response));
        return response.json() as Promise<{roster:Roster}>;
      }).then(body=>{if(!controller.signal.aborted)setRoster(body.roster);})
      .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Could not load class roster");})
      .finally(()=>{if(!controller.signal.aborted)setRosterLoading(false);});
    return()=>controller.abort();
  },[collegeId,classId,rosterRefreshKey]);
  const [prevPlan,setPrevPlan]=useState({roster,mode,order,size,seed});
  if(prevPlan.roster!==roster||prevPlan.mode!==mode||prevPlan.order!==order||prevPlan.size!==size||prevPlan.seed!==seed){
    setPrevPlan({roster,mode,order,size,seed});
    if(!roster){setGroups([]);}
    else{
      try {
        setGroups(previewClassTeams({mode,order,teamSize:size,seed,students:roster.members.map(({membershipId,rollNumber})=>({membershipId,rollNumber}))}));
        setNotice("");
      } catch(e) {
        setGroups([]);
        setError(e instanceof Error?e.message:"Invalid team plan");
      }
    }
  }
  const preflightActive=mode==="INDIVIDUAL"&&Boolean(classId)&&Boolean(templateId);
  const [prevPreflightActive,setPrevPreflightActive]=useState(preflightActive);
  if(prevPreflightActive!==preflightActive){setPrevPreflightActive(preflightActive);if(!preflightActive)setPreflight(null);}
  useEffect(()=>{
    if(!preflightActive)return;
    const ctl=new AbortController();
    void fetch("/api/projects/cohort-preflight?collegeId="+encodeURIComponent(collegeId)+
      "&classId="+encodeURIComponent(classId)+"&templateId="+encodeURIComponent(templateId),
      {signal:ctl.signal}).then(r=>r.ok?r.json():Promise.reject(Error("Preflight failed")))
      .then((data:{toCreate:number;alreadyCovered:number;eligible:number;duplicates:number;items:{membershipId:string;status:"TO_CREATE"|"ALREADY_COVERED"|"DUPLICATE"}[]})=>{
        if(!ctl.signal.aborted)setPreflight(data);
      }).catch(()=>{if(!ctl.signal.aborted)setPreflight(null)});
    return ()=>ctl.abort();
  },[mode,collegeId,classId,templateId,roster]);
  const names=new Map(roster?.members.map(m=>[m.membershipId,m] as const)??[]);
  const plannerEditable=canEditClassTeamPlanner(pending,rosterLoading);
  const balanced=groups.length>0&&Math.max(...groups.map(g=>g.membershipIds.length))-Math.min(...groups.map(g=>g.membershipIds.length))<=1;
  const emptyMessages=classTeamCreatorEmptyMessages(loading,classes.length,templates.length,Boolean(error));
  async function create() {
    if(!mayBeginClassTeamCreation(createInFlight.current,Boolean(roster&&groups.length&&balanced&&!rosterLoading)))return;
    if(!roster)return;
    if(mode==="INDIVIDUAL"){
      if(!preflight)return;
      if(!window.confirm("Create "+preflight.toCreate+
        " workspaces? "+preflight.alreadyCovered+" already covered."))return;
    }
    createInFlight.current=true;
    let created=false;
    setPending(true);setError("");setNotice("");
    try {
      const result=await projectMutation("/api/projects/class-team-workspaces","POST",{
        collegeId,classId:roster.classId,templateId,rosterRevision:roster.revision,
        baseTitle:title.trim(),baseSlug:slug.trim(),teams:groups,cohortMode:mode==="INDIVIDUAL",expectedPreviewVersion:previewVersion(groups),
      }) as {created:{projectId:string;title:string;learnerMembershipId:string}[];alreadyCovered:number;requested:number};
      setOutcome(result);
      created=true;
      setNotice(result.created.length+" Project workspaces created.");
      if(mode!=="INDIVIDUAL"){
        if(result.created.length===1)router.push(basePath+"/"+result.created[0].projectId);
        else router.push(basePath);
      }
      router.refresh();
    } catch(e) {
      setError(classTeamCreationFeedback(e));
    } finally {
      // After a successful POST, keep Create locked until navigation unmounts this form.
      // Releasing the latch would allow a second request while router.push is pending.
      if(!created||mode==="INDIVIDUAL"){
        createInFlight.current=false;
        setPending(false);
      }
    }
  }
  return <div className="space-y-6">
    <p className="text-sm text-body">Choose one team, split a class into teams, or give each learner a workspace.</p>
    {mode==="TEAMS" ? <p className="rounded-md border border-border bg-surface p-3 text-sm text-body">Pick a class and a team size, preview the teams, move anyone between teams, then create. Each team gets its own workspace named after the title (“Title - Team 1”, “Title - Team 2”…), with the same template and mentor.</p> : null}
    {emptyMessages.classes?<p role="status" className="rounded-lg border border-border bg-surface p-4 text-sm text-body">{emptyMessages.classes}</p>:null}
    {emptyMessages.templates?<p role="alert" className="rounded-lg border border-border bg-surface p-4 text-sm text-body">{emptyMessages.templates}</p>:null}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="block space-y-1 text-sm font-medium">Class
        <Select value={classId} onChange={e=>setClassId(e.target.value)} disabled={loading||pending}>
          <option value="">{loading?"Loading classes…":"Select a class"}</option>
          {classes.map(c=><option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </Select>
      </label>
      <label className="block space-y-1 text-sm font-medium">Published template
        <Select value={templateId} onChange={e=>setTemplateId(e.target.value)} disabled={pending}>
          {templates.map(t=><option key={t.templateId} value={t.templateId}>{t.title} · v{t.version}</option>)}
        </Select>
      </label>
      <label className="block space-y-1 text-sm font-medium">Workspace title
        <Input value={title} disabled={!plannerEditable} onChange={e=>setTitle(e.target.value)} maxLength={170} placeholder="Capstone Project" />
      </label>
      <label className="block space-y-1 text-sm font-medium">Base slug
        <Input value={slug} disabled={!plannerEditable} onChange={e=>setSlug(e.target.value.toLowerCase())} maxLength={50} placeholder="capstone-project" aria-invalid={slug.length>0&&!isValidClassTeamBaseSlug(slug)} />
        {slug.length>0&&!isValidClassTeamBaseSlug(slug)?<span role="alert" className="block text-xs text-error">Use lowercase letters, numbers and single hyphens only. Start and end with a letter or number.</span>:null}
      </label>
      <label className="block space-y-1 text-sm font-medium">Workspace mode
        <Select value={mode} disabled={!plannerEditable} onChange={e=>setMode(e.target.value as "TEAMS"|"WHOLE_CLASS"|"INDIVIDUAL")}>
          <option value="WHOLE_CLASS">One team</option>
          <option value="TEAMS">Split a class into teams</option>
          <option value="INDIVIDUAL">One workspace per student</option>
        </Select>
      </label>
      {mode==="TEAMS"?<>
        <label className="block space-y-1 text-sm font-medium">Preferred team size
          <Input type="number" min={1} max={100} value={size} disabled={!plannerEditable} onChange={e=>setSize(Number(e.target.value))} />
        </label>
        <label className="block space-y-1 text-sm font-medium">Grouping order
          <Select value={order} disabled={!plannerEditable} onChange={e=>setOrder(e.target.value as "ROLL"|"SHUFFLE")}>
            <option value="ROLL">Roll number</option>
            <option value="SHUFFLE">Seeded shuffle</option>
          </Select>
        </label>
        {order==="SHUFFLE"?<label className="block space-y-1 text-sm font-medium">Shuffle seed
          <Input value={seed} disabled={!plannerEditable} onChange={e=>setSeed(e.target.value)} maxLength={128}/>
        </label>:null}
      </>:null}
    </div>
    {classId?<div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" disabled={!canRefreshClassTeamRoster(classId,rosterLoading,pending)}
        onClick={()=>setRosterRefreshKey(value=>value+1)}>Refresh class roster</Button>
      <p className="text-xs text-muted-foreground">Refresh after enrollment changes or a stale preview before retrying creation.</p>
    </div>:null}
    {rosterLoading?<p role="status">Loading current class roster…</p>:null}
    {roster?<p className="text-sm text-muted-foreground">{roster.className} · {roster.members.length} active learners · {groups.length} {mode==="TEAMS"?"teams":"group"}</p>:null}
    {mode==="INDIVIDUAL"&&preflight?<section aria-label="Before creating: one workspace per student" className="rounded-lg border border-border p-3 text-sm">
      <h2 className="font-semibold">Before creating: one workspace per student</h2>
      <p>{preflight.toCreate} to create · {preflight.alreadyCovered} already covered · {preflight.duplicates} duplicates · {preflight.eligible} eligible</p>
      <div className="max-h-72 overflow-y-auto rounded-md border" role="region" aria-label="Learner creation preflight details" tabIndex={0}>
        <table className="w-full text-left text-xs">
          <thead><tr><th scope="col" className="p-2">Learner</th><th scope="col" className="p-2">Decision</th></tr></thead>
          <tbody>{preflight.items.map((row,index)=>{
            const learner=names.get(row.membershipId);
            const decision=row.status==="TO_CREATE"?"To create":row.status==="ALREADY_COVERED"?"Already covered":"Duplicate";
            return <tr key={row.membershipId+"-"+index} className="border-t">
              <td className="p-2">{learner?.displayName??learner?.rollNumber??"Learner"}{learner?.rollNumber?" · "+learner.rollNumber:""}</td>
              <td className="p-2">{decision}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">The server will recheck class enrollment, duplicates and existing workspaces before it creates anything. Already covered learners are skipped.</p>
    </section>:null}
    {groups.length>0?<div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2" aria-label="Adjustable team preview">
      {groups.map((team,index)=><section key={index} className="min-w-0 rounded-lg border border-border p-3">
        <h2 className="font-semibold">{team.name} · {team.membershipIds.length}</h2>
        <ul className="mt-2 space-y-2">{team.membershipIds.map(id=>{
          const learner=names.get(id);
          return <li key={id} className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 break-words">{learner?.rollNumber??"—"} · {learner?.displayName??"Learner"}</span>
            {groups.length>1?<label className="min-w-24 text-xs">Team
              <Select aria-label={"Move "+(learner?.displayName??"learner")+" to team"} disabled={!plannerEditable} value={index} onChange={event=>{
                try{const updated=moveMemberBalanced(groups,id,Number(event.target.value));setGroups(updated);setError("");}
                catch(e){setError(e instanceof Error?e.message:"Cannot move learner");}
              }}>
                {groups.map((g,i)=><option key={i} value={i}>{g.name}</option>)}
              </Select>
            </label>:null}
            {groups.length>1?<label className="min-w-24 text-xs">Swap with
              <Select aria-label={"Swap "+(learner?.displayName??"learner")+" with learner in team"} disabled={!plannerEditable} value="" onChange={event=>{
                const other=groups[Number(event.target.value)]?.membershipIds[0];
                if(!other)return;
                try{setGroups(swapClassTeamMembers(groups,id,other));setError("");}
                catch(e){setError(e instanceof Error?e.message:"Cannot swap learners");}
              }}>
                <option value="">Choose team</option>
                {groups.map((g,i)=>i===index?null:<option key={i} value={i}>{g.name} (first learner)</option>)}
              </Select>
            </label>:null}
          </li>;
        })}</ul>
      </section>)}
    </div>:null}
    {!balanced&&groups.length>0?<p role="alert" className="text-sm text-error">Teams must have sizes differing by at most one.</p>:null}
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    {notice?<p role="status" className="text-sm">{notice}</p>:null}
    {outcome&&mode==="INDIVIDUAL"?<section className="space-y-2 rounded-lg border border-border p-4">
      <h3 className="font-semibold">Latest cohort creation outcome</h3>
      <p className="text-sm">{outcome.created.length} created · {outcome.alreadyCovered} already covered</p>
      <p role="status" className="text-sm">{outcome.created.length===0
        ? "No workspaces were created — the selected class may have no active learners."
        : outcome.created.length<outcome.requested-outcome.alreadyCovered
          ? outcome.created.length+" workspace(s) created; "+(outcome.requested-outcome.alreadyCovered-outcome.created.length)+" student(s) failed. Review or export the report below before retrying."
          : "Created "+outcome.created.length+" workspace(s) for the class roster."}</p>
      <button type="button" className="text-sm font-semibold text-primary-text underline"
        onClick={()=>{
          const rows=["Workspace,Student membership,Project ID",
            ...outcome.created.map(item=>[item.title,item.learnerMembershipId,item.projectId]
             .map(value=>'"'+value.replaceAll('"','""')+'"').join(","))];
          const blob=new Blob(["\uFEFF"+rows.join("\r\n")],{type:"text/csv;charset=utf-8"});
          const url=URL.createObjectURL(blob),link=document.createElement("a");
          link.href=url;link.download="cohort-creation-outcome.csv";link.click();URL.revokeObjectURL(url);
        }}>Export outcome CSV</button>
    </section>:null}
    <div className="flex flex-wrap justify-end gap-3">
      <Button variant="secondary" disabled={pending} onClick={()=>router.push(basePath)}>Cancel</Button>
      <Button disabled={pending||!balanced||!title.trim()||!isValidClassTeamBaseSlug(slug)||!templateId||!roster||rosterLoading} onClick={()=>void create()}>
        {pending?"Creating workspaces…":mode==="TEAMS"?"Create team workspaces":mode==="INDIVIDUAL"?"Create "+(preflight?.toCreate??0)+" workspaces":"Create whole-class workspace"}
      </Button>
    </div>
  </div>;
}
