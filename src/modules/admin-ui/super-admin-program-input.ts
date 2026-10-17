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
