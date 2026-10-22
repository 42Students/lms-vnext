/** Historic Company Team threads used a college-scoped, normalized company
 * name. This model is for navigation/import crosswalks only: a name is never
 * authority to read a private conversation and ambiguous names fail closed. */
export function legacyCompanyTeamName(raw:unknown):string|null{
 if(typeof raw!=="string"||raw.length===0||raw.length>150||/[\x00-\x1f\x7f]/.test(raw))return null;
 const value=raw.trim().replace(/\s+/g," ");
 return value.length>0&&value.length<=150?value.toLowerCase():null;
}
export function uniqueLegacyCompanyTeamId(
 rows:readonly {id:string;name:string}[],legacyName:unknown,
):string|null{
 const key=legacyCompanyTeamName(legacyName);
 if(!key)return null;
 const matches=new Set(rows.filter(row=>legacyCompanyTeamName(row.name)===key).map(row=>row.id));
 return matches.size===1?[...matches][0]!:null;
}
