"use client";
import Link from "next/link";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";

/** Saved consent is distinct from a live provider token verification. */
export function MentorGoogleCalendarAccount({connected,available,connectedAt}:{
 connected:boolean;available:boolean;connectedAt:string|null;
}){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [verification,setVerification]=useState<"VERIFIED"|"FAILED"|null>(null);
 async function disconnect(){
  if(busy)return;
  setBusy(true);setError(null);setVerification(null);
  try{
   const res=await fetch("/api/mentor/calendar/google/disconnect",{
    method:"POST",credentials:"same-origin",cache:"no-store"});
   if(!res.ok)throw new Error("Calendar disconnect could not be verified.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not disconnect Google Calendar.");}
  finally{setBusy(false);}
 }
 async function verify(){
  if(busy||!connected||!available)return;
  setBusy(true);setError(null);setVerification(null);
  try{
   const res=await fetch("/api/mentor/calendar/google/verify",{
    method:"POST",credentials:"same-origin",cache:"no-store"});
   if(!res.ok)throw new Error("Google could not verify this grant. Reconnect your calendar and try again.");
   const result=await res.json() as {verified?:unknown};
   if(result.verified!==true)throw new Error("Google did not confirm calendar access.");
   setVerification("VERIFIED");
  }catch(e){
   setVerification("FAILED");
   setError(e instanceof Error?e.message:"Google Calendar verification failed.");
  }finally{setBusy(false);}
 }
 return <section className="space-y-2 rounded-lg border border-border p-3"
   aria-label="Google Calendar account connection">
  <h3 className="text-sm font-semibold">Google Calendar</h3>
  <p role="status" className="text-sm">
   {!available?"Google Calendar requires secure operator configuration":
    !connected?"No saved Google Calendar consent":
    verification==="VERIFIED"?"Google access verified for this session":
    "Consent saved for this college; live Google access not yet verified"}
  </p>
  {connected&&connectedAt?<p className="text-xs text-muted-foreground">
   Consent recorded {new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
   }).format(new Date(connectedAt))} IST.
  </p>:null}
  {available?<div className="flex flex-wrap items-center gap-2">
    {connected?<Button type="button" disabled={busy} loading={busy}
      variant="secondary" onClick={()=>void verify()}>
      Verify Google access
    </Button>:null}
    <Link className="inline-flex min-h-11 items-center rounded border border-border px-3 text-sm font-semibold"
      href="/api/mentor/calendar/google/connect">
      {connected?"Reconnect Google Calendar":"Connect Google Calendar"}
    </Link>
    {connected?<Button type="button" disabled={busy} loading={busy}
      variant="secondary" onClick={()=>void disconnect()}>
      Disconnect Google Calendar
    </Button>:null}
   </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {verification==="FAILED"?<p className="text-xs text-muted-foreground">
    A saved token is not proof of active Google access. Reconnect to reauthorize.
  </p>:null}
  <p className="text-xs text-muted-foreground">
   Calendar-event consent is per account and college. Only a live Google API
   response can verify a grant, invitation, attendee reply or Meet link.
   Disconnect clears the locally stored refresh token.
  </p>
 </section>;
}
