/** T-S2-01: bounded literal search; never treat users' wildcards as SQL syntax. */
export function normalizeTpoFinderTerm(raw:string):string{
 const term=raw.trim().toLowerCase();
 if(term.length<1||term.length>100)throw new Error("TPO_FIND_INVALID_QUERY");
 return term;
}
