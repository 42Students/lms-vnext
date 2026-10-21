import Link from "next/link";
import type {CollegeReadinessEvaluation} from "@/modules/colleges/readiness-model";
import {readinessRemediationLink} from "@/modules/colleges/readiness-remediation-links";

type Advisory={id:string;title:string;reason:string;fix:string;href:string};
type ReadinessInput={collegeId:string;collegeName:string;
 readiness:CollegeReadinessEvaluation|null;loadFailed:boolean;
 logo:"PRESENT"|"MISSING"|"UNKNOWN"};
function genericCheck(check:{id:string;label:string;evidence:string;remediation:string;status:string},id:string){
 const mapped=readinessRemediationLink(check.id as Parameters<typeof readinessRemediationLink>[0],id);
 return {
  id:check.id,title:check.label||check.id,
  reason:check.evidence||"This check has no description yet — raise it with the platform team.",
  fix:check.remediation||"Review this requirement with the platform team.",
  href:mapped,
 };
}
function ReadinessRow({item,blocking}:{item:Advisory;blocking:boolean}){
 return <li className="flex min-w-0 flex-wrap items-start gap-3 border-t border-border py-3">
  <span aria-hidden="true" className={"shrink-0 text-base "+(blocking?"text-error":"text-warning")}>
   {blocking?"✕":"!"}
  </span>
  <div className="min-w-0 flex-1">
   <h4 className="font-semibold text-heading">{item.title}</h4>
   <p className="mt-1 text-sm text-body">{item.reason}</p>
   <p className="mt-1 text-sm text-body"><strong>What to do:</strong> {item.fix}</p>
  </div>
  <Link href={item.href} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
   Fix →</Link>
 </li>;
}
/** Compact legacy Launch checklist inside Launch setup. Checks are read from
 * persisted, authorized college scope, never assembled on the client from
 * stale global session data. A missing evidence source stays UNKNOWN. */
export function LaunchReadinessChecklist({collegeId,collegeName,readiness,loadFailed,logo}:ReadinessInput){
 const recheck="/admin/tenants/setup?tab=LAUNCH";
 const blocking=readiness?.checks.filter(x=>x.status!=="PASS").map(x=>genericCheck(x,collegeId))??[];
 const advisory:Advisory[]=[
  ...(logo!=="PRESENT"?[{
   id:"MISSING_LOGO",title:"No logo",
   reason:logo==="UNKNOWN"?"Branding could not be verified.":
    "This college has no uploaded logo. Login will still work without one.",
   fix:"Add your college logo in Branding.",
   href:"/admin/colleges/"+encodeURIComponent(collegeId)+"/branding",
  }]:[]),
 ];
 const status=loadFailed||!readiness?"UNKNOWN":readiness.overall;
 return <section aria-label="Launch checklist" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 shadow-sm md:p-5">
  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
   <div>
    <h3 className="text-lg font-semibold text-heading">Launch checklist</h3>
    <p className="mt-1 text-xs text-muted-foreground">
     Everything that has to be true before this college can be handed over.
    </p>
    <p className="mt-1 text-xs text-muted-foreground">Selected college: {collegeName}</p>
   </div>
   <Link href={recheck} className="inline-flex min-h-11 items-center gap-1 font-semibold text-link underline md:min-h-9">
    <span aria-hidden="true">↻</span> Recheck
   </Link>
  </div>
  {loadFailed||!readiness?
   <div className="mt-3 border border-border p-3" role="alert">
    <p className="font-semibold">Launch checklist could not be loaded</p>
    <p className="mt-1 text-sm text-body">We could not verify college readiness. Nothing has been approved for launch.</p>
    <Link href={recheck} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>
   </div>:
   <>
    <div role="status" aria-live="polite" className={"mt-4 rounded-lg px-3 py-4 text-sm font-semibold "+(
     status==="READY"?"bg-success-subtle text-success":
     status==="NOT_READY"?"bg-error-subtle text-error":"bg-warning-subtle text-warning"
    )}>
     <span aria-hidden="true" className="mr-2">{status==="READY"?"✓":"!"}</span>
     {status==="READY"?"Ready for handover checks":
       status==="NOT_READY"?"Must fix before launch":"Some checks need verification"}
     <p className="mt-1 text-xs font-normal">This is a persisted setup checklist, not confirmation that live DNS, OTP or login works.</p>
    </div>
    <section className="mt-4" aria-label="Must fix before launch">
     <h4 className="text-sm font-semibold text-heading">Must fix before launch
      <span className="ml-2 rounded border border-border px-2 py-0.5 text-xs tabular-nums">{blocking.length}</span>
     </h4>
     {blocking.length?<ul className="mt-2">{blocking.map(x=><ReadinessRow key={x.id} item={x} blocking/>)}</ul>:
       <p className="mt-2 text-sm text-body">No failed or unknown persisted checks.</p>}
    </section>
    <section className="mt-4" aria-label="Recommended">
     <h4 className="text-sm font-semibold text-heading">Recommended
      <span className="ml-2 rounded border border-border px-2 py-0.5 text-xs tabular-nums">{advisory.length}</span>
     </h4>
     {advisory.length?<ul className="mt-2">{advisory.map(x=><ReadinessRow key={x.id} item={x} blocking={false}/>)}</ul>:
       <p className="mt-2 text-sm text-body">No additional recommendations.</p>}
    </section>
   </>
  }
  <div className="mt-4 border-t border-border pt-3">
   <Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/readiness"}
     className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Full readiness details →</Link>
  </div>
 </section>;
}
