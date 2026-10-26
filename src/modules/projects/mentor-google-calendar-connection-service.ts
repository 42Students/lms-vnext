import "server-only";
import {createCipheriv,createDecipheriv,randomBytes} from "node:crypto";
import {and,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {mentorGoogleCalendarConnections,collegeMemberships,membershipRoles,users} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {ProjectsServiceError} from "./errors";
import {MENTOR_CALENDAR_SCOPE,mentorGoogleConfig,mentorGoogleRefreshToken}
 from "./mentor-google-calendar-provider";

const ENV_KEY="MENTOR_GOOGLE_TOKEN_ENCRYPTION_KEY";
function keyFromEnv(env:Record<string,string|undefined>=process.env):Buffer{
 const raw=(env[ENV_KEY]??"").trim();
 if(!/^[A-Za-z0-9_-]{43}=?$/.test(raw))
  throw new Error("GOOGLE_CALENDAR_KEY_UNAVAILABLE");
 const key=Buffer.from(raw,"base64url");
 if(key.byteLength!==32)throw new Error("GOOGLE_CALENDAR_KEY_UNAVAILABLE");
 return key;
}
export function encryptMentorGoogleRefreshToken(
 token:string,userId:string,collegeId:string,env?:Record<string,string|undefined>,
):string{
 if(!token||token.length>4096)throw new Error("GOOGLE_CALENDAR_REFRESH_INVALID");
 const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",keyFromEnv(env),iv);
 cipher.setAAD(Buffer.from("mentor-google-calendar:"+userId+":"+collegeId));
 const encoded=Buffer.concat([cipher.update(token,"utf8"),cipher.final()]);
 return ["v1",iv.toString("base64url"),encoded.toString("base64url"),
  cipher.getAuthTag().toString("base64url")].join(".");
}
export function decryptMentorGoogleRefreshToken(
 payload:string,userId:string,collegeId:string,env?:Record<string,string|undefined>,
):string{
 const parts=payload.split(".");
 if(parts.length!==4||parts[0]!=="v1"||
   !parts.slice(1).every(v=>/^[A-Za-z0-9_-]{1,5500}$/.test(v)))
   throw new Error("GOOGLE_CALENDAR_CREDENTIAL_INVALID");
 try{
  const iv=Buffer.from(parts[1]!,"base64url"),
   ciphertext=Buffer.from(parts[2]!,"base64url"),
   tag=Buffer.from(parts[3]!,"base64url");
  if(iv.byteLength!==12||tag.byteLength!==16||ciphertext.byteLength>4096)
   throw Error("invalid lengths");
  const decipher=createDecipheriv("aes-256-gcm",keyFromEnv(env),iv);
  decipher.setAAD(Buffer.from("mentor-google-calendar:"+userId+":"+collegeId));
  decipher.setAuthTag(tag);
  const token=Buffer.concat([decipher.update(ciphertext),decipher.final()]).toString("utf8");
  if(!token||token.length>4096)throw Error("invalid token");
  return token;
 }catch{throw new Error("GOOGLE_CALENDAR_CREDENTIAL_INVALID");}
}
async function scopedMentor(context:RequestContext){
 const membership=context.membership;
 const collegeId=membership?.collegeId;
 if(context.user.platformStatus!=="ACTIVE"||!hasMembershipRole(context,"MENTOR")||
    !membership||membership.status!=="ACTIVE"||!collegeId||
    !(await resolveOptionalModuleAccess(context)).projects.enabled)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 // Cookie/request role claims can outlive an administrator's revocation.
 // A Google OAuth credential must never be read, refreshed, or disconnected
 // on the strength of that snapshot alone.
 const [live]=await getDb().select({id:collegeMemberships.id})
  .from(collegeMemberships)
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
    eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(
    eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"MENTOR")))
  .where(and(
    eq(collegeMemberships.id,membership.id),
    eq(collegeMemberships.userId,context.user.id),
    eq(collegeMemberships.collegeId,collegeId),
    eq(collegeMemberships.status,"ACTIVE"),
  )).limit(1);
 if(!live)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 return {userId:context.user.id,collegeId};
}
export async function mentorGoogleConnectionState(context:RequestContext){
 const scope=await scopedMentor(context);
 const [row]=await getDb().select({
  connectedAt:mentorGoogleCalendarConnections.connectedAt,
  revokedAt:mentorGoogleCalendarConnections.revokedAt,
  hasCredential:mentorGoogleCalendarConnections.refreshTokenCiphertext,
 }).from(mentorGoogleCalendarConnections).where(and(
  eq(mentorGoogleCalendarConnections.userId,scope.userId),
  eq(mentorGoogleCalendarConnections.collegeId,scope.collegeId),
 )).limit(1);
 const config=mentorGoogleConfig();
 let credentialsReady=false;
 try{keyFromEnv();credentialsReady=true;}catch{/* closed if key absent */}
 return {connected:Boolean(row&&!row.revokedAt&&row.hasCredential&&credentialsReady&&config),
  available:Boolean(config&&credentialsReady),
  connectedAt:row&&!row.revokedAt?row.connectedAt.toISOString():null};
}
export async function saveMentorGoogleConnection(
 context:RequestContext,refreshToken:string,
){
 const scope=await scopedMentor(context);
 const encrypted=encryptMentorGoogleRefreshToken(refreshToken,scope.userId,scope.collegeId);
 await getDb().insert(mentorGoogleCalendarConnections).values({
  userId:scope.userId,collegeId:scope.collegeId,
  refreshTokenCiphertext:encrypted,scope:MENTOR_CALENDAR_SCOPE,
  calendarId:"primary",connectedAt:new Date(),updatedAt:new Date(),revokedAt:null,
 }).onConflictDoUpdate({
  target:[mentorGoogleCalendarConnections.userId,mentorGoogleCalendarConnections.collegeId],
  set:{refreshTokenCiphertext:encrypted,scope:MENTOR_CALENDAR_SCOPE,
   calendarId:"primary",connectedAt:new Date(),updatedAt:new Date(),revokedAt:null},
 });
}
export async function disconnectMentorGoogleConnection(context:RequestContext){
 const scope=await scopedMentor(context);
 await getDb().update(mentorGoogleCalendarConnections).set({
  refreshTokenCiphertext:null,revokedAt:new Date(),updatedAt:new Date(),
 }).where(and(
  eq(mentorGoogleCalendarConnections.userId,scope.userId),
  eq(mentorGoogleCalendarConnections.collegeId,scope.collegeId),
 ));
}
export async function getMentorGoogleAccessToken(context:RequestContext){
 const scope=await scopedMentor(context);
 const [row]=await getDb().select({
  refreshTokenCiphertext:mentorGoogleCalendarConnections.refreshTokenCiphertext,
  revokedAt:mentorGoogleCalendarConnections.revokedAt,
  calendarId:mentorGoogleCalendarConnections.calendarId,
 }).from(mentorGoogleCalendarConnections).where(and(
  eq(mentorGoogleCalendarConnections.userId,scope.userId),
  eq(mentorGoogleCalendarConnections.collegeId,scope.collegeId),
 )).limit(1);
 const config=mentorGoogleConfig();
 if(!row||row.revokedAt||!row.refreshTokenCiphertext||!config)
  throw new Error("GOOGLE_CALENDAR_CONNECTION_UNAVAILABLE");
 const refresh=decryptMentorGoogleRefreshToken(row.refreshTokenCiphertext,
   scope.userId,scope.collegeId);
 const token=await mentorGoogleRefreshToken(config,refresh);
 let expectedCiphertext=row.refreshTokenCiphertext;
 if(token.refreshToken&&token.refreshToken!==refresh){
  const rotated=encryptMentorGoogleRefreshToken(token.refreshToken,scope.userId,scope.collegeId);
  const updated=await getDb().update(mentorGoogleCalendarConnections).set({
   refreshTokenCiphertext:rotated,updatedAt:new Date(),
  }).where(and(
   eq(mentorGoogleCalendarConnections.userId,scope.userId),
   eq(mentorGoogleCalendarConnections.collegeId,scope.collegeId),
   eq(mentorGoogleCalendarConnections.refreshTokenCiphertext,row.refreshTokenCiphertext),
   isNull(mentorGoogleCalendarConnections.revokedAt),
  )).returning({userId:mentorGoogleCalendarConnections.userId});
  if(updated.length!==1)throw new Error("GOOGLE_CALENDAR_CONNECTION_UNAVAILABLE");
  expectedCiphertext=rotated;
 }
 // Token refresh performs external I/O. A revoke or reconnect may happen
 // during that request. Do not return an access token for the old consent.
 await scopedMentor(context);
 const [current]=await getDb().select({calendarId:mentorGoogleCalendarConnections.calendarId})
  .from(mentorGoogleCalendarConnections).where(and(
   eq(mentorGoogleCalendarConnections.userId,scope.userId),
   eq(mentorGoogleCalendarConnections.collegeId,scope.collegeId),
   eq(mentorGoogleCalendarConnections.refreshTokenCiphertext,expectedCiphertext),
   isNull(mentorGoogleCalendarConnections.revokedAt),
  )).limit(1);
 if(!current||current.calendarId!==row.calendarId)
  throw new Error("GOOGLE_CALENDAR_CONNECTION_UNAVAILABLE");
 return {accessToken:token.accessToken,calendarId:row.calendarId};
}
