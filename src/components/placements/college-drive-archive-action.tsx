"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
type Preview={job:{title:string;status:string};canArchive:boolean;applications:number;
 rounds:number;offers:Record<string,number>;note:string};
export function CollegeDriveArchiveAction({jobId}:{jobId:string}){
 const router=useRouter();
 const [preview,setPreview]=useState<Preview|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const url="/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/archive";
 async function load(){
  setBusy(true);setError("");
  try{const r=await fetch(url,{cache:"no-store"});const body=await r.json().catch(()=>null);
   if(!r.ok||!body?.job)throw Error(body?.error??"Impact preview unavailable");
   setPreview(body as Preview);
  }catch(e){setError(e instanceof Error?e.message:"Impact preview unavailable");}
  finally{setBusy(false);}
 }
 async function archive(){
  if(!preview?.canArchive||busy)return;
  if(!window.confirm('Archive "'+preview.job.title+'"? The drive stays in the audit history.'))return;
  setBusy(true);setError("");
  try{
   const r=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({confirmed:true})});
   const body=await r.json().catch(()=>null);
   if(!r.ok)throw Error(body?.error??"Could not archive drive");
   router.push("/college/placements/drives?status=ARCHIVED");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not archive drive");}
  finally{setBusy(false);}
 }
 return <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold">Delete drive</h2>
  <p className="text-sm text-muted-foreground">Safely archive instead of permanently erasing placement evidence.</p>
  {!preview?<button type="button" disabled={busy} onClick={()=>void load()}
    className="min-h-10 rounded border border-border px-4 text-sm font-semibold">
    {busy?"Loading…":"View delete impact"}</button>:
   <div className="space-y-2" role="group" aria-label="Delete drive impact">
    <p className="text-sm font-semibold">{preview.job.title} · {preview.job.status}</p>
    <p className="text-sm">{preview.applications} applications, {preview.rounds} rounds,
     {Object.values(preview.offers).reduce((sum,n)=>sum+n,0)} offers will remain in history.</p>
    <p className="text-sm">{preview.note}</p>
    <div className="flex gap-3">
     <button type="button" disabled={busy||!preview.canArchive} onClick={()=>void archive()}
      className="min-h-10 rounded border border-border px-4 text-sm font-semibold disabled:opacity-50">Archive drive</button>
     <button type="button" disabled={busy} onClick={()=>setPreview(null)}
      className="min-h-10 rounded border border-border px-4 text-sm">Cancel</button>
    </div>
   </div>}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </div>;
}
