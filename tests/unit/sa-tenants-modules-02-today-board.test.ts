import {it,expect} from "vitest";
import {istDayBounds,SUPER_ADMIN_TODAY_LABELS} from "@/modules/colleges/admin-today-attention-model";
it("SA-tenants-modules-02 computes exact IST calendar day and six attention cards",()=>{
 const b=istDayBounds(new Date("2026-10-16T20:00:00Z"));
 expect(b.from.toISOString()).toBe("2026-10-16T18:30:00.000Z");
 expect(b.to.toISOString()).toBe("2026-10-17T18:30:00.000Z");
 expect(SUPER_ADMIN_TODAY_LABELS).toHaveLength(6);
});
