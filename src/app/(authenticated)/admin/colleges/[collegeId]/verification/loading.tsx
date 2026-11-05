import { PageHeader } from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
export default function Loading(){
 return <section role="status" aria-busy="true" aria-label="Loading verification" className="min-w-0 space-y-4">
  <PageHeader title="Verification" />
  <p className="text-sm text-muted-foreground">Checking college verification access…</p>
  <SkeletonBlock className="h-20 border border-border" />
  <div className="rounded border border-border p-4" aria-hidden="true">
   <SkeletonBlock className="mb-4 h-5 w-40" />
   {Array.from({length:8},(_,i)=><div key={i} className="grid grid-cols-3 gap-4 border-t border-border py-3">
    <SkeletonBlock className="h-4" /><SkeletonBlock className="h-4" /><SkeletonBlock className="h-4" />
   </div>)}
  </div>
 </section>;
}
