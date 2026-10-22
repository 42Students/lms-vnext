import type {DriveApplicationsQuery} from "@/modules/placements/college-drive-applications-model";
import {DRIVE_APPLICATION_PAGE_SIZE_OPTIONS} from "@/modules/placements/college-drive-applications-model";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";

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
  <Select id="applications-page-size" name="size"
    defaultValue={String(query.size??20)}
    >
   {DRIVE_APPLICATION_PAGE_SIZE_OPTIONS.map(size=><option key={size} value={size}>{size}</option>)}
  </Select>
  <span>per page</span>
  <Button type="submit" >
    Apply
  </Button>
 </form>;
}
