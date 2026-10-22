"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {InlineNotice} from "@/components/ui/inline-notice";

type Season={
 id:string;name:string;status:string;updatedAt:string;
 registrationControlled:boolean;isRegistrationOpen:boolean;
 registrationDeadline:string|null;
};
/** Explicit, legacy-compatible action: this never auto-invites a batch. */
export function TpoSeasonRegistrationControls({seasons}:{seasons:readonly Season[]}){
 const router=useRouter();
 const [selected,setSelected]=useState<Season|null>(null);
 const [action,setAction]=useState<"OPEN_REGISTRATION"|"CLOSE_REGISTRATION">("OPEN_REGISTRATION");
 const [deadline,setDeadline]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [open,setOpen]=useState(false);
 function choose(season:Season,mode:"OPEN_REGISTRATION"|"CLOSE_REGISTRATION"){
  if(busy)return;
  setSelected(season);setAction(mode);setDeadline("");setError("");setOpen(true);
 }
 async function submit(){
  if(!selected||busy)return;
  let until:string|null=null;
  if(action==="OPEN_REGISTRATION"&&deadline){
   const timestamp=new Date(deadline+":00+05:30");
   if(!Number.isFinite(timestamp.getTime())||timestamp.getTime()<=Date.now()){
    setError("Choose a future registration deadline in IST, or leave it blank.");
    return;
   }
   until=timestamp.toISOString();
  }
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/seasons/"+encodeURIComponent(selected.id)+"/open-registration",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     action,expectedUpdatedAt:selected.updatedAt,confirmed:true,
     ...(action==="OPEN_REGISTRATION"?{registrationDeadline:until}:{}),
    }),
   });
   if(!response.ok)throw new Error("Registration status was not saved. Refresh season details and review before retrying.");
   const result:unknown=await response.json().catch(()=>null);
   if(!result||typeof result!=="object"||!("season" in result))
    throw new Error("Registration change could not be confirmed. Refresh to verify.");
   setOpen(false);setSelected(null);router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not update registration.");}
  finally{setBusy(false);}
 }
 return <section aria-label="Season registration lifecycle" className="min-w-0 space-y-3 border-b border-border pb-5">
  <h3 className="text-base font-semibold text-foreground">Season registration</h3>
  <p className="text-sm text-body">Open registration for a season independently from activating it. Students must also have a current eligible, invited academic cohort. All deadlines are in IST.</p>
  {seasons.filter(season=>season.status==="ACTIVE").length===0?
   <p role="status" className="text-sm text-muted-foreground">Start an active season before opening registration.</p>:
   seasons.filter(season=>season.status==="ACTIVE").map(season=>{
    const effectiveOpen=season.isRegistrationOpen&&
      (!season.registrationDeadline||new Date(season.registrationDeadline).getTime()>Date.now());
    return <div key={season.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-border py-3">
     <div className="min-w-0">
      <p className="font-semibold text-sm">{season.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">
       {!season.registrationControlled?"Cohort invitations control registration":
        effectiveOpen?"Registration open"+(season.registrationDeadline?" until "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(season.registrationDeadline))+" IST":""):
        "Registration closed"}
      </p>
     </div>
     <Button type="button" variant="secondary" disabled={busy} onClick={()=>
      choose(season,effectiveOpen?"CLOSE_REGISTRATION":"OPEN_REGISTRATION")}>
      {effectiveOpen?"Close registration":"Open registration"}
     </Button>
    </div>;
   })}
  <ConfirmDialog open={open} onOpenChange={next=>{if(!busy){setOpen(next);if(!next)setError("");}}}
   title={action==="OPEN_REGISTRATION"?"Open season registration?":"Close season registration?"}
   description={action==="OPEN_REGISTRATION"?
    "This opens the season-wide registration gate. Only eligible learners in invited cohorts may register.":
    "This closes season-wide registration. Existing recorded choices and consents remain unchanged."}
   confirmLabel={action==="OPEN_REGISTRATION"?"Open registration":"Close registration"}
   confirmVariant={action==="OPEN_REGISTRATION"?"primary":"danger"}
   pending={busy} onConfirm={()=>void submit()}>
   {selected?<p className="mb-3 break-words text-sm font-semibold">{selected.name}</p>:null}
   {action==="OPEN_REGISTRATION"?<label className="grid gap-1 text-sm font-semibold text-body">
    Registration deadline (IST, optional)
    <Input type="datetime-local" value={deadline} disabled={busy}
     onChange={event=>{setDeadline(event.target.value);setError("");}}/>
    <span className="text-xs font-normal text-muted-foreground">Leave blank to keep registration open until it is closed manually. Cohort deadlines still apply.</span>
   </label>:null}
   {error?<InlineNotice tone="error" message={error}/>:null}
  </ConfirmDialog>
 </section>;
}
