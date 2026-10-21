/** Legacy Super Admin inputs; backend retains its integer-term model. */
export function validLegacyProgramYears(raw: string): boolean {
  const value=Number(raw);
  return raw.trim()!=="" && Number.isInteger(value) && value>=1 && value<=10;
}
export function deriveSuperAdminProgramCode(name:string):string {
 const words=name.normalize("NFKD").match(/[A-Za-z0-9]+/g)??[];
 const code=words.length>1?words.map(x=>x[0]).join(""):(words[0]??"");
 return code.toUpperCase().slice(0,64);
}

// Generated codes are convenience values; the active department owns identity.
// Use stable suffixes for known collisions and let DB uniqueness handle races.
export function availableSuperAdminProgramCode(
 name: string, departmentId: string,
 programs: readonly { departmentId: string; code: string }[],
): string {
 const base=deriveSuperAdminProgramCode(name)||"PROGRAM";
 const used=new Set(programs.filter(p=>p.departmentId===departmentId)
  .map(p=>p.code.toUpperCase()));
 if(!used.has(base))return base;
 for(let index=2;index<=9999;index++){
  const suffix=String(index);
  const candidate=base.slice(0,64-suffix.length)+suffix;
  if(!used.has(candidate))return candidate;
 }
 return base;
}
