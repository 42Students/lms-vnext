import { z } from "zod";
export const tpoBatchProgramSchema = z.string().trim().max(100).default("");
export function listTpoBatchPrograms<T extends {program: string}>(rows:readonly T[]):string[] {
 return [...new Set(rows.map(row=>row.program))].sort((a,b)=>a.localeCompare(b,"en-IN"));
}
export function filterTpoBatchProgram<T extends {program:string}>(rows:readonly T[],program:string):T[] {
 return program ? rows.filter(row=>row.program===program) : [...rows];
}
