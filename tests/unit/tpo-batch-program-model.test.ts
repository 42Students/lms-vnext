import {it,expect} from "vitest";
import {tpoBatchProgramSchema,listTpoBatchPrograms,filterTpoBatchProgram} from "@/modules/placements/tpo-batch-program-model";
it("filters exactly by authorized program and preserves input",()=>{const rows=[{program:"MBA"},{program:"BTech"},{program:"MBA"}];expect(listTpoBatchPrograms(rows)).toEqual(["BTech","MBA"]);expect(filterTpoBatchProgram(rows,"MBA")).toHaveLength(2);expect(filterTpoBatchProgram(rows,"unknown")).toEqual([]);expect(rows).toHaveLength(3);});
it("rejects oversized program URL input",()=>{expect(tpoBatchProgramSchema.safeParse("x".repeat(101)).success).toBe(false);expect(tpoBatchProgramSchema.parse(undefined)).toBe("");});
