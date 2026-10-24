"use client";
import Link from "next/link";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
export function MentorGoogleCalendarAccount({connected,available,connectedAt}:{
 connected:boolean;available:boolean;connectedAt:string|null;
}){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 async function disconnect(){
  if(busy)return;setBusy(true);setError(null);
  try{
   const res=await fetch("/api/mentor/calendar/google/disconnect",{
    method:"POST",credentials:"same-origin",cache:"no-store"});
   if(!res.ok)throw new Error("Calendar disconnect could not be verified.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not disconnect Google Calendar.");}
  finally{setBusy(false);}
 }
 return <section className="space-y-2 rounded-lg border border-border p-3"
   aria-label="Google Calendar account connection">
  <h2 className="text-sm font-semibold">Google Calendar</h2>
  <p role="status" className="text-sm">
   {connected?"Connected for this account and college":
    available?"Not connected":"Google Calendar requires secure operator configuration"}
  </p>
  {connected&&connectedAt?<p className="text-xs text-muted-foreground">
   Consent recorded {new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
   }).format(new Date(connectedAt))} IST.
  </p>:null}
  {available&&(!connected?<Link
    className="inline-flex min-h-11 items-center rounded border border-border px-3 text-sm font-semibold"
    href="/api/mentor/calendar/google/connect">Connect Google Calendar</Link>:
    <Button type="button" disabled={busy} loading={busy}
      variant="secondary" onClick={()=>void disconnect()}>
      Disconnect Google Calendar
    </Button>)}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  <p className="text-xs text-muted-foreground">
   Connection grants calendar-event access only. Invitations, attendee
   responses and Meet links are not shown as synced without a verified
   Google API result. Disconnect clears the stored refresh token.
  </p>
 </section>;
}
