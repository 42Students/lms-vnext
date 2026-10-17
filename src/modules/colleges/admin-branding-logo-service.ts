import "server-only";
import {randomUUID} from "node:crypto";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {getPrivateR2Config} from "@/modules/storage/r2-config";
import {deleteObject,getObjectStream,headObject,presignUrl} from "@/modules/storage/s3-client";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {z} from "zod";

const MAX_LOGO_BYTES=2*1024*1024;
export class CollegeLogoError extends Error {
 constructor(readonly code:"LOGO_INVALID"|"LOGO_TOO_LARGE"|"COLLEGE_NOT_FOUND"|"LOGO_UPLOAD_FAILED"){
  super(code);this.name="CollegeLogoError";
 }
}
async function scoped(ctx:RequestContext,rawId:unknown){
 const id=z.uuid().parse(rawId);
 const [college]=await getDb().select({id:colleges.id,organizationId:colleges.organizationId,status:colleges.status,
  logoObjectPath:colleges.logoObjectPath}).from(colleges).where(eq(colleges.id,id)).limit(1);
 if(!college||college.status!=="ACTIVE")throw new CollegeLogoError("COLLEGE_NOT_FOUND");
 if(!isSuperAdmin(ctx))throw new AuthorizationError("college.manage");
 requirePermission(ctx,"college.manage",{collegeId:id,organizationId:college.organizationId});
 return college;
}
/** Browser crop produces a square PNG; server verifies declared size, actual
 * PNG header and exact square dimensions before accepting a public asset. */
export function validateCollegeLogoPng(bytes:Uint8Array){
 if(bytes.length<33||bytes.length>MAX_LOGO_BYTES)
  throw new CollegeLogoError(bytes.length>MAX_LOGO_BYTES?"LOGO_TOO_LARGE":"LOGO_INVALID");
 const signature=[137,80,78,71,13,10,26,10];
 if(signature.some((octet,index)=>bytes[index]!==octet)||
  bytes[12]!==73||bytes[13]!==72||bytes[14]!==68||bytes[15]!==82)
  throw new CollegeLogoError("LOGO_INVALID");
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const width=view.getUint32(16),height=view.getUint32(20);
 if(width!==height||width<200||width>2048||view.getUint32(8)!==13||
   ![2,6].includes(bytes[25]??-1)||bytes[24]!==8)
  throw new CollegeLogoError("LOGO_INVALID");
 return {width,height};
}
export async function uploadCollegeLogo(ctx:RequestContext,rawId:unknown,file:File){
 const college=await scoped(ctx,rawId);
 if(!(file instanceof File)||file.type!=="image/png"||file.size>MAX_LOGO_BYTES||file.size<33)
  throw new CollegeLogoError("LOGO_INVALID");
 const bytes=new Uint8Array(await file.arrayBuffer());
 const {width}=validateCollegeLogoPng(bytes);
 const key="branding/"+college.id+"/logo-"+randomUUID()+".png";
 const config=getPrivateR2Config();
 const headers={"content-type":"image/png","x-amz-meta-college-id":college.id,
  "x-amz-meta-asset-type":"college-logo","x-amz-meta-image-width":String(width)};
 const url=presignUrl(config,{method:"PUT",key,expiresSeconds:300,headers});
 const upload=await fetch(url,{method:"PUT",headers,body:bytes,cache:"no-store"});
 if(!upload.ok)throw new CollegeLogoError("LOGO_UPLOAD_FAILED");
 const proof=await headObject(config,key);
 if(!proof||proof.sizeBytes!==bytes.length||proof.contentType!=="image/png"||
    proof.metadata["college-id"]!==college.id||proof.metadata["asset-type"]!=="college-logo")
  throw new CollegeLogoError("LOGO_UPLOAD_FAILED");
 let previous=null as string|null;
 try{
  await getDb().transaction(async tx=>{
   await assertPersistedPlatformPermission(tx,ctx,"college.manage",{
    collegeId:college.id,organizationId:college.organizationId,
   });
   const [locked]=await tx.select({logoObjectPath:colleges.logoObjectPath}).from(colleges)
    .where(and(eq(colleges.id,college.id),eq(colleges.status,"ACTIVE"))).for("update").limit(1);
   if(!locked)throw new CollegeLogoError("COLLEGE_NOT_FOUND");
   previous=locked.logoObjectPath;
   await tx.update(colleges).set({logoObjectPath:key,updatedAt:new Date()}).where(eq(colleges.id,college.id));
   await recordActivityEventInTransaction(tx,ctx,{
    eventType:ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_BRANDING_UPDATED,
    collegeId:college.id,organizationId:college.organizationId,
    subjectType:"college",subjectId:college.id,summary:"College logo uploaded",
    metadata:{kind:"logo",width},
   });
  });
 }catch(error){await deleteObject(config,key).catch(()=>{});throw error;}
 if(previous?.startsWith("branding/"+college.id+"/"))await deleteObject(config,previous).catch(()=>{});
 return {logoUrl:"/api/colleges/"+college.id+"/branding/logo",width};
}
export async function getPublicCollegeLogo(rawId:unknown){
 const id=z.uuid().parse(rawId);
 const [college]=await getDb().select({logoObjectPath:colleges.logoObjectPath})
  .from(colleges).where(and(eq(colleges.id,id),eq(colleges.status,"ACTIVE"))).limit(1);
 const key=college?.logoObjectPath;
 if(!key||!/^branding\/[0-9a-f-]{36}\/logo-[0-9a-f-]{36}\.png$/.test(key)||
    !key.startsWith("branding/"+id+"/"))return null;
 const image=await getObjectStream(getPrivateR2Config(),key);
 return image&&image.contentType==="image/png"&&image.sizeBytes<=MAX_LOGO_BYTES?image:null;
}

/** Remove the active cropped logo without changing any other branding field. */
export async function removeCollegeLogo(ctx:RequestContext,rawId:unknown){
 const college=await scoped(ctx,rawId);
 const former=await getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"college.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const [current]=await tx.select({logoObjectPath:colleges.logoObjectPath}).from(colleges)
   .where(and(eq(colleges.id,college.id),eq(colleges.status,"ACTIVE"))).for("update").limit(1);
  if(!current)throw new CollegeLogoError("COLLEGE_NOT_FOUND");
  if(!current.logoObjectPath)return null;
  await tx.update(colleges).set({logoObjectPath:null,updatedAt:new Date()})
   .where(eq(colleges.id,college.id));
  await recordActivityEventInTransaction(tx,ctx,{
   eventType:ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_BRANDING_UPDATED,
   collegeId:college.id,organizationId:college.organizationId,
   subjectType:"college",subjectId:college.id,summary:"College logo removed",
   metadata:{kind:"logo",action:"REMOVED"},
  });
  return current.logoObjectPath;
 });
 if(former?.startsWith("branding/"+college.id+"/"))
  await deleteObject(getPrivateR2Config(),former).catch(()=>{});
 return {removed:former!==null};
}
