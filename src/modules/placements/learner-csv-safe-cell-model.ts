/** CSV values are quoted and spreadsheet formula prefixes are neutralized.
 * Strip invisible leading format controls before deciding whether a cell is a formula.
 * This only operates on already authorized rows, never on a broader data source. */
export function learnerSafeCsvCell(raw:string):string{
 const normalized=raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu,"")
   .replace(/[\u200B-\u200D\u2060\uFEFF]/gu,"");
 const safe=/^[\s]*[=+\-@]/u.test(normalized)?"'"+normalized:normalized;
 return '"'+safe.replaceAll('"','""')+'"';
}
