export default function FacultyProfileDetailsLoading(){
 return <div role="status" className="space-y-4 p-5">
  <div className="h-8 w-56 animate-pulse rounded bg-muted"/>
  <div className="h-40 animate-pulse rounded-xl bg-muted"/>
  <span className="sr-only">Loading Faculty profile…</span>
 </div>;
}
