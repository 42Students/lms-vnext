import "server-only";

/** Google Calendar REST bridge. Does not imply an OAuth connection: callers
 * must supply a refreshable token from encrypted, consented user storage and
 * a tenant-checked saved meeting. Fail closed if credentials are absent.
 */
const TOKEN_URL="https://oauth2.googleapis.com/token";
const CALENDAR_ROOT="https://www.googleapis.com/calendar/v3";
export const MENTOR_CALENDAR_SCOPE="https://www.googleapis.com/auth/calendar.events";
export type MentorGoogleConfig={
 clientId:string;clientSecret:string;redirectUri:string;
};
export function mentorGoogleConfig(env:Record<string,string|undefined>=process.env):
 MentorGoogleConfig|null{
 const clientId=(env["MENTOR_GOOGLE_CLIENT_ID"]??"").trim();
 const clientSecret=(env["MENTOR_GOOGLE_CLIENT_SECRET"]??"").trim();
 const redirectUri=(env["MENTOR_GOOGLE_REDIRECT_URI"]??"").trim();
 try{
  const url=new URL(redirectUri);
  if(!clientId||!clientSecret||!/^(?:https:)$/i.test(url.protocol)||
    url.username||url.password||url.search||url.hash)return null;
  return {clientId,clientSecret,redirectUri};
 }catch{return null;}
}
/** State is a signed one-time value owned by the callback route, not a
 * browser-supplied user, project or college identifier.
 */
export function mentorGoogleConsentUrl(config:MentorGoogleConfig,state:string):string{
 if(!/^[A-Za-z0-9_\-\.]{32,600}$/.test(state))
  throw new Error("GOOGLE_CALENDAR_INVALID_STATE");
 const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
 url.searchParams.set("response_type","code");
 url.searchParams.set("client_id",config.clientId);
 url.searchParams.set("redirect_uri",config.redirectUri);
 url.searchParams.set("access_type","offline");
 url.searchParams.set("prompt","consent");
 url.searchParams.set("include_granted_scopes","true");
 url.searchParams.set("scope",MENTOR_CALENDAR_SCOPE);
 url.searchParams.set("state",state);
 return url.toString();
}
type TokenJson={access_token?:unknown;refresh_token?:unknown;expires_in?:unknown;
 scope?:unknown;token_type?:unknown;error?:unknown};
export type MentorGoogleTokens={accessToken:string;refreshToken:string|null;expiresIn:number};
async function tokenRequest(body:URLSearchParams,fetchImpl:typeof fetch):Promise<MentorGoogleTokens>{
 const result=await fetchImpl(TOKEN_URL,{
  method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",
   Accept:"application/json"},body,redirect:"error",cache:"no-store",
 });
 if(!result.ok)throw new Error("GOOGLE_CALENDAR_TOKEN_REJECTED");
 const json=(await result.json()) as TokenJson;
 if(typeof json.access_token!=="string"||!json.access_token||
  json.token_type!=="Bearer"||typeof json.expires_in!=="number"||
  !Number.isFinite(json.expires_in)||json.expires_in<=0)
  throw new Error("GOOGLE_CALENDAR_TOKEN_INVALID");
 return {accessToken:json.access_token,
  refreshToken:typeof json.refresh_token==="string"&&json.refresh_token?
   json.refresh_token:null,expiresIn:Math.min(json.expires_in,86400)};
}
export async function mentorGoogleExchangeCode(
 config:MentorGoogleConfig,code:string,fetchImpl:typeof fetch=fetch,
):Promise<MentorGoogleTokens>{
 if(!/^[\w\-/\.]{8,4096}$/.test(code))
  throw new Error("GOOGLE_CALENDAR_CODE_INVALID");
 return tokenRequest(new URLSearchParams({
  client_id:config.clientId,client_secret:config.clientSecret,
  redirect_uri:config.redirectUri,code,grant_type:"authorization_code",
 }),fetchImpl);
}
export async function mentorGoogleRefreshToken(
 config:MentorGoogleConfig,refreshToken:string,fetchImpl:typeof fetch=fetch,
):Promise<MentorGoogleTokens>{
 if(!refreshToken||refreshToken.length>4096)
  throw new Error("GOOGLE_CALENDAR_REFRESH_INVALID");
 return tokenRequest(new URLSearchParams({
  client_id:config.clientId,client_secret:config.clientSecret,
  refresh_token:refreshToken,grant_type:"refresh_token",
 }),fetchImpl);
}
export type MentorCalendarEventInput={
 meetingId:string;title:string;agenda:string|null;
 startsAt:Date;endsAt:Date;timeZone:string;
 /** All recipients were resolved from current authorized project membership. */
 inviteeEmails:readonly string[];
 weeklyCount?:number;
};
export function mentorGoogleEventId(meetingId:string):string{
 if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(meetingId))
  throw new Error("GOOGLE_CALENDAR_MEETING_ID_INVALID");
 return "m"+meetingId.toLowerCase().replaceAll("-","");
}
export function mentorGoogleEventBody(input:MentorCalendarEventInput){
 const id=mentorGoogleEventId(input.meetingId);
 if(!Number.isFinite(input.startsAt.getTime())||!Number.isFinite(input.endsAt.getTime())||
  input.endsAt<=input.startsAt||input.endsAt.getTime()-input.startsAt.getTime()>24*3600000)
  throw new Error("GOOGLE_CALENDAR_WINDOW_INVALID");
 if(!/^[A-Za-z_]+(?:\/[A-Za-z_]+){1,3}$/.test(input.timeZone))
  throw new Error("GOOGLE_CALENDAR_TIMEZONE_INVALID");
 if(!input.title.trim()||input.title.length>200)
  throw new Error("GOOGLE_CALENDAR_TITLE_INVALID");
 if(input.inviteeEmails.length>100)
  throw new Error("GOOGLE_CALENDAR_TOO_MANY_INVITEES");
 const invitees=[...new Set(input.inviteeEmails.map(s=>s.trim().toLowerCase()))];
 if(invitees.some(address=>address.length>254||
   !/^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/.test(address)))
  throw new Error("GOOGLE_CALENDAR_INVITEE_INVALID");
 const weeks=input.weeklyCount;
 if(weeks!==undefined&&(!Number.isSafeInteger(weeks)||weeks<2||weeks>52))
  throw new Error("GOOGLE_CALENDAR_RECURRENCE_INVALID");
 return {id,summary:input.title.trim(),description:(input.agenda??"").slice(0,4000),
  start:{dateTime:input.startsAt.toISOString(),timeZone:input.timeZone},
  end:{dateTime:input.endsAt.toISOString(),timeZone:input.timeZone},
  attendees:invitees.map(email=>({email})),
  reminders:{useDefault:false,overrides:[{method:"email",minutes:60},
    {method:"popup",minutes:60}]},
  conferenceData:{createRequest:{requestId:id+"c",
    conferenceSolutionKey:{type:"hangoutsMeet"}}},
  ...(weeks?{recurrence:["RRULE:FREQ=WEEKLY;COUNT="+weeks]}:{}),
 };
}
export async function mentorGoogleUpsertMeeting(
 accessToken:string,calendarId:string,input:MentorCalendarEventInput,
 fetchImpl:typeof fetch=fetch,
):Promise<{eventId:string;meetUrl:string|null;etag:string|null}>{
 if(!accessToken||accessToken.length>4096||!calendarId||calendarId.length>512)
  throw new Error("GOOGLE_CALENDAR_CONNECTION_UNAVAILABLE");
 const body=mentorGoogleEventBody(input);
 const path="/calendars/"+encodeURIComponent(calendarId)+"/events/";
 const base=CALENDAR_ROOT+path;
 const options={method:"POST",redirect:"error" as const,cache:"no-store" as const,
  headers:{Authorization:"Bearer "+accessToken,"Content-Type":"application/json",
   Accept:"application/json"},body:JSON.stringify(body)};
 // A deterministic event ID prevents duplicate meetings/invitations on retry.
 let response=await fetchImpl(base+"?conferenceDataVersion=1&sendUpdates=all",options);
 if(response.status===409){
  response=await fetchImpl(base+encodeURIComponent(body.id)+
   "?conferenceDataVersion=1&sendUpdates=all",{...options,method:"PUT"});
 }
 if(!response.ok)throw new Error("GOOGLE_CALENDAR_EVENT_REJECTED");
 const result=(await response.json()) as {id?:unknown;etag?:unknown;
  hangoutLink?:unknown;conferenceData?:{entryPoints?:{entryPointType?:string;uri?:string}[]}};
 if(result.id!==body.id)throw new Error("GOOGLE_CALENDAR_EVENT_MISMATCH");
 const link=result.conferenceData?.entryPoints?.find(entry=>
  entry.entryPointType==="video")?.uri??result.hangoutLink;
 let meetUrl:string|null=null;
 if(typeof link==="string"){
  try{const parsed=new URL(link);
   if(parsed.protocol==="https:"&&parsed.hostname==="meet.google.com"&&
    !parsed.username&&!parsed.password)meetUrl=parsed.toString();
  }catch{/* No verified Meet link */}
 }
 return {eventId:body.id,meetUrl,etag:typeof result.etag==="string"?result.etag:null};
}
export async function mentorGoogleRemoveMeeting(
 accessToken:string,calendarId:string,meetingId:string,
 fetchImpl:typeof fetch=fetch,
):Promise<void>{
 if(!accessToken||!calendarId)throw new Error("GOOGLE_CALENDAR_CONNECTION_UNAVAILABLE");
 const url=CALENDAR_ROOT+"/calendars/"+encodeURIComponent(calendarId)+
  "/events/"+mentorGoogleEventId(meetingId)+"?sendUpdates=all";
 const response=await fetchImpl(url,{method:"DELETE",redirect:"error",cache:"no-store",
  headers:{Authorization:"Bearer "+accessToken}});
 if(!response.ok&&response.status!==404&&response.status!==410)
  throw new Error("GOOGLE_CALENDAR_DELETE_REJECTED");
}
