import "server-only";
import {and,asc,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {courseAssignments,courseAssignmentResources} from "@/db/schema/assessments";
import type {RequestContext} from "@/modules/identity/context";
import {loadCourseSectionDeliveryScope} from "./scope";
import {requireDeliveryContentMutation} from "./learning-access";
import {CoursesServiceError} from "./errors";
import {createPrivateUploadGrant,readPrivateObjectAttestation} from "@/modules/storage/private-object-storage";
import type {FacultyAssignmentResourceInput} from "./faculty-assignment-authoring-model";

type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type Row=typeof courseAssignmentResources.$inferSelect;
type Resource={
 kind:"INSTRUCTIONS"|"PDF"|"FILE"|"LINK";
 title:string;body:string|null;externalUrl:string|null;
 privateObjectKey:string|null;contentType:string|null;
 contentBytes:number|null;sha256Hex:string|null;objectGeneration:string|null;
};
const id=z.string().uuid();
const MIME=new Set([
 "application/pdf","text/plain","text/csv","image/jpeg","image/png",
 "image/webp","application/msword",
 "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
 "application/vnd.ms-excel","application/vnd.ms-powerpoint",
 "application/vnd.openxmlformats-officedocument.presentationml.presentation",
 "application/zip",
]);
/** A file resource is a verified private object, never an unsigned URL or
 * client-declared scan claim. Historical keys already persisted on this same
 * assignment may be retained on edit under its fresh faculty grant. */
export async function attestFacultyAssignmentResources(
 context:RequestContext,collegeId:string,
 resources:readonly FacultyAssignmentResourceInput[],assignmentId?:string,
):Promise<Resource[]>{
 const member=context.membership;
 if(!member||member.collegeId!==collegeId||!member.roles.includes("FACULTY"))
  throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 const existing=new Map<string,Row>();
 if(assignmentId){
  const rows=await getDb().select().from(courseAssignmentResources)
   .where(eq(courseAssignmentResources.assignmentId,id.parse(assignmentId)));
  for(const row of rows)if(row.privateObjectKey)existing.set(row.privateObjectKey,row);
 }
 const output:Resource[]=[];
 for(const resource of resources){
  if(resource.kind==="INSTRUCTIONS"){
   output.push({kind:resource.kind,title:resource.title,body:resource.body,
    externalUrl:null,privateObjectKey:null,contentType:null,
    contentBytes:null,sha256Hex:null,objectGeneration:null});
   continue;
  }
  if(resource.kind==="LINK"){
   output.push({kind:resource.kind,title:resource.title,body:null,
    externalUrl:resource.externalUrl,privateObjectKey:null,
    contentType:null,contentBytes:null,sha256Hex:null,objectGeneration:null});
   continue;
  }
  const kept=existing.get(resource.privateObjectKey);
  if(kept&&kept.kind===resource.kind){
    output.push({
      kind:resource.kind,title:resource.title,body:null,externalUrl:null,
      privateObjectKey:kept.privateObjectKey,contentType:kept.contentType,
      contentBytes:kept.contentBytes,sha256Hex:kept.sha256Hex,
      objectGeneration:kept.objectGeneration,
    });
    continue;
  }
  const attestation=await readPrivateObjectAttestation(resource.privateObjectKey,{
    collegeId,ownerMembershipId:member.id,
  });
  if(!MIME.has(attestation.contentType)||
      attestation.sizeBytes>50*1024*1024||
      (resource.kind==="PDF"&&attestation.contentType!=="application/pdf"))
   throw new CoursesServiceError("INVALID_ASSIGNMENT_TRANSITION");
  output.push({kind:resource.kind,title:resource.title,body:null,externalUrl:null,
    privateObjectKey:attestation.objectKey,
    contentType:attestation.contentType,contentBytes:attestation.sizeBytes,
    sha256Hex:attestation.sha256Hex,objectGeneration:attestation.generation});
 }
 return output;
}
export function facultyResourcesChanged(existing:readonly Row[],incoming:readonly Resource[]){
 if(existing.length!==incoming.length)return true;
 return existing.some((row,i)=>{
  const item=incoming[i];
  return !item||row.position!==i||row.kind!==item.kind||row.title!==item.title||
   (row.body??null)!==(item.body??null)||
   (row.externalUrl??null)!==(item.externalUrl??null)||
   (row.privateObjectKey??null)!==(item.privateObjectKey??null);
 });
}
export async function replaceFacultyAssignmentResources(
 tx:Tx,assignmentId:string,actorUserId:string,resources:readonly Resource[],
){
 const existing=await tx.select({id:courseAssignmentResources.id})
  .from(courseAssignmentResources)
  .where(eq(courseAssignmentResources.assignmentId,assignmentId));
 if(existing.length)await tx.delete(courseAssignmentResources)
  .where(eq(courseAssignmentResources.assignmentId,assignmentId));
 if(resources.length)await tx.insert(courseAssignmentResources).values(
  resources.map((item,position)=>({
   ...item,assignmentId,createdByUserId:actorUserId,position,
  })));
}
export async function listFacultyAssignmentResources(
 context:RequestContext,deliveryIdRaw:string,assignmentIdRaw:string,
){
 const deliveryId=id.parse(deliveryIdRaw),assignmentId=id.parse(assignmentIdRaw);
 if(await requireDeliveryContentMutation(context,deliveryId)!=="FACULTY")
  throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 const [assignment]=await getDb().select({id:courseAssignments.id})
  .from(courseAssignments).where(and(
   eq(courseAssignments.id,assignmentId),
   eq(courseAssignments.deliveryId,deliveryId))).limit(1);
 if(!assignment)throw new CoursesServiceError("ASSIGNMENT_NOT_FOUND");
 const items=await getDb().select({
  id:courseAssignmentResources.id,kind:courseAssignmentResources.kind,
  title:courseAssignmentResources.title,body:courseAssignmentResources.body,
  externalUrl:courseAssignmentResources.externalUrl,
  privateObjectKey:courseAssignmentResources.privateObjectKey,
  position:courseAssignmentResources.position,
 }).from(courseAssignmentResources)
  .where(eq(courseAssignmentResources.assignmentId,assignmentId))
  .orderBy(asc(courseAssignmentResources.position));
 return {items};
}
const uploadInput=z.strictObject({
 contentType:z.string().trim().max(128),
 sizeBytes:z.number().int().min(1).max(50*1024*1024),
 kind:z.enum(["PDF","FILE"]),
});
export async function presignFacultyAssignmentResource(
 context:RequestContext,deliveryIdRaw:string,raw:unknown,
){
 const deliveryId=id.parse(deliveryIdRaw),member=context.membership;
 const scope=await loadCourseSectionDeliveryScope(deliveryId);
 if(!member||member.status!=="ACTIVE"||member.collegeId!==scope.collegeId||
    await requireDeliveryContentMutation(context,deliveryId)!=="FACULTY")
  throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 const data=uploadInput.parse(raw);
 const contentType=data.contentType.toLowerCase();
 if(!MIME.has(contentType)||(data.kind==="PDF"&&contentType!=="application/pdf"))
   throw new CoursesServiceError("INVALID_ASSIGNMENT_TRANSITION");
 return createPrivateUploadGrant({
   collegeId:scope.collegeId,ownerMembershipId:member.id,
   namespace:"course-resource",contentType,expectedSizeBytes:data.sizeBytes,
   maxSizeBytes:50*1024*1024,expiresInMs:10*60*1000,
 });
}
