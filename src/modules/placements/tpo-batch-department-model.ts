import { z } from "zod";
export const tpoBatchDepartmentSchema = z.string().trim().max(100).default("");
export function listTpoBatchDepartments<T extends {department:string}>(rows:readonly T[]):string[] {
 return [...new Set(rows.map(row=>row.department))].sort((a,b)=>a.localeCompare(b,"en-IN"));
}
export function filterTpoBatchDepartment<T extends {department:string}>(rows:readonly T[],department:string):T[] {
 return department ? rows.filter(row=>row.department===department) : [...rows];
}
