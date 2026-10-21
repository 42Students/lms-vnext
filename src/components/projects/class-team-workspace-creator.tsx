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
import {projectWorkspaceCsvCell} from "@/modules/projects/admin-workspace-page-export-model";
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

/** Keep the three-column legacy cohort export for downstream audit imports.
 * Detailed learner membership and recovery information stays in the on-screen
 * report and can be exported separately if a reconciliation is needed.
 */
function legacyCohortOutcomeCsv(rows:readonly ClassTeamCreationResultRow[]):string{
  const values=[["Outcome","Workspace ID","Details"],...rows.map(row=>[
    row.status==="CREATED"?"Created":row.status==="ALREADY_COVERED"?"Already covered":"Not confirmed",
    row.projectId??"",row.reason??row.title??row.membershipId,
  ])];
  return values.map(columns=>columns.map(projectWorkspaceCsvCell).join(",")).join("\r\n")+"\r\n";
}
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
  const [templateQuery,setTemplateQuery]=useState("");
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
  const [preflightPage,setPreflightPage]=useState(1);
  const [resultPage,setResultPage]=useState(1);
  const [groupRowLimits,setGroupRowLimits]=useState<Record<number,number>>({});
  const [createConfirmation,setCreateConfirmation]=useState<{
    count:number;alreadyCovered:number;eligible:number;duplicates:number;rosterCount:number;
    rows:{membershipId:string;name:string}[];
  }|null>(null);
  const confirmCreation=useRef<((confirmed:boolean)=>void)|null>(null);
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
      const saved=JSON.parse(raw) as {expiresAt?:number;report?:CohortCreationOutcome;
        unconfirmedRows?:ClassTeamCreationResultRow[];checkedAt?:string};
      const confirmed=Boolean(saved.report&&Array.isArray(saved.report.individualResults)&&
        saved.report.individualResults.length<=10000&&
        saved.report.individualResults.every(item=>
          item&&typeof item.membershipId==="string"&&
          ["CREATED","ALREADY_COVERED"].includes(item.status)));
      const uncertain=Array.isArray(saved.unconfirmedRows)&&
        saved.unconfirmedRows.length<=10000&&
        saved.unconfirmedRows.every(item=>item&&typeof item.membershipId==="string"&&
          item.status==="UNCONFIRMED"&&typeof item.reason==="string");
      if(!saved.expiresAt||saved.expiresAt<Date.now()||(!confirmed&&!uncertain)){
        window.localStorage.removeItem(reportKey);return;
      }
      if(confirmed)setOutcome(saved.report!);
      if(uncertain)setUnconfirmedRows(saved.unconfirmedRows!);
      setOutcomeCheckedAt(typeof saved.checkedAt==="string"?saved.checkedAt:null);
      setOutcomeRestored(true);
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
    setPrevRosterKey(rosterKey);setPreflightPage(1);setResultPage(1);setGroupRowLimits({});
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
    setPrevPlan({roster,mode,order,size,seed});setGroupRowLimits({});
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
    let submitted=false;
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
        const allowed=await new Promise<boolean>(resolve=>{
          confirmCreation.current=resolve;
          setCreateConfirmation({
            count:fresh.toCreate,alreadyCovered:fresh.alreadyCovered,
            eligible:fresh.eligible,duplicates:fresh.duplicates,rosterCount:roster.members.length,
            rows:fresh.items.filter(item=>item.status==="TO_CREATE").slice(0,10)
              .map(item=>{
                const learner=names.get(item.membershipId);
                return {membershipId:item.membershipId,
                  name:learner?.displayName??learner?.rollNumber??item.membershipId};
              }),
          });
        });
        if(!allowed)return;
      }
      // Distinguish a request that may have committed from a failed preflight:
      // only dispatched requests produce uncertain per-learner recovery rows.
      submitted=true;
      const result=await projectMutation("/api/projects/class-team-workspaces","POST",{
        collegeId,classId:roster.classId,templateId,rosterRevision:roster.revision,
        baseTitle:title.trim(),baseSlug:slug.trim(),summary:summary.trim()||undefined,
        primaryMentorMembershipId:primaryMentorMembershipId||undefined,initialStatus,
        teams:groups,cohortMode:mode==="INDIVIDUAL",expectedPreviewVersion:previewVersion(groups),
      }) as CohortCreationOutcome;
      if(result.batchMode==="ATOMIC"&&result.committed!==true)
        throw new Error("Creation was not committed. Refresh the roster before retrying.");
      setOutcome(result);
      setUnconfirmedRows([]);
      setOutcomeCheckedAt(new Date().toISOString());
      setResultPage(1);
      setOutcomeRestored(false);
      if(mode==="INDIVIDUAL"){
        try{
          window.localStorage.setItem(reportKey,JSON.stringify({
            expiresAt:Date.now()+7*24*60*60*1000,report:result,
            unconfirmedRows:[],checkedAt:new Date().toISOString(),
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
        setNotice("Created "+result.created.length+" workspace(s) for the class roster.");
        showToast({tone:"success",title:result.created.length===1?
          "Workspace created":"Workspaces created",
          description:"Created "+result.created.length+" workspace(s) for the class roster."});
      }
      if(mode==="INDIVIDUAL" && result.created.length < result.requested-result.alreadyCovered){
        setNotice("Some workspaces were not created. Review the learner outcome report before retrying.");
      }
      if(mode!=="INDIVIDUAL"){
        if(result.created.length===1)router.push(basePath+"/"+encodeURIComponent(result.created[0].projectId)+"/summary");
        else router.push(basePath);
      }
      router.refresh();
    } catch(e) {
      const failure=classTeamCreationFeedback(e);
      if(mode==="INDIVIDUAL"&&submitted){
        // An interrupted HTTP response does not prove rollback. Keep per-learner
        // details for a safe roster/preflight reconciliation, never claim FAIL.
        const rows:ClassTeamCreationResultRow[]=groups.flatMap(group=>
          group.membershipIds.map(membershipId=>({
            membershipId,status:"UNCONFIRMED" as const,projectId:null,title:null,
            reason:"Outcome not confirmed: "+failure,
          })));
        setUnconfirmedRows(rows);
        const checkedAt=new Date().toISOString();
        setOutcomeCheckedAt(checkedAt);
        try{
          window.localStorage.setItem(reportKey,JSON.stringify({
            expiresAt:Date.now()+7*24*60*60*1000,unconfirmedRows:rows,checkedAt,
          }));
        }catch{/* Export remains available if local storage is disabled. */}
        setError("The creation response could not be confirmed. Check existing workspaces before retrying. "+failure);
        showToast({tone:"error",title:"Creation outcome not confirmed",description:failure});
      }else{
        setError("Nothing was created. "+failure);
        showToast({tone:"error",title:"Nothing was created",description:failure});
      }
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
    <nav aria-label="Workspace creation" className="flex flex-wrap items-center gap-2">
      <a href={basePath} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">Back to workspaces</a>
      <a href={basePath+"/create"} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link hover:bg-primary-subtle md:min-h-9">
        Single · Create workspace
      </a>
    </nav>
    {mode==="TEAMS"?<div className="border-l-2 border-info p-3 text-sm text-body" role="note">
      <strong>Split a class into teams.</strong> Pick a class and a team size, preview the teams, move anyone between teams, then create.
      Each team gets its own workspace with the same template and mentor.
    </div>:null}
    {mode==="INDIVIDUAL"?<div className="border-l-2 border-info p-3 text-sm text-body" role="note">
      <strong>Cohort mode.</strong> Every active student in the section gets their own workspace with the same template, mentor, and title suffixed with their name.
    </div>:null}
    {emptyMessages.classes?<p role="status" className="border-b border-border py-3 text-sm text-body leading-[22px]">{emptyMessages.classes}</p>:null}
    {emptyMessages.templates?<p role="alert" className="border-b border-border py-3 text-sm text-body leading-[22px]">{emptyMessages.templates}</p>:null}
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
      <label className="block space-y-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class
        <Input type="search" aria-label="Find a class" placeholder="Search class name or code"
          value={classQuery} maxLength={120} disabled={pending}
          onChange={event=>setClassQuery(event.target.value)} />
        <Select value={classId} onChange={e=>setClassId(e.target.value)} disabled={loading||pending}>
          <option value="">{loading?"Loading classes…":"Select a class"}</option>
          {classes.map(c=><option key={c.id} value={c.id}>{c.name?.trim()||"Class "+c.id.slice(0,8)}{c.code?" ("+c.code+")":""}</option>)}
        </Select>
        {!classId&&!loading?<span className="block text-xs text-warning">
          {mode==="INDIVIDUAL"?"Pick the class to create one workspace per student.":"Pick the class to split into teams."}
        </span>:null}
        {error&&classes.length===0?<Button variant="secondary" size="sm" type="button"
          onClick={()=>setClassesRetry(v=>v+1)}>Retry class search</Button>:null}
      </label>
      <label className="block space-y-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Template <span aria-hidden="true">*</span>
        <Input type="search" value={templateQuery} disabled={pending}
          onChange={event=>setTemplateQuery(event.target.value)}
          placeholder="Search by template title" maxLength={120}
          aria-label="Search by template title" />
        <Select aria-label="Choose a published project template" required
          value={templateId} onChange={e=>setTemplateId(e.target.value)} disabled={pending}>
          <option value="">Select template</option>
          {templates.filter(t=>t.templateId===templateId||
             t.title.toLocaleLowerCase("en").includes(templateQuery.trim().toLocaleLowerCase("en")))
            .map(t=><option key={t.templateId} value={t.templateId}>{t.title} (v{t.version})</option>)}
        </Select>
        {!templates.length?<span role="alert" className="block text-xs text-warning">No templates are available to this college yet — a 42Students admin assigns them.</span>:null}
        {!templateId?<span role="alert" className="block text-xs text-error">
          A template is required — every workspace needs a sprint/task baseline to start from
        </span>:null}
      </label>
      <label className="block space-y-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Workspace title <span aria-hidden="true">*</span>
        <Input required aria-invalid={Boolean(classId&&!title.trim())} value={title} disabled={!plannerEditable}
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
          placeholder="Short live workspace summary"
          onChange={event=>setSummary(event.target.value)}/>
      </label>
      <label className="block space-y-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Mentor
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
      <fieldset className="space-y-2 md:col-span-2">
       <legend className="text-[13px] font-semibold text-body">Workspace mode</legend>
       <div role="radiogroup" aria-label="Workspace creation mode"
        className="grid gap-2 rounded-[var(--lms-control-radius)] border border-border p-1 sm:grid-cols-3">
        {([
          ["WHOLE_CLASS","One team"],
          ["INDIVIDUAL","Cohort · One per student"],
          ["TEAMS","Teams · Split a class"],
        ] as const).map(([value,title])=><label key={value}
         className={"flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--lms-control-radius)] border px-3 py-2 text-sm font-semibold "+
          (mode===value?"border-primary bg-primary-subtle text-link":"border-transparent bg-surface text-body")}>
         <input type="radio" name="workspaceMode" value={value}
          checked={mode===value} disabled={!plannerEditable}
          onChange={()=>setMode(value)}/>
         {title}
        </label>)}
       </div>
      </fieldset>
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
      <p>Class roster: {roster?.members.length??0} · Eligible students: {currentPreflight.eligible} · Already covered: {currentPreflight.alreadyCovered} · Duplicate roster entries: {currentPreflight.duplicates} · {currentPreflight.toCreate} to create</p>
      <div className="max-h-72 min-w-0 overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" role="region" aria-label="Learner creation preflight details" tabIndex={0}>
        <DataTable
          caption="Learner creation preflight"
          rows={currentPreflight.items.slice((Math.min(preflightPage,
             Math.max(1,Math.ceil(currentPreflight.items.length/20)))-1)*20,
             Math.min(preflightPage,Math.max(1,Math.ceil(currentPreflight.items.length/20)))*20)
             .map(row=>row)}
          getRowKey={row=>row.membershipId}
          columns={[
            {key:"learner",header:"Learner",mobilePriority:"primary",cell:row=>{
              const learner=names.get(row.membershipId);
              return <>{learner?.displayName??learner?.rollNumber??"Learner"}{learner?.rollNumber?" · "+learner.rollNumber:""}</>;
            }},
            {key:"membershipId",header:"Learner ID",mobilePriority:"secondary",
              cell:row=><span className="break-all text-xs tabular-nums">{row.membershipId}</span>},
            {key:"decision",header:"Decision",mobilePriority:"secondary",cell:row=>
              <span className={row.status==="TO_CREATE"?
               "rounded-full bg-success-subtle px-2 py-1 text-success-text":
               "rounded-full bg-muted px-2 py-1 text-body"}>
                {row.status==="TO_CREATE"?"Create":row.status==="ALREADY_COVERED"?"Already has workspace":"Duplicate"}
              </span>},
          ]}
          empty={<EmptyState title="No eligible learners" description="No eligible learners in this preview." />}
        />
      </div>
      {currentPreflight.items.length>20?<nav aria-label="Preflight learner pages"
        className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-body">
        <span>Page {Math.min(preflightPage,
          Math.max(1,Math.ceil(currentPreflight.items.length/20)))} of {
          Math.ceil(currentPreflight.items.length/20)} · 20 per page</span>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm"
            disabled={preflightPage<=1} onClick={()=>setPreflightPage(n=>Math.max(1,n-1))}>Previous</Button>
          <Button type="button" variant="secondary" size="sm"
            disabled={preflightPage>=Math.ceil(currentPreflight.items.length/20)}
            onClick={()=>setPreflightPage(n=>n+1)}>Next</Button>
        </div>
      </nav>:null}
      <p className="text-xs text-muted-foreground leading-[20px]">The server will recheck class enrollment, duplicates and existing workspaces before it creates anything. Already covered learners are skipped.</p>
    </section>:null}
    {groups.length>0?<div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2" aria-label="Adjustable team preview">
      {groups.map((team,index)=><section key={index} className="min-w-0 border-b border-[var(--lms-canvas-border)] py-3">
        <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">{team.name} · {team.membershipIds.length}</h2>
        <ul className="mt-2 space-y-2">{team.membershipIds.slice(0,
          groupRowLimits[index]??20).map(id=>{
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
        {team.membershipIds.length>(groupRowLimits[index]??20)?<Button type="button"
          size="sm" variant="secondary" className="mt-2" disabled={pending}
          onClick={()=>setGroupRowLimits(old=>({...old,
            [index]:Math.min(team.membershipIds.length,(old[index]??20)+20)}))}>
          Show next {Math.min(20,team.membershipIds.length-(groupRowLimits[index]??20))} learners
        </Button>:null}
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
      <p className="text-sm leading-[22px]">{outcome.created.length} created · {outcome.alreadyCovered} already covered · {
        outcome.failedCount??Math.max(0,outcome.requested-outcome.alreadyCovered-outcome.created.length)
      } not created</p>
      {outcomeCheckedAt?<p className="text-xs text-body">Reported at {new Date(outcomeCheckedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p>:null}
      <p role="status" className="text-sm leading-[22px]">{outcome.created.length===0
        ? "No workspaces were created — the selected class may have no active learners."
        : outcome.created.length<outcome.requested-outcome.alreadyCovered
          ? outcome.created.length+" workspace(s) created; "+(outcome.requested-outcome.alreadyCovered-outcome.created.length)+" student(s) failed. Review or export the report below before retrying."
          : "Created "+outcome.created.length+" workspace(s) for the class roster."}</p>
      <div className="max-h-72 overflow-auto overscroll-contain [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" role="region" aria-label="Per-learner creation results" tabIndex={0}>
        <DataTable
          caption="Individual workspace creation results"
          rows={outcome.individualResults.slice((Math.min(resultPage,
            Math.max(1,Math.ceil(outcome.individualResults.length/15)))-1)*15,
            Math.min(resultPage,Math.max(1,Math.ceil(outcome.individualResults.length/15)))*15)}
          getRowKey={row=>row.membershipId}
          columns={[
            {key:"learner",header:"Learner",mobilePriority:"primary",cell:row=>names.get(row.membershipId)?.displayName??row.membershipId},
            {key:"result",header:"Result",mobilePriority:"secondary",cell:row=>row.status==="CREATED"?"Created":"Already covered"},
            {key:"workspace",header:"Workspace",mobilePriority:"secondary",cell:row=>
              row.projectId?<a href={basePath+"/"+encodeURIComponent(row.projectId)+"/summary"}
               className="font-semibold text-link underline">{row.title??"Open workspace"}</a>:
               row.title??"Existing workspace"},
            {key:"workspaceId",header:"Workspace ID",mobilePriority:"secondary",
              cell:row=><span className="break-all text-xs tabular-nums">{row.projectId??"—"}</span>},
          ]}
          empty={<EmptyState title="No individual results" description="No individual results recorded." />}
        />
      </div>
      {outcome.individualResults.length>15?<nav aria-label="Creation result pages"
        className="flex flex-wrap items-center justify-between gap-2 text-xs text-body">
        <span>Page {Math.min(resultPage,Math.max(1,Math.ceil(outcome.individualResults.length/15)))} of {
          Math.ceil(outcome.individualResults.length/15)} · 15 per page</span>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" type="button" disabled={resultPage<=1}
            onClick={()=>setResultPage(n=>Math.max(1,n-1))}>Previous</Button>
          <Button size="sm" variant="secondary" type="button"
            disabled={resultPage>=Math.ceil(outcome.individualResults.length/15)}
            onClick={()=>setResultPage(n=>n+1)}>Next</Button>
        </div>
      </nav>:null}
      <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
        onClick={()=>{
          let url:string|null=null;
          let link:HTMLAnchorElement|null=null;
          try {
            const csv=legacyCohortOutcomeCsv(outcome.individualResults);
            const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
            url=URL.createObjectURL(blob);
            link=document.createElement("a");
            link.href=url;
            link.download="project-cohort-outcome.csv";
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
      <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
        onClick={()=>{
          let url:string|null=null;
          let link:HTMLAnchorElement|null=null;
          try{
            const csv=classTeamCreationOutcomeCsv(outcome.individualResults,names);
            url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
            link=document.createElement("a");
            link.href=url;
            link.download="project-cohort-outcome-detailed.csv";
            document.body.appendChild(link);
            link.click();
          }catch{
            setError("Could not export the detailed report. Review the outcome rows and try again.");
          }finally{
            link?.remove();
            const disposableUrl=url;
            if(disposableUrl)window.setTimeout(()=>URL.revokeObjectURL(disposableUrl),0);
          }
        }}>Export detailed learner CSV</Button>
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
          const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
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
        {pending?"Creating workspaces…":mode==="TEAMS"?"Create "+groups.length+" team workspaces":mode==="INDIVIDUAL"?"Create workspaces for class":"Create workspace"}
      </Button>
    </div>
    <ConfirmDialog open={Boolean(createConfirmation)}
      onOpenChange={next=>{
        if(!next){
          setCreateConfirmation(null);
          confirmCreation.current?.(false);
          confirmCreation.current=null;
        }
      }}
      title={"Create "+(createConfirmation?.count??0)+" student workspaces?"}
      description="Review the current roster before submitting. The server rechecks eligibility and already-covered learners."
      confirmLabel={"Create "+(createConfirmation?.count??0)+" workspaces"}
      confirmVariant="primary" pending={false}
      onConfirm={()=>{
        setCreateConfirmation(null);
        confirmCreation.current?.(true);
        confirmCreation.current=null;
      }}>
      <div className="w-full space-y-3 text-sm text-body">
        <p>Class roster: {createConfirmation?.rosterCount??0}; eligible students: {createConfirmation?.eligible??0};
          already covered: {createConfirmation?.alreadyCovered??0}; duplicate roster entries: {createConfirmation?.duplicates??0}.</p>
        <p>The full list is below this form. The roster is checked again before anything is created.</p>
        {(createConfirmation?.rows.length??0)>0?
          <div className="max-h-64 overflow-auto rounded-[var(--lms-control-radius)] border border-border">
            <table className="w-full min-w-[320px] text-left text-xs">
              <thead><tr className="border-b border-border">
                <th scope="col" className="p-2">Learner</th>
                <th scope="col" className="p-2">Learner ID</th>
              </tr></thead>
              <tbody>{createConfirmation?.rows.map(row=><tr key={row.membershipId} className="border-b border-border last:border-0">
                <td className="p-2">{row.name}</td><td className="break-all p-2">{row.membershipId}</td>
              </tr>)}</tbody>
            </table>
          </div>:<p>No new learner workspace is required.</p>}
      </div>
    </ConfirmDialog>
    <ConfirmDialog open={discard.discardOpen} onOpenChange={discard.setDiscardOpen}
      title="Discard unsaved changes?"
      description="Leave this workspace plan and discard its unsaved changes?"
      confirmLabel="Discard changes" pending={pending}
      onConfirm={discard.confirmDiscard} />
  </div>;
}
