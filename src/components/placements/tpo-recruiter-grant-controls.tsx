"use client";
import { Button } from "@/components/ui/button";
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
    <section className="space-y-3 border-t border-border pt-5">
      <h3 className="text-base font-semibold text-foreground">Grant recruiter college access</h3>
      <p className="text-sm text-body">
        Choose an active linked company and an existing active user email. Duplicate
        active grants are not re-created. No invitation email is sent.
      </p>
      {companies.length === 0 ? (
        <p role="status" className="text-sm text-body">No active linked companies are available for recruiter grants.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm font-semibold text-body">Company
              <Select value={relationshipId} disabled={busy}
                onChange={(event) => setRelationshipId(event.target.value)}
                className="min-h-11 md:min-h-9">
                {companies.map((company) => <option key={company.relationshipId} value={company.relationshipId}>{company.name}</option>)}
              </Select>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-body">Existing user email
              <Input type="email" value={email} disabled={busy}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-11 md:min-h-9" required />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-body">Recruiter title (optional)
              <Input type="text" value={title} maxLength={160} disabled={busy}
                onChange={(event) => setTitle(event.target.value)}
                className="min-h-11 md:min-h-9" />
            </label>
          </div>
          <Button variant="primary" type="button" disabled={busy || !email.trim()} onClick={() => setConfirmOpen(true)}
            className="min-h-11 md:min-h-9">
            {busy ? "Saving..." : "Review and confirm grant"}
          </Button>
        </>
      )}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      {success ? <p role="status" className="text-sm text-body">{success}</p> : null}
      <ConfirmDialog open={confirmOpen} onOpenChange={value=>{if(!busy)setConfirmOpen(value);}}
        title="Review and confirm grant"
        description="Grant the existing user recruiter access to this college/company? This changes real recruiter permissions."
        confirmLabel="Grant recruiter college access" confirmVariant="primary" pending={busy}
        onConfirm={()=>void save()}>
        {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
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
  async function revoke() {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/placements/tpo/settings/recruiter-grants", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REVOKE", confirmed: true,
          grantId, expectedUpdatedAt }),
      });
      if (!response.ok) throw new Error("Grant changed or revocation failed. Refresh to review the current state.");
      setNotice("Access removed");setConfirmOpen(false);router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Revoke failed.");
    } finally { setBusy(false); }
  }
  return <div className="mt-2">
    <Button type="button" variant="secondary" disabled={busy} onClick={() => setConfirmOpen(true)}
      className="min-h-11 md:min-h-9 text-xs">
      {busy ? "Revoking..." : "Revoke access"}
    </Button>
    {error ? <p role="alert" className="text-xs text-error">{error}</p> : null}
    {notice ? <p role="status" className="text-xs text-success-text">{notice}</p> : null}
    <ConfirmDialog open={confirmOpen} onOpenChange={value=>{if(!busy)setConfirmOpen(value);}}
      title={"Remove "+displayName+"\'s access?"}
      description="They will no longer be able to use this college\'s recruiter workspace."
      confirmLabel="Revoke access" pending={busy} onConfirm={()=>void revoke()}>
      {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    </ConfirmDialog>
  </div>;
}

export function TpoRecruiterExtend({grantId,expectedUpdatedAt,displayName,ended=false}:{
 grantId:string;expectedUpdatedAt:string;displayName:string;ended?:boolean;
}){
 const router=useRouter();
 const [months,setMonths]=useState<3|6|12>(6);
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
   setNotice("Access extended");setConfirmOpen(false);router.refresh();
  }catch(caught){setError(caught instanceof Error?caught.message:"Access could not be extended.");}
  finally{setBusy(false);}
 }
 return <div className="mt-2 flex flex-wrap items-center gap-2">
  <label className="text-xs">{ended?"Give access again":"Extend access"}
   <Select value={months} disabled={busy}
    onChange={e=>setMonths(Number(e.target.value) as 3|6|12)}
    className="ml-2 min-h-11 md:min-h-9">
    <option value={3}>3 months</option><option value={6}>6 months</option><option value={12}>12 months</option>
   </Select>
  </label>
  <Button type="button" variant="secondary" disabled={busy} onClick={()=>setConfirmOpen(true)}
   className="min-h-11 md:min-h-9 text-xs">
   {busy?"Saving…":ended?"Give access again":"Extend"}
  </Button>
  {error?<p role="alert" className="w-full text-xs text-error">{error}</p>:null}
  {notice?<p role="status" className="w-full text-xs text-success-text">{notice}</p>:null}
  <ConfirmDialog open={confirmOpen} onOpenChange={value=>{if(!busy)setConfirmOpen(value);}}
    title={"Extend "+displayName+"\'s access by "+months+" months?"}
    confirmLabel={ended?"Give access again":"Extend"} confirmVariant="primary"
    pending={busy} onConfirm={()=>void extend()}>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  </ConfirmDialog>
 </div>;
}
