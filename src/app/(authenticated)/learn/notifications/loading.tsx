import {learnerNotificationsLoadingSections} from "@/modules/activity/learner-notification-loading-model";

export default function LearnerNotificationsLoading(){
 return (
  <main role="status" aria-busy="true" aria-label="Loading learner notifications" className="space-y-5">
    <p className="sr-only">Loading your personal notifications and visible college announcements separately.</p>
    <div aria-hidden="true" className="h-20 rounded-xl border border-border bg-surface p-5">
      <div className="h-6 w-44 rounded bg-muted motion-safe:animate-pulse" />
      <div className="mt-3 h-4 w-64 max-w-full rounded bg-muted motion-safe:animate-pulse" />
    </div>
    <div aria-hidden="true" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {learnerNotificationsLoadingSections.filter(x=>x.kind==="filter").flatMap(x=>
        Array.from({length:x.placeholders},(_,i)=>
          <div key={x.kind+":"+i} className="h-11 w-full rounded-full bg-muted motion-safe:animate-pulse sm:w-28"/>))}
    </div>
    <div aria-hidden="true" className="grid gap-3 sm:grid-cols-2">
      {learnerNotificationsLoadingSections.filter(x=>x.kind!=="filter").map(section=>(
        <section key={section.kind} className="min-w-0 space-y-3 rounded-xl border border-border bg-surface p-4">
          <div className="h-4 w-40 max-w-full rounded bg-muted motion-safe:animate-pulse"/>
          {Array.from({length:section.placeholders},(_,i)=>(
            <div key={i} className="h-24 rounded-lg border border-border bg-muted motion-safe:animate-pulse"/>
          ))}
        </section>
      ))}
    </div>
  </main>
 );
}
