import type {DriveApplicationsQuery} from "@/modules/placements/college-drive-applications-model";
import {DRIVE_APPLICATION_PAGE_SIZE_OPTIONS} from "@/modules/placements/college-drive-applications-model";

/** Preserves all authorized filters when switching the legacy table page size.
 * The page number intentionally resets to one; selection is scoped to the
 * new filter key, not carried onto a different page of another applicant set. */
export function CollegeDriveApplicationsSizeControl({
 action,query,
}:{action:string;query:DriveApplicationsQuery}){
 return <form method="get" action={action} aria-label="Applications page size"
   className="flex flex-wrap items-center gap-2 text-sm text-body">
  {Object.entries(query).filter(([key,value])=>
    key!=="size"&&key!=="page"&&value!==undefined&&value!==null&&
    String(value)!==""&&String(value)!=="ALL")
    .map(([key,value])=><input key={key} type="hidden" name={key} value={String(value)}/>)}
  <label htmlFor="applications-page-size" className="font-semibold">Show</label>
  <select id="applications-page-size" name="size"
    defaultValue={String(query.size??20)}
    className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-white px-2 text-sm md:min-h-9">
   {DRIVE_APPLICATION_PAGE_SIZE_OPTIONS.map(size=><option key={size} value={size}>{size}</option>)}
  </select>
  <span>per page</span>
  <button type="submit" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-white px-3 font-semibold text-link hover:bg-primary-subtle md:min-h-9">
    Apply
  </button>
 </form>;
}
