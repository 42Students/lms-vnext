export default function TrackerIssueLoading(){
 return <div role="status" aria-label="Loading issue details" className="animate-pulse space-y-4">
  <div className="h-7 w-32 rounded bg-muted"/>
  <div className="h-9 w-2/3 rounded bg-muted"/>
  <div className="h-20 rounded bg-muted"/>
  <div className="h-36 rounded bg-muted"/>
  <span className="sr-only">Loading issue details…</span>
 </div>;
}
