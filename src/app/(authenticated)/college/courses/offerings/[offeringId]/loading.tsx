/** COL-courses-content-10 / GR-19: no blank offering detail while scoped data loads. */
export default function CollegeOfferingLoading(){
 return <section aria-busy="true" aria-label="Loading course details" className="space-y-5 p-4">
  <p role="status" className="sr-only">Loading course details…</p>
  <div aria-hidden="true" className="h-20 animate-pulse rounded-xl bg-muted"/>
  <div aria-hidden="true" className="h-12 animate-pulse rounded-xl bg-muted"/>
  <div aria-hidden="true" className="grid gap-4 md:grid-cols-2">
   <div className="h-48 animate-pulse rounded-xl bg-muted"/>
   <div className="h-48 animate-pulse rounded-xl bg-muted"/>
  </div>
 </section>;
}
