"use client";
import { Button } from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {EmptyState} from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function TpoRecruiterGrantForm({ companies }: {
  companies: readonly { relationshipId: string; name: string }[];
}) {
  const router = useRouter();
  const [relationshipId, setRelationshipId] = useState(companies[0]?.relationshipId ?? "");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmOpen,setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  async function save() {
    if (busy || !relationshipId || !email.trim()) return;
    // Audited confirmation is collected through ConfirmDialog below.
    setBusy(true); setError(null); setSuccess(null);
    try {
      const response = await fetch("/api/placements/tpo/settings/recruiter-grants", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GRANT", confirmed: true,
          companyRelationshipId: relationshipId, email: email.trim().toLowerCase(),
          title: title.trim() || null }),
      });
      if (!response.ok) throw new Error("Recruiter grant could not be saved. Verify the existing user and company.");
      const value = await response.json() as { outcome: string };
      setSuccess(value.outcome === "already-active" ? "This user already has an active grant." : "Recruiter access granted.");
      setEmail(""); setTitle(""); setConfirmOpen(false); router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Grant failed.");
    } finally { setBusy(false); }
  }
  return (
    <section className="min-w-0 space-y-3 border-t border-border pt-4">
      <h3 className="text-base font-semibold text-[var(--lms-heading)]">Grant recruiter college access</h3>
      <p className="text-sm text-body leading-[22px]">
        Choose an active linked company and an existing active user email. Duplicate
        active grants are not re-created. No invitation email is sent.
      </p>
      {companies.length === 0 ? (
        <EmptyState title="No active linked companies are available for recruiter grants."/>
      ) : (
        <>
          <div className="grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">Company
              <Select value={relationshipId} disabled={busy}
                onChange={(event) => {setRelationshipId(event.target.value);setError(null);setSuccess(null);}}
                className="min-h-11 w-full md:min-h-9">
                {companies.map((company) => <option key={company.relationshipId} value={company.relationshipId}>{company.name}</option>)}
              </Select>
            </label>
            <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Existing user email
              <Input type="email" value={email} disabled={busy}
                onChange={(event) => {setEmail(event.target.value);setError(null);setSuccess(null);}}
                className="min-h-11 md:min-h-9" required />
            </label>
            <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Recruiter title (optional)
              <Input type="text" value={title} maxLength={160} disabled={busy}
                onChange={(event) => {setTitle(event.target.value);setError(null);setSuccess(null);}}
                className="min-h-11 md:min-h-9" />
            </label>
          </div>
          <Button variant="primary" type="button" disabled={busy || !relationshipId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())} onClick={() => setConfirmOpen(true)}
            className="min-h-11 w-full md:w-auto md:min-h-9">
            {busy ? "Saving..." : "Review and confirm grant"}
          </Button>
        </>
      )}
      {error && !confirmOpen ? <InlineNotice tone="error" message={error}/> : null}
      {success ? <InlineNotice tone="success" message={success}/> : null}
      <ConfirmDialog open={confirmOpen} onOpenChange={value=>{if(!busy)setConfirmOpen(value);}}
        title="Review and confirm grant"
        description="Grant the existing user recruiter access to this college/company? This changes real recruiter permissions."
        confirmLabel="Grant recruiter college access" confirmVariant="primary" pending={busy}
        onConfirm={()=>void save()}>
        {error?<InlineNotice tone="error" message={error}/>:null}
      </ConfirmDialog>
    </section>
  );
}

export function TpoRecruiterRevoke({ grantId, expectedUpdatedAt, displayName }: {
  grantId: string; expectedUpdatedAt: string; displayName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmOpen,setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  async function revoke() {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/placements/tpo/settings/recruiter-grants", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REVOKE", confirmed: true,
          grantId, expectedUpdatedAt, reason: reason.trim() || null }),
      });
      if (!response.ok) throw new Error("Grant changed or revocation failed. Refresh to review the current state.");
      setNotice("Access removed");setReason("");setConfirmOpen(false);router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Revoke failed.");
    } finally { setBusy(false); }
  }
  return <div className="mt-2 min-w-0 space-y-2">
    <Button type="button" variant="secondary" disabled={busy} onClick={() => setConfirmOpen(true)}
      className="min-h-11 w-full text-xs md:w-auto md:min-h-9">
      {busy ? "Revoking..." : "Revoke access"}
    </Button>
    {error && !confirmOpen ? <InlineNotice tone="error" message={error}/> : null}
    {notice ? <InlineNotice tone="success" message={notice}/> : null}
    <ConfirmDialog open={confirmOpen} onOpenChange={value=>{if(!busy)setConfirmOpen(value);}}
      title={"Remove "+displayName+"\'s access?"}
      description="They will no longer be able to use this college\'s recruiter workspace."
      confirmLabel="Revoke access" confirmVariant="danger" pending={busy} onConfirm={()=>void revoke()}>
      <label className="grid gap-2 text-sm font-semibold text-body">
        Reason for removal (optional)
        <Input type="text" maxLength={500} value={reason} disabled={busy}
          onChange={event=>setReason(event.target.value)}
          className="w-full min-w-0" />
      </label>
      {error?<InlineNotice tone="error" message={error}/>:null}
    </ConfirmDialog>
  </div>;
}

export function TpoRecruiterExtend({grantId,expectedUpdatedAt,displayName,ended=false}:{
 grantId:string;expectedUpdatedAt:string;displayName:string;ended?:boolean;
}){
 const router=useRouter();
 const [months,setMonths]=useState<3|6|12|24>(6);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [confirmOpen,setConfirmOpen]=useState(false);
 async function extend(){
  if(busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/placements/tpo/settings/recruiter-grants",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"EXTEND",confirmed:true,grantId,expectedUpdatedAt,months}),
   });
   if(!response.ok)throw Error("Recruiter access has changed. Refresh and try again.");
   const result=await response.json() as {outcome:string;validUntil?:string};
   if(result.outcome!=="extended")throw Error("Recruiter access could not be confirmed. Refresh and review the grant.");
   const validTime=result.validUntil?Date.parse(result.validUntil):NaN;
   const until=Number.isFinite(validTime)
    ?new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(validTime))
    :null;
   setNotice("Access extended"+(until?" · Until "+until:""));
   setConfirmOpen(false);router.refresh();
  }catch(caught){setError(caught instanceof Error?caught.message:"Access could not be extended.");}
  finally{setBusy(false);}
 }
 return <div className="mt-2 grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
  <label className="grid min-w-0 gap-1 text-xs font-semibold text-body">{ended?"Give access again":"Extend access"}
   <Select value={months} disabled={busy}
    onChange={e=>setMonths(Number(e.target.value) as 3|6|12|24)}
    className="min-h-11 w-full md:min-h-9">
    <option value={3}>3 months</option><option value={6}>6 months</option><option value={12}>12 months</option>
    <option value={24}>24 months</option>
   </Select>
  </label>
  <Button type="button" variant="secondary" disabled={busy} onClick={()=>setConfirmOpen(true)}
   className="min-h-11 md:min-h-9 text-xs">
   {busy?"Saving…":ended?"Give access again":"Extend"}
  </Button>
  {error&&!confirmOpen?<div className="md:col-span-2"><InlineNotice tone="error" message={error}/></div>:null}
  {notice?<div className="md:col-span-2"><InlineNotice tone="success" message={notice}/></div>:null}
  <ConfirmDialog open={confirmOpen} onOpenChange={value=>{if(!busy)setConfirmOpen(value);}}
    title={"Extend "+displayName+"\'s access by "+months+" months?"}
    confirmLabel={ended?"Give access again":"Extend"} confirmVariant="primary"
    pending={busy} onConfirm={()=>void extend()}>
    {error?<InlineNotice tone="error" message={error}/>:null}
  </ConfirmDialog>
 </div>;
}
