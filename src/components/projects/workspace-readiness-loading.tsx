import Link from "next/link";

/** Six-row legacy readiness skeleton. This is only a loading placeholder;
 * the authorized readiness service still determines readiness and permissions.
 */
export function WorkspaceReadinessLoading({basePath}:{basePath:string}){
 return <section role="status" aria-live="polite" aria-busy="true"
   aria-label="Loading workspace readiness"
   className="min-w-0 space-y-4 rounded-xl border border-border bg-surface p-4 md:p-6">
   <div className="space-y-2">
     <div className="h-5 w-44 animate-pulse rounded bg-surface-secondary"/>
     <p className="text-sm text-muted-foreground">Loading submission readiness…</p>
   </div>
   <div className="space-y-3" aria-hidden="true">
     {Array.from({length:6},(_,index)=><div key={index}
       className="flex min-h-11 items-center gap-4 rounded-lg border border-border px-3 py-2">
       <span className="h-4 w-28 shrink-0 animate-pulse rounded bg-surface-secondary"/>
       <span className="h-4 min-w-0 flex-1 animate-pulse rounded bg-surface-secondary"/>
     </div>)}
   </div>
   <Link href={basePath} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
     Back to workspaces
   </Link>
 </section>;
}
