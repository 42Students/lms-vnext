export default function LearnerApplicationDetailLoading(){
  return <div aria-busy="true" className="animate-pulse space-y-4">
    <div className="h-8 w-60 max-w-full rounded bg-muted"/>
    <div className="h-32 rounded-xl border border-border bg-surface"/>
    <div className="h-64 rounded-xl border border-border bg-surface"/>
  </div>;
}