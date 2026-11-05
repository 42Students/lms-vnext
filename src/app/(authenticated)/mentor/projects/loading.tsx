import Link from "next/link";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
export default function MentorProjectsLoading(){
 return <section role="status" aria-busy="true" className="space-y-4">
  <p className="font-semibold text-foreground">Checking Projects access…</p>
  <p className="text-sm text-body">Refreshing projects…</p>
  <p className="text-sm text-body">Loading your assigned Project workspaces. This does not mean Projects is disabled.</p>
  <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
   {[0,1,2].map(index=><div key={index}
    className="min-h-48 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4"
    aria-hidden="true">
     <SkeletonBlock className="h-5 w-3/4" />
     <SkeletonBlock className="h-3 w-1/3" />
     <SkeletonBlock className="h-3 w-full" />
     <SkeletonBlock className="h-3 w-5/6" />
     <SkeletonBlock className="h-8 w-24" />
    </div>)}
  </div>
  <Link href="/mentor/notifications" className="inline-flex min-h-11 items-center text-link underline lms-inline-link">
   View notifications
  </Link>
 </section>;
}
