import {it,expect} from "vitest";
import {tpoLiveAttendanceAttention} from "@/modules/placements/tpo-live-attendance-attention-model";
it("shows observed unknown and pending states without inventing a no-show",()=>{
 expect(tpoLiveAttendanceAttention({total:2,checkedIn:0,noShow:0,pending:0,unknown:2})).toMatch(/No attendance evidence/);
 expect(tpoLiveAttendanceAttention({total:3,checkedIn:1,noShow:0,pending:1,unknown:1})).toMatch(/unrecorded/);
 expect(tpoLiveAttendanceAttention({total:3,checkedIn:1,noShow:1,pending:1,unknown:0})).toMatch(/pending/);
 expect(tpoLiveAttendanceAttention({total:3,checkedIn:2,noShow:1,pending:0,unknown:0})).toMatch(/explicit no-shows/);
});
