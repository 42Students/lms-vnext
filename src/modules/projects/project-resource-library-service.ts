import "server-only";

import {and,asc,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances,projectResources} from "@/db/schema";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {notifyActiveProjectMembers} from "./project-notification-service";
import {requireProjectManageAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {projectResourceLibrarySaveSchema,normalizedResourceKind} from "./project-resource-library-model";
import {projectResourceLibraryToken} from "./project-resource-library-token";

/** Atomic admin resource-library save with full-section CAS. No resource is
 * physically deleted: "Remove" archives the record for authorized recovery.
 */
export async function saveProjectResourceLibrary(context:RequestContext,projectId:string,raw:unknown){
  const input=projectResourceLibrarySaveSchema.parse(raw);
  const scope=await requireProjectManageAccess(context,projectId);
  return getDb().transaction(async tx=>{
    const [project]=await tx.select({id:projectInstances.id,status:projectInstances.status})
      .from(projectInstances).where(and(
        eq(projectInstances.id,scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId),
        isNull(projectInstances.deletedAt),
      )).for("update").limit(1);
    if(!project||!["ACTIVE","PLANNED"].includes(project.status))
      throw new ProjectsServiceError("PROJECT_RESOURCE_INVALID_STATE");
    await assertPersistedPlatformPermission(tx,context,"projects.manage",{
      collegeId:scope.collegeId,organizationId:scope.organizationId,
    });
    const current=await tx.select().from(projectResources)
      .where(eq(projectResources.projectId,project.id))
      .orderBy(asc(projectResources.sequence)).for("update");
    if(projectResourceLibraryToken(current)!==input.expectedToken)
      throw new ProjectsServiceError("PROJECT_RESOURCE_STALE_VERSION");
    if(current.length>500||input.rows.length>500)
      throw new ProjectsServiceError("PROJECT_RESOURCE_INVALID_STATE");
    const existing=new Map(current.map(row=>[row.id,row]));
    const desiredIds=new Set(input.rows.filter(row=>row.id!==null).map(row=>row.id));
    // An omitted row would silently delete project history or attachments.
    if(desiredIds.size!==current.length || current.some(row=>!desiredIds.has(row.id)))
      throw new ProjectsServiceError("PROJECT_RESOURCE_STALE_VERSION");
    const originalKeys=new Map(current.map(row=>[
      row.id,(row.legacyResourceKey||row.templateKey||"").toLowerCase(),
    ]));
    for(const row of input.rows){
      if(row.id&&!existing.has(row.id))throw new ProjectsServiceError("PROJECT_RESOURCE_NOT_FOUND");
      // Existing template and legacy keys are stable foreign-reference labels.
      if(row.id&&originalKeys.get(row.id)&&originalKeys.get(row.id)!==row.key.toLowerCase())
        throw new ProjectsServiceError("PROJECT_RESOURCE_INVALID_STATE");
    }
    const normalized=input.rows.map((row,index)=>({
      row,index,before:row.id?existing.get(row.id):undefined,
    }));
    const changed=normalized.filter(({row,before})=>!before||
      before.title!==row.title||
      (before.description??null)!==row.description||
      (before.url??null)!==row.url||
      before.required!==row.required||before.pinned!==row.pinned||
      (before.accessNotes??null)!==row.accessNotes||
      before.visibility!==row.visibility||before.status!==row.status||
      before.resourceType!==normalizedResourceKind(row.legacyKind)||
      (before.legacyResourceKind??"").toLowerCase()!==(row.legacyKind.toLowerCase())||
      before.sequence!==input.rows.findIndex(candidate=>candidate.id===before.id));
    if(!changed.length)return {changed:false,count:current.length,
      token:projectResourceLibraryToken(current)};
    // Temporarily relocate all existing rows above the current sequence range
    // before assigning contiguous indices, avoiding uniqueness collisions.
    const max=Math.max(-1,...current.map(row=>row.sequence));
    const reserveFrom=Math.max(max,input.rows.length)+1;
    if(reserveFrom+current.length+input.rows.length+1>2147483647)
      throw new ProjectsServiceError("PROJECT_RESOURCE_SEQUENCE_CONFLICT");
    for(let index=0;index<current.length;index++){
      await tx.update(projectResources).set({sequence:reserveFrom+index})
        .where(and(eq(projectResources.projectId,project.id),
          eq(projectResources.id,current[index]!.id)));
    }
    let newCount=0,editedCount=0,archivedCount=0;
    const savedIds:string[]=[];
    const now=new Date(Math.max(Date.now(),...current.map(row=>row.updatedAt.getTime()+1)));
    for(const {row,index,before} of normalized){
      const fields={
        title:row.title,description:row.description,url:row.url,
        required:row.required,pinned:row.pinned,accessNotes:row.accessNotes,
        visibility:row.visibility,resourceType:normalizedResourceKind(row.legacyKind),
        legacyResourceKind:row.legacyKind,status:row.status,
        sequence:reserveFrom+current.length+index,updatedAt:now,
      };
      if(before){
        await tx.update(projectResources).set({...fields,
          sequence:reserveFrom+current.findIndex(source=>source.id===before.id)})
          .where(and(eq(projectResources.id,before.id),eq(projectResources.projectId,project.id)));
        savedIds.push(before.id);
        editedCount++;
        if(before.status!=="ARCHIVED"&&row.status==="ARCHIVED")archivedCount++;
      }else{
        const [created]=await tx.insert(projectResources).values({
          ...fields,projectId:project.id,legacyResourceKey:row.key,
          templateKey:null,
        }).returning({id:projectResources.id});
        if(!created)throw new ProjectsServiceError("PROJECT_RESOURCE_NOT_FOUND");
        savedIds.push(created.id);
        newCount++;
      }
    }
    for(let index=0;index<savedIds.length;index++){
      await tx.update(projectResources).set({sequence:index})
        .where(and(eq(projectResources.id,savedIds[index]!),
          eq(projectResources.projectId,project.id)));
    }
    const updated=await tx.select().from(projectResources)
      .where(eq(projectResources.projectId,project.id))
      .orderBy(asc(projectResources.sequence));
    const event=await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_UPDATED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_instance",subjectId:project.id,
      summary:"Project resource library updated",
      groupKey:"project:"+project.id+":resources",
      metadata:{projectId:project.id,newCount,editedCount,archivedCount},
    });
    await notifyActiveProjectMembers(tx,event.id,{
      projectId:project.id,collegeId:scope.collegeId,roles:["MENTOR"],
      exceptUserId:context.user.id,title:"Resources updated",
      body:"The project resource library has changed.",
      actionHref:"/mentor/projects/"+project.id+"?tab=resources",
    });
    const teamVisibleChanged=changed.some(({row,before})=>
      row.visibility==="TEAM"||before?.visibility==="TEAM");
    if(teamVisibleChanged){
      await notifyActiveProjectMembers(tx,event.id,{
        projectId:project.id,collegeId:scope.collegeId,roles:["LEARNER"],
        exceptUserId:context.user.id,title:"Resources updated",
        body:"The project resource library has changed.",
        actionHref:"/learn/projects/"+project.id+"?tab=resources",
      });
    }
    return {changed:true,count:updated.length,token:projectResourceLibraryToken(updated)};
  });
}
