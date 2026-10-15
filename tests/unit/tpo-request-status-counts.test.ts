import {it,expect} from "vitest";
import {tpoRequestStatusCounts,TPO_REQUEST_STATUSES} from "@/modules/placements/tpo-global-requests-model";
it("displays total authorized-college status counts, distinct from the paged selection",()=>{
 const totals=tpoRequestStatusCounts({pending:11,approved:3,rejected:2,cancelled:1});
 expect(TPO_REQUEST_STATUSES.map(status=>totals[status])).toEqual([11,3,2,1]);
});
