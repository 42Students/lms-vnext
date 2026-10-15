import {it,expect} from "vitest";
import {tpoBatchDepartmentSchema,listTpoBatchDepartments,filterTpoBatchDepartment} from "@/modules/placements/tpo-batch-department-model";
it("combines exact department filtering with no cross-record mutation",()=>{const rows=[{department:"CSE"},{department:"ECE"},{department:"CSE"}];expect(listTpoBatchDepartments(rows)).toEqual(["CSE","ECE"]);expect(filterTpoBatchDepartment(rows,"CSE")).toHaveLength(2);expect(filterTpoBatchDepartment(rows,"Electrical")).toEqual([]);expect(rows).toHaveLength(3);});
it("rejects invalid URL filters",()=>{expect(tpoBatchDepartmentSchema.safeParse("x".repeat(101)).success).toBe(false);expect(tpoBatchDepartmentSchema.parse(undefined)).toBe("");});
