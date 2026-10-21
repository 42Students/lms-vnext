"use client";
import { EmptyState } from "@/components/ui/empty-state";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useProjectEditorDiscardGuard } from "./project-editor-discard-guard";
import { projectApiError, projectMutation } from "./project-api";
import { previewClassTeams, type ProjectTeam } from "@/modules/projects/class-team-split-model";
import { moveMemberBalanced } from "@/modules/projects/class-team-balanced-move";
import { swapClassTeamMembers } from "@/modules/projects/class-team-swap-model";
import { previewVersion } from "@/modules/projects/class-team-preview-token";
import {classTeamCreationOutcomeCsv,type ClassTeamCreationResultRow} from "@/modules/projects/class-team-creation-outcome-export";
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
type CohortCreationOutcome={
 created:{projectId:string;title:string;learnerMembershipId:string}[];
 alreadyCovered:number;requested:number;
 individualResults:{membershipId:string;status:"CREATED"|"ALREADY_COVERED";projectId:string|null;title:string|null}[];
 batchMode?:"ATOMIC";failedCount?:number;committed?:boolean;
};


export function ClassTeamWorkspaceCreator({collegeId,userId,basePath,templates,initialTemplateId}:{
 collegeId:string;userId:string;basePath:string;templates:readonly AssignedProjectTemplateChoice[];
 initialTemplateId?:string|null;
}) {
  const router=useRouter();
  const {showToast}=useToast();
  const [classes,setClasses]=useState<ClassChoice[]>([]);
  const [classQuery,setClassQuery]=useState("");
  const [classesRetry,setClassesRetry]=useState(0);
  const [classId,setClassId]=useState("");
  const [roster,setRoster]=useState<Roster|null>(null);
  const [templateId,setTemplateId]=useState(templates.some(t=>t.templateId===initialTemplateId)?initialTemplateId!:templates[0]?.templateId??"");
  const [mode,setMode]=useState<"TEAMS"|"WHOLE_CLASS"|"INDIVIDUAL">("TEAMS");
  const [order,setOrder]=useState<"ROLL"|"SHUFFLE">("ROLL");
  const [size,setSize]=useState(5);
  const [seed,setSeed]=useState("class-project");
  const [title,setTitle]=useState("");
  const [summary,setSummary]=useState("");
  const [slug,setSlug]=useState("");
  const [slugEdited,setSlugEdited]=useState(false);
  const [primaryMentorMembershipId,setPrimaryMentorMembershipId]=useState("");
  const [mentorQuery,setMentorQuery]=useState("");
  const [mentors,setMentors]=useState<{membershipId:string;displayName:string;email:string}[]>([]);
  const [mentorsLoading,setMentorsLoading]=useState(false);
  const [mentorsError,setMentorsError]=useState("");
  const [initialStatus,setInitialStatus]=useState<"PLANNED"|"ACTIVE">("PLANNED");
  const [groups,setGroups]=useState<ProjectTeam[]>([]);
  const [loading,setLoading]=useState(true);
  const [rosterLoading,setRosterLoading]=useState(false);
  const [rosterRefreshKey,setRosterRefreshKey]=useState(0);
  const [pending,setPending]=useState(false);
  const createInFlight=useRef(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [preflight,setPreflight]=useState<{toCreate:number;alreadyCovered:number;eligible:number;duplicates:number;
  items:{membershipId:string;status:"TO_CREATE"|"ALREADY_COVERED"|"DUPLICATE"}[];scopeKey:string}|null>(null);
  const [outcome,setOutcome]=useState<CohortCreationOutcome|null>(null);
  const [unconfirmedRows,setUnconfirmedRows]=useState<ClassTeamCreationResultRow[]>([]);
  const [outcomeCheckedAt,setOutcomeCheckedAt]=useState<string|null>(null);
  const [preflightLoading,setPreflightLoading]=useState(false);
  const [preflightError,setPreflightError]=useState("");
  const [outcomeRestored,setOutcomeRestored]=useState(false);
  const [prevCollegeId,setPrevCollegeId]=useState(collegeId);
  const reportKey="lms-project-cohort-report:"+collegeId;
  // A cohort report is recoverable for seven days after navigating away, and
  // never shared with another college's selected workspace.
  useEffect(()=>{
    setOutcome(null);setOutcomeRestored(false);
    try{
      const raw=window.localStorage.getItem(reportKey);
      if(!raw)return;
      const saved=JSON.parse(raw) as {expiresAt?:number;report?:CohortCreationOutcome};
      if(!saved.expiresAt||saved.expiresAt<Date.now()||!saved.report||
        !Array.isArray(saved.report.individualResults)){
        window.localStorage.removeItem(reportKey);return;
      }
      setOutcome(saved.report);setOutcomeRestored(true);
    }catch{
      // Storage can be disabled in private browsing; creation still works.
    }
  },[reportKey]);
  if(prevCollegeId!==collegeId){setPrevCollegeId(collegeId);setLoading(true);}
  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true);
    const timer=window.setTimeout(()=>{
      void fetch("/api/projects/class-team-classes?collegeId="+encodeURIComponent(collegeId)+
        "&q="+encodeURIComponent(classQuery.trim())+"&limit=100",
        {signal:controller.signal,cache:"no-store"})
        .then(async response=>{
          if(!response.ok)throw Error(await projectApiError(response));
          return response.json() as Promise<{classes:ClassChoice[]}>;
        }).then(body=>{if(!controller.signal.aborted){
          setClasses(previous=>{
            const selected=previous.find(item=>item.id===classId);
            return selected&&!body.classes.some(item=>item.id===selected.id)
              ?[selected,...body.classes]:body.classes;
          });
          setError("");
        }})
        .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Could not load classes");})
        .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    },400);
    return()=>{window.clearTimeout(timer);controller.abort();};
  },[collegeId,classId,classQuery,classesRetry]);
  useEffect(()=>{
    const ctl=new AbortController();
    setMentorsLoading(true);setMentorsError("");
    const timer=window.setTimeout(()=>{
      void fetch("/api/projects/mentor-candidates?collegeId="+encodeURIComponent(collegeId)+
        "&q="+encodeURIComponent(mentorQuery.trim())+"&limit=100",
        {cache:"no-store",signal:ctl.signal})
        .then(async response=>{
          if(!response.ok)throw new Error("Could not search eligible mentors.");
          return response.json() as Promise<{mentors:typeof mentors}>;
        })
        .then(result=>{if(!ctl.signal.aborted)setMentors(previous=>{
          const selected=previous.find(row=>row.membershipId===primaryMentorMembershipId);
          return selected&&!result.mentors.some(row=>row.membershipId===selected.membershipId)
            ?[selected,...result.mentors]:result.mentors;
        });})
        .catch(e=>{if(!ctl.signal.aborted)
          setMentorsError(e instanceof Error?e.message:"Could not load mentors.");
        }).finally(()=>{if(!ctl.signal.aborted)setMentorsLoading(false);});
    },400);
    return()=>{window.clearTimeout(timer);ctl.abort();};
  },[collegeId,mentorQuery,primaryMentorMembershipId]);

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
  const preflightScopeKey=collegeId+":"+classId+":"+templateId+":"+(roster?.revision??"");
  const currentPreflight=preflight?.scopeKey===preflightScopeKey?preflight:null;
  const preflightActive=mode==="INDIVIDUAL"&&Boolean(classId)&&Boolean(templateId);
  const [prevPreflightActive,setPrevPreflightActive]=useState(preflightActive);
  if(prevPreflightActive!==preflightActive){setPrevPreflightActive(preflightActive);if(!preflightActive)setPreflight(null);}
  type PreflightResult = {
    toCreate:number;alreadyCovered:number;eligible:number;duplicates:number;
    items:{membershipId:string;status:"TO_CREATE"|"ALREADY_COVERED"|"DUPLICATE"}[];
  };
  async function fetchPreflight(signal?:AbortSignal):Promise<PreflightResult>{
    const response=await fetch("/api/projects/cohort-preflight?collegeId="+encodeURIComponent(collegeId)+
      "&classId="+encodeURIComponent(classId)+"&templateId="+encodeURIComponent(templateId),
      {signal,cache:"no-store"});
    if(!response.ok)throw Error(await projectApiError(response));
    return await response.json() as PreflightResult;
  }
  useEffect(()=>{
    if(!preflightActive)return;
    const ctl=new AbortController();
    setPreflightLoading(true);setPreflightError("");
    void fetchPreflight(ctl.signal)
      .then(data=>{if(!ctl.signal.aborted)setPreflight({...data,scopeKey:preflightScopeKey});})
      .catch(e=>{if(!ctl.signal.aborted){
        setPreflight(null);setPreflightError(e instanceof Error?e.message:"Preflight failed. Nothing was created.");
      }})
      .finally(()=>{if(!ctl.signal.aborted)setPreflightLoading(false);});
    return ()=>ctl.abort();
  },[preflightActive,collegeId,classId,templateId,roster,preflightScopeKey]);
  const names=new Map(roster?.members.map(m=>[m.membershipId,m] as const)??[]);
  const plannerEditable=canEditClassTeamPlanner(pending,rosterLoading);
  const dirty=Boolean(classId||title.trim()||slug.trim()||summary.trim()||
    primaryMentorMembershipId||mentorQuery.trim()||initialStatus!=="PLANNED"||
    mode!=="TEAMS"||order!=="ROLL"||size!==5||seed!=="class-project");
  const discard=useProjectEditorDiscardGuard(true,dirty,pending,()=>router.push(basePath));
  const balanced=groups.length>0&&Math.max(...groups.map(g=>g.membershipIds.length))-Math.min(...groups.map(g=>g.membershipIds.length))<=1;
  const emptyMessages=classTeamCreatorEmptyMessages(loading,classes.length,templates.length,Boolean(error));
  async function create() {
    if(!mayBeginClassTeamCreation(createInFlight.current,Boolean(roster&&groups.length&&balanced&&!rosterLoading)))return;
    if(!roster)return;
    if(initialStatus==="ACTIVE"&&!primaryMentorMembershipId){
      setError("A mentor is required before a workspace can be Active");return;
    }
    if(title.trim().length>160){
      setError("Title must be 160 characters or fewer");return;
    }
    if(!title.trim()){
      setError("Title is required");return;
    }
    if(!classId){
      setError(mode==="INDIVIDUAL"?"Pick the class to create one workspace per student.":
        "Pick the class to split into teams.");return;
    }
    createInFlight.current=true;
    let created=false;
    setPending(true);setError("");setNotice("");
    try {
      if(mode==="INDIVIDUAL"){
        // Revalidate immediately before the confirmation: counts from an earlier
        // GET are informational only, never the basis of creation.
        setPreflightLoading(true);
        const fresh=await fetchPreflight();
        setPreflightLoading(false);
        setPreflight({...fresh,scopeKey:preflightScopeKey});
        if(fresh.toCreate===0){
          setNotice("Nothing was created. All eligible learners are already covered.");
          return;
        }
        if(!window.confirm("Create "+fresh.toCreate+
          " workspaces? "+fresh.alreadyCovered+" already covered."))return;
      }
      const result=await projectMutation("/api/projects/class-team-workspaces","POST",{
        collegeId,classId:roster.classId,templateId,rosterRevision:roster.revision,
        baseTitle:title.trim(),baseSlug:slug.trim(),summary:summary.trim()||undefined,
        primaryMentorMembershipId:primaryMentorMembershipId||undefined,initialStatus,
        teams:groups,cohortMode:mode==="INDIVIDUAL",expectedPreviewVersion:previewVersion(groups),
      }) as CohortCreationOutcome;
      if(result.batchMode==="ATOMIC"&&result.committed!==true)
        throw new Error("Creation was not committed. Refresh the roster before retrying.");
      setOutcome(result);
      setOutcomeRestored(false);
      if(mode==="INDIVIDUAL"){
        try{
          window.localStorage.setItem(reportKey,JSON.stringify({
            expiresAt:Date.now()+7*24*60*60*1000,report:result,
          }));
        }catch{
          showToast({tone:"info",title:"Creation report could not be saved",
            description:"Export the displayed learner results before leaving this page."});
        }
      }
      created=true;
      if(result.created.length===0){
        setNotice("Nothing was created. Check existing workspaces before retrying.");
        showToast({tone:"info",title:"Nothing was created",
          description:"All matching workspaces may already exist. Review the cohort report before retrying."});
      }else{
        setNotice(result.created.length+" Project workspaces created.");
        showToast({tone:"success",title:result.created.length===1?
          "Workspace created":"Workspaces created",
          description:result.created.length+" Project workspaces created."});
      }
      if(mode==="INDIVIDUAL" && result.created.length < result.requested-result.alreadyCovered){
        setNotice("Some workspaces were not created. Review the learner outcome report before retrying.");
      }
      if(mode!=="INDIVIDUAL"){
        if(result.created.length===1)router.push(basePath+"/"+result.created[0].projectId);
        else router.push(basePath);
      }
      router.refresh();
    } catch(e) {
      const failure=classTeamCreationFeedback(e);
      setError("Nothing was created. "+failure);
      showToast({tone:"error",title:"Nothing was created",description:failure});
    } finally {
      setPreflightLoading(false);
      // After a successful POST, keep Create locked until navigation unmounts this form.
      // Releasing the latch would allow a second request while router.push is pending.
      if(!created||mode==="INDIVIDUAL"){
        createInFlight.current=false;
        setPending(false);
      }
    }
  }
  return <div className="min-w-0 space-y-4 md:space-y-5">
    <p className="text-sm text-body leading-[22px]">Choose one team, split a class into teams, or give each learner a workspace.</p>
    <a href={basePath+"/create"} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">
      Create a single workspace instead
    </a>
    {mode==="TEAMS" ? <p className="border-l-2 border-border pl-3 text-sm text-body leading-[22px]">Pick a class and a team size, preview the teams, move anyone between teams, then create. Each team gets its own workspace named after the title (“Title - Team 1”, “Title - Team 2”…), with the same template and mentor.</p> : null}
    {emptyMessages.classes?<p role="status" className="border-b border-border py-3 text-sm text-body leading-[22px]">{emptyMessages.classes}</p>:null}
    {emptyMessages.templates?<p role="alert" className="border-b border-border py-3 text-sm text-body leading-[22px]">{emptyMessages.templates}</p>:null}
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
      <label className="block space-y-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class
        <Input type="search" aria-label="Find a class" placeholder="Search class name or code"
          value={classQuery} maxLength={120} disabled={pending}
          onChange={event=>setClassQuery(event.target.value)} />
        <Select value={classId} onChange={e=>setClassId(e.target.value)} disabled={loading||pending}>
          <option value="">{loading?"Loading classes…":"Select a class"}</option>
          {classes.map(c=><option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </Select>
        {!classId&&!loading?<span className="block text-xs text-warning">
          {mode==="INDIVIDUAL"?"Pick the class to create one workspace per student.":"Pick the class to split into teams."}
        </span>:null}
        {error&&classes.length===0?<Button variant="secondary" size="sm" type="button"
          onClick={()=>setClassesRetry(v=>v+1)}>Retry class search</Button>:null}
      </label>
      <label className="block space-y-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Published template
        <Select value={templateId} onChange={e=>setTemplateId(e.target.value)} disabled={pending}>
          {templates.map(t=><option key={t.templateId} value={t.templateId}>{t.title} · v{t.version}</option>)}
        </Select>
      </label>
      <label className="block space-y-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Workspace title
        <Input aria-invalid={Boolean(classId&&!title.trim())} value={title} disabled={!plannerEditable}
          onChange={event=>{
            const next=event.target.value;
            setTitle(next);
            if(!slugEdited)setSlug(next.toLowerCase().normalize("NFKD")
              .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")
              .replace(/^-|-$/g,"").slice(0,50).replace(/-$/g,""));
          }}
          maxLength={160} placeholder="Campus Event Coordination" />
        <span className="text-xs text-body">{title.length}/160</span>
        {classId&&!title.trim()?<span role="alert" className="text-xs text-error">Title is required</span>:null}
      </label>
      <label className="block space-y-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Base slug
        <Input value={slug} disabled={!plannerEditable} onChange={e=>{setSlugEdited(true);setSlug(e.target.value.toLowerCase());}} maxLength={50} placeholder="capstone-project" aria-invalid={slug.length>0&&!isValidClassTeamBaseSlug(slug)} />
        {slug.length>0&&!isValidClassTeamBaseSlug(slug)?<span role="alert" className="block text-xs text-error">Use lowercase letters, numbers and single hyphens only. Start and end with a letter or number.</span>:null}
      </label>
      <label className="block space-y-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2">Summary
        <Textarea value={summary} disabled={!plannerEditable} maxLength={2000}
          placeholder="Optional context for every workspace"
          onChange={event=>setSummary(event.target.value)}/>
      </label>
      <label className="block space-y-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Primary mentor
        <Input type="search" value={mentorQuery} maxLength={120} disabled={pending}
          aria-label="Search project mentors" placeholder="Search mentors by name or email"
          onChange={event=>setMentorQuery(event.target.value)}/>
        <Select value={primaryMentorMembershipId} disabled={pending||mentorsLoading}
          onChange={event=>setPrimaryMentorMembershipId(event.target.value)}>
          <option value="">Assign later</option>
          {mentors.map(row=><option key={row.membershipId} value={row.membershipId}>
            {row.displayName} · {row.email}
          </option>)}
        </Select>
        {mentorsLoading?<span className="text-xs text-body">Loading mentors…</span>:null}
        {mentorsError?<span role="alert" className="text-xs text-error">{mentorsError}</span>:null}
      </label>
      <label className="block space-y-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
        <Select value={initialStatus} disabled={pending}
          onChange={event=>setInitialStatus(event.target.value as "PLANNED"|"ACTIVE")}>
          <option value="PLANNED">Planned</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED" disabled>Archived (use Archive after creation)</option>
        </Select>
        {initialStatus==="ACTIVE"&&!primaryMentorMembershipId?
          <span role="alert" className="text-xs text-error">
            A mentor is required before a workspace can be Active
          </span>:null}
      </label>
      <label className="block space-y-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Workspace mode
        <Select value={mode} disabled={!plannerEditable} onChange={e=>setMode(e.target.value as "TEAMS"|"WHOLE_CLASS"|"INDIVIDUAL")}>
          <option value="WHOLE_CLASS">One team</option>
          <option value="TEAMS">Split a class into teams</option>
          <option value="INDIVIDUAL">One workspace per student</option>
        </Select>
      </label>
      {mode==="TEAMS"?<>
        <label className="block space-y-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Preferred team size
          <Input type="number" min={1} max={100} value={size} disabled={!plannerEditable} onChange={e=>setSize(Number(e.target.value))} />
        </label>
        <label className="block space-y-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Grouping order
          <Select value={order} disabled={!plannerEditable} onChange={e=>setOrder(e.target.value as "ROLL"|"SHUFFLE")}>
            <option value="ROLL">Roll number</option>
            <option value="SHUFFLE">Seeded shuffle</option>
          </Select>
        </label>
        {order==="SHUFFLE"?<label className="block space-y-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Shuffle seed
          <Input value={seed} disabled={!plannerEditable} onChange={e=>setSeed(e.target.value)} maxLength={128}/>
        </label>:null}
      </>:null}
    </div>
    {classId?<div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <Button variant="secondary" className="min-h-11 w-full sm:min-h-9 sm:w-auto" disabled={!canRefreshClassTeamRoster(classId,rosterLoading,pending)}
        onClick={()=>setRosterRefreshKey(value=>value+1)}>Refresh class roster</Button>
      <p className="text-xs text-muted-foreground leading-[20px]">Refresh after enrollment changes or a stale preview before retrying creation.</p>
    </div>:null}
    {rosterLoading?<p role="status">Loading current class roster…</p>:null}
    {roster?<p className="text-sm text-muted-foreground leading-[22px]">{roster.className} · {roster.members.length} active learners · {groups.length} {mode==="TEAMS"?"teams":"group"}</p>:null}
    {mode==="INDIVIDUAL"&&preflightLoading?<p role="status" className="text-sm text-body">Checking learner creation eligibility…</p>:null}
    {mode==="INDIVIDUAL"&&preflightError?<div role="alert" className="border-l-2 border-error p-3 text-sm">
      <p>Preflight could not be loaded. Nothing was created. {preflightError}</p>
      <Button size="sm" variant="secondary" onClick={()=>setRosterRefreshKey(v=>v+1)}>Retry preflight</Button>
    </div>:null}
    {mode==="INDIVIDUAL"&&currentPreflight?<section aria-label="Before creating: one workspace per student" className="border-b border-border pb-5 text-sm">
      <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Before creating: one workspace per student</h2>
      <p>{currentPreflight.toCreate} to create · {currentPreflight.alreadyCovered} already covered · {currentPreflight.duplicates} duplicates · {currentPreflight.eligible} eligible</p>
      <div className="max-h-72 min-w-0 overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" role="region" aria-label="Learner creation preflight details" tabIndex={0}>
        <DataTable
          caption="Learner creation preflight"
          rows={currentPreflight.items.map((row,index)=>({...row,index}))}
          getRowKey={row=>row.membershipId+"-"+row.index}
          columns={[
            {key:"learner",header:"Learner",mobilePriority:"primary",cell:row=>{
              const learner=names.get(row.membershipId);
              return <>{learner?.displayName??learner?.rollNumber??"Learner"}{learner?.rollNumber?" · "+learner.rollNumber:""}</>;
            }},
            {key:"decision",header:"Decision",mobilePriority:"secondary",cell:row=>
              row.status==="TO_CREATE"?"To create":row.status==="ALREADY_COVERED"?"Already covered":"Duplicate"},
          ]}
          empty={<EmptyState title="No eligible learners" description="No eligible learners in this preview." />}
        />
      </div>
      <p className="text-xs text-muted-foreground leading-[20px]">The server will recheck class enrollment, duplicates and existing workspaces before it creates anything. Already covered learners are skipped.</p>
    </section>:null}
    {groups.length>0?<div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2" aria-label="Adjustable team preview">
      {groups.map((team,index)=><section key={index} className="min-w-0 border-b border-[var(--lms-canvas-border)] py-3">
        <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">{team.name} · {team.membershipIds.length}</h2>
        <ul className="mt-2 space-y-2">{team.membershipIds.map(id=>{
          const learner=names.get(id);
          return <li key={id} className="flex min-w-0 flex-col gap-2 border-t border-border py-2 text-sm md:flex-row md:flex-wrap md:items-center">
            <span className="min-w-0 flex-1 break-words">{learner?.rollNumber??"—"} · {learner?.displayName??"Learner"}</span>
            {groups.length>1?<label className="block min-w-0 md:w-36 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Team
              <Select aria-label={"Move "+(learner?.displayName??"learner")+" to team"} disabled={!plannerEditable} value={index} onChange={event=>{
                try{const updated=moveMemberBalanced(groups,id,Number(event.target.value));setGroups(updated);setError("");}
                catch(e){setError(e instanceof Error?e.message:"Cannot move learner");}
              }}>
                {groups.map((g,i)=><option key={i} value={i}>{g.name}</option>)}
              </Select>
            </label>:null}
            {groups.length>1?<label className="block min-w-0 md:w-36 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Swap with
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
    {!balanced&&groups.length>0?<p role="alert" className="text-sm text-error leading-[22px]">Teams must have sizes differing by at most one.</p>:null}
    {error?<p role="alert" className="text-sm text-error leading-[22px]">{error}</p>:null}
    {notice?<p role="status" className="text-sm leading-[22px]">{notice}</p>:null}
    {outcome&&mode==="INDIVIDUAL"?<section className="space-y-2 border-b border-border pb-5">
      <h3 className="font-semibold">{outcomeRestored?
        "Restored cohort creation outcome":"Latest cohort creation outcome"}</h3>
      {outcomeRestored?<p className="text-xs text-body">
        This report was kept for seven days on this device for the selected college.
      </p>:null}
      <p className="text-sm leading-[22px]">{outcome.created.length} created · {outcome.alreadyCovered} already covered</p>
      {outcomeCheckedAt?<p className="text-xs text-body">Reported at {new Date(outcomeCheckedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p>:null}
      <p role="status" className="text-sm leading-[22px]">{outcome.created.length===0
        ? "No workspaces were created — the selected class may have no active learners."
        : outcome.created.length<outcome.requested-outcome.alreadyCovered
          ? outcome.created.length+" workspace(s) created; "+(outcome.requested-outcome.alreadyCovered-outcome.created.length)+" student(s) failed. Review or export the report below before retrying."
          : "Created "+outcome.created.length+" workspace(s) for the class roster."}</p>
      <div className="max-h-72 overflow-auto overscroll-contain [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" role="region" aria-label="Per-learner creation results" tabIndex={0}>
        <DataTable
          caption="Individual workspace creation results"
          rows={outcome.individualResults}
          getRowKey={row=>row.membershipId}
          columns={[
            {key:"learner",header:"Learner",mobilePriority:"primary",cell:row=>names.get(row.membershipId)?.displayName??row.membershipId},
            {key:"result",header:"Result",mobilePriority:"secondary",cell:row=>row.status==="CREATED"?"Created":"Already covered"},
            {key:"workspace",header:"Workspace",mobilePriority:"secondary",cell:row=>row.title??"Existing workspace"},
          ]}
          empty={<EmptyState title="No individual results" description="No individual results recorded." />}
        />
      </div>
      <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
        onClick={()=>{
          let url:string|null=null;
          let link:HTMLAnchorElement|null=null;
          try {
            const csv=classTeamCreationOutcomeCsv(outcome.individualResults,names);
            const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
            url=URL.createObjectURL(blob);
            link=document.createElement("a");
            link.href=url;
            link.download="cohort-creation-outcome.csv";
            document.body.appendChild(link);
            link.click();
          } catch {
            setError("Could not export outcome CSV. Review the displayed results and try again.");
          } finally {
            link?.remove();
            const disposableUrl=url;
            if(disposableUrl)window.setTimeout(()=>URL.revokeObjectURL(disposableUrl),0);
          }
        }}>Export outcome CSV</Button>
    </section>:null}
    {mode==="INDIVIDUAL"&&unconfirmedRows.length>0?<section className="space-y-3 border-y border-warning-border py-4">
      <h3 className="font-semibold text-foreground">Learner creation results not confirmed</h3>
      <p role="alert" className="text-sm text-body">
        These are not confirmed failures. The request may have succeeded before its response was lost.
        Refresh the preflight and check existing workspaces before retrying.
      </p>
      <DataTable caption="Unconfirmed learner creation"
        rows={unconfirmedRows} getRowKey={row=>row.membershipId}
        columns={[
          {key:"learner",header:"Learner",mobilePriority:"primary",
            cell:row=>names.get(row.membershipId)?.displayName??row.membershipId},
          {key:"status",header:"Result",mobilePriority:"secondary",
            cell:()=> "Not confirmed"},
          {key:"reason",header:"Reason",mobilePriority:"secondary",
            cell:row=>row.reason??"Response unavailable"},
        ]}/>
      <Button type="button" variant="secondary" onClick={()=>{
        try{
          const csv=classTeamCreationOutcomeCsv(unconfirmedRows,names);
          const url=URL.createObjectURL(new Blob(["\\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
          const link=document.createElement("a");
          link.href=url;link.download="cohort-unconfirmed-outcome.csv";
          document.body.appendChild(link);link.click();link.remove();
          window.setTimeout(()=>URL.revokeObjectURL(url),0);
        }catch{
          setError("Could not export the unconfirmed outcome. Review the rows shown above.");
        }
      }}>Export unconfirmed results</Button>
    </section>:null}
    <div className="sticky bottom-0 z-10 flex min-w-0 flex-col-reverse gap-3 border-t border-border bg-surface py-3 md:flex-row md:flex-wrap md:justify-end">
      <Button variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto"
        disabled={pending} onClick={discard.requestClose}>Cancel</Button>
      <Button className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={pending||!balanced||!title.trim()||!isValidClassTeamBaseSlug(slug)||!templateId||!roster||rosterLoading||(mode==="INDIVIDUAL"&&!currentPreflight)} onClick={()=>void create()}>
        {pending?"Creating workspaces…":mode==="TEAMS"?"Create team workspaces":mode==="INDIVIDUAL"?"Create "+(currentPreflight?.toCreate??0)+" workspaces":"Create whole-class workspace"}
      </Button>
    </div>
    <ConfirmDialog open={discard.discardOpen} onOpenChange={discard.setDiscardOpen}
      title="Discard unsaved changes?"
      description="Leave this workspace plan and discard its unsaved changes?"
      confirmLabel="Discard changes" pending={pending}
      onConfirm={discard.confirmDiscard} />
  </div>;
}
