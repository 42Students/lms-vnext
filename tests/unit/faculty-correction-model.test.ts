import {describe,expect,it} from "vitest";
import {facultyCorrectionQuerySchema,facultyCorrectionSessionPage,facultyCorrectionHref}
  from "@/modules/attendance/faculty-correction-model";
const deliveryId="00000000-0000-4000-8000-000000000001";
describe("Faculty session correction availability model",()=>{
  const query={deliveryId,window:"ALL" as const,page:1};
  it("computes recorded window states without fabricating requests",()=>{
    const start=new Date("2026-10-14T08:00:00.000Z");
    const end=new Date("2026-10-14T09:00:00.000Z");
    const rows=[{id:deliveryId,title:"Lab",startsAt:start,endsAt:end,attendanceStatus:"MARKED"}];
    expect(facultyCorrectionSessionPage(rows,query,24,new Date("2026-10-14T10:00:00Z"))
      .items[0]?.window).toBe("OPEN");
    expect(facultyCorrectionSessionPage(rows,{...query,window:"WINDOW_EXPIRED"},24,
      new Date("2026-10-14T10:00:00Z")).total).toBe(0);
    expect(facultyCorrectionSessionPage([],query,24,new Date()).items).toEqual([]);
  });
  it("rejects arbitrary college/actor selectors",()=>{
    expect(facultyCorrectionQuerySchema.safeParse({deliveryId,collegeId:deliveryId}).success).toBe(false);
    expect(facultyCorrectionQuerySchema.safeParse({deliveryId,window:"REQUESTED"}).success).toBe(false);
    expect(facultyCorrectionQuerySchema.safeParse({deliveryId,page:0}).success).toBe(false);
    expect(facultyCorrectionHref({...query,window:"OPEN",page:2}))
      .toBe("/teacher/courses/"+deliveryId+"/attendance-corrections?window=OPEN&page=2");
  });
});
