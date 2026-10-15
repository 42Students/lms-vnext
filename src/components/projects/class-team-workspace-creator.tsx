"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { projectApiError, projectMutation } from "./project-api";
import { previewClassTeams, type ProjectTeam } from "@/modules/projects/class-team-split-model";
import { moveMemberBalanced } from "@/modules/projects/class-team-balanced-move";
import { swapClassTeamMembers } from "@/modules/projects/class-team-swap-model";
import { previewVersion } from "@/modules/projects/class-team-preview-token";
import type { AssignedProjectTemplateChoice } from "./project-create-control";

type ClassChoice = { id:string;name:string;code:string };
type Learner = {membershipId:string;rollNumber:string;displayName:string};
type Roster = {classId:string;className:string;revision:string;members:Learner[]};

export function ClassTeamWorkspaceCreator({collegeId,basePath,templates}:{collegeId:string;basePath:string;templates:readonly AssignedProjectTemplateChoice[]}) {
  const router=useRouter();
  const [classes,setClasses]=useState<ClassChoice[]>([]);
  const [classId,setClassId]=useState("");
  const [roster,setRoster]=useState<Roster|null>(null);
  const [templateId,setTemplateId]=useState(templates[0]?.templateId??"");
  const [mode,setMode]=useState<"TEAMS"|"WHOLE_CLASS">("TEAMS");
  const [order,setOrder]=useState<"ROLL"|"SHUFFLE">("ROLL");
  const [size,setSize]=useState(5);
  const [seed,setSeed]=useState("class-project");
  const [title,setTitle]=useState("");
  const [slug,setSlug]=useState("");
  const [groups,setGroups]=useState<ProjectTeam[]>([]);
  const [loading,setLoading]=useState(true);
  const [rosterLoading,setRosterLoading]=useState(false);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  useEffect(()=>{
    const controller=new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived/fetched state synchronised to props
    setLoading(true);
    void fetch("/api/projects/class-team-classes?collegeId="+encodeURIComponent(collegeId),{signal:controller.signal})
      .then(async response=>{
        if(!response.ok)throw Error(await projectApiError(response));
        return response.json() as Promise<{classes:ClassChoice[]}>;
      }).then(body=>{if(!controller.signal.aborted)setClasses(body.classes);})
      .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Could not load classes");})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[collegeId]);
  useEffect(()=>{
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived/fetched state synchronised to props
    if(!classId){setRoster(null);setGroups([]);return;}
    const controller=new AbortController();
    setRoster(null);setGroups([]);setRosterLoading(true);setError("");
    void fetch("/api/projects/class-team-roster?collegeId="+encodeURIComponent(collegeId)+"&classId="+encodeURIComponent(classId),{signal:controller.signal})
      .then(async response=>{
        if(!response.ok)throw Error(await projectApiError(response));
        return response.json() as Promise<{roster:Roster}>;
      }).then(body=>{if(!controller.signal.aborted)setRoster(body.roster);})
      .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Could not load class roster");})
      .finally(()=>{if(!controller.signal.aborted)setRosterLoading(false);});
    return()=>controller.abort();
  },[collegeId,classId]);
  useEffect(()=>{
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived/fetched state synchronised to props
    if(!roster){setGroups([]);return;}
    try {
      setGroups(previewClassTeams({mode,order,teamSize:size,seed,students:roster.members.map(({membershipId,rollNumber})=>({membershipId,rollNumber}))}));
      setNotice("");
    } catch(e) {
      setGroups([]);
      setError(e instanceof Error?e.message:"Invalid team plan");
    }
  },[roster,mode,order,size,seed]);
  const names=new Map(roster?.members.map(m=>[m.membershipId,m] as const)??[]);
  const balanced=groups.length>0&&Math.max(...groups.map(g=>g.membershipIds.length))-Math.min(...groups.map(g=>g.membershipIds.length))<=1;
  async function create() {
    if(!roster||!groups.length||!balanced)return;
    setPending(true);setError("");setNotice("");
    try {
      const result=await projectMutation("/api/projects/class-team-workspaces","POST",{
        collegeId,classId:roster.classId,templateId,rosterRevision:roster.revision,
        baseTitle:title.trim(),baseSlug:slug.trim(),teams:groups,expectedPreviewVersion:previewVersion(groups),
      }) as {created:{projectId:string}[]};
      setNotice(result.created.length+" Project workspaces created.");
      if(result.created.length===1)router.push(basePath+"/"+result.created[0].projectId);
      else router.push(basePath);
      router.refresh();
    } catch(e) {
      setError(e instanceof Error?e.message:"Could not create workspaces");
    } finally {
      setPending(false);
    }
  }
  return <div className="space-y-6">
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
        <Input value={title} onChange={e=>setTitle(e.target.value)} maxLength={170} placeholder="Capstone Project" />
      </label>
      <label className="block space-y-1 text-sm font-medium">Base slug
        <Input value={slug} onChange={e=>setSlug(e.target.value.toLowerCase())} maxLength={50} placeholder="capstone-project" />
      </label>
      <label className="block space-y-1 text-sm font-medium">Add students as
        <Select value={mode} onChange={e=>setMode(e.target.value as "TEAMS"|"WHOLE_CLASS")}>
          <option value="TEAMS">Split class into teams</option>
          <option value="WHOLE_CLASS">Add a whole class</option>
        </Select>
      </label>
      {mode==="TEAMS"?<>
        <label className="block space-y-1 text-sm font-medium">Preferred team size
          <Input type="number" min={1} max={100} value={size} onChange={e=>setSize(Number(e.target.value))} />
        </label>
        <label className="block space-y-1 text-sm font-medium">Grouping order
          <Select value={order} onChange={e=>setOrder(e.target.value as "ROLL"|"SHUFFLE")}>
            <option value="ROLL">Roll number</option>
            <option value="SHUFFLE">Seeded shuffle</option>
          </Select>
        </label>
        {order==="SHUFFLE"?<label className="block space-y-1 text-sm font-medium">Shuffle seed
          <Input value={seed} onChange={e=>setSeed(e.target.value)} maxLength={128}/>
        </label>:null}
      </>:null}
    </div>
    {rosterLoading?<p role="status">Loading current class roster…</p>:null}
    {roster?<p className="text-sm text-muted-foreground">{roster.className} · {roster.members.length} active learners · {groups.length} {mode==="TEAMS"?"teams":"group"}</p>:null}
    {groups.length>0?<div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2" aria-label="Adjustable team preview">
      {groups.map((team,index)=><section key={index} className="min-w-0 rounded-lg border border-border p-3">
        <h2 className="font-semibold">{team.name} · {team.membershipIds.length}</h2>
        <ul className="mt-2 space-y-2">{team.membershipIds.map(id=>{
          const learner=names.get(id);
          return <li key={id} className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 break-words">{learner?.rollNumber??"—"} · {learner?.displayName??"Learner"}</span>
            {groups.length>1?<label className="min-w-24 text-xs">Team
              <Select aria-label={"Move "+(learner?.displayName??"learner")+" to team"} value={index} onChange={event=>{
                try{const updated=moveMemberBalanced(groups,id,Number(event.target.value));setGroups(updated);setError("");}
                catch(e){setError(e instanceof Error?e.message:"Cannot move learner");}
              }}>
                {groups.map((g,i)=><option key={i} value={i}>{g.name}</option>)}
              </Select>
            </label>:null}
            {groups.length>1?<label className="min-w-24 text-xs">Swap with
              <Select aria-label={"Swap "+(learner?.displayName??"learner")+" with learner in team"} value="" onChange={event=>{
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
    <div className="flex flex-wrap justify-end gap-3">
      <Button variant="secondary" disabled={pending} onClick={()=>router.push(basePath)}>Cancel</Button>
      <Button disabled={pending||!balanced||!title.trim()||!slug.trim()||!templateId||!roster||rosterLoading} onClick={()=>void create()}>
        {pending?"Creating workspaces…":mode==="TEAMS"?"Create team workspaces":"Create whole-class workspace"}
      </Button>
    </div>
  </div>;
}
