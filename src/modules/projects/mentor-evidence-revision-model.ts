export type MentorComparableEvidence={
 name:string;type:string;href:string|null;index:number;
};
export type MentorEvidenceChange="NEW"|"LINK_CHANGED"|"UNCHANGED"|"ORIGINAL";
/** Compares saved evidence *references* across revisions. This does NOT
 * inspect remote file contents or assert the contents were modified.
 * Duplicate/unnamed evidence is classified conservatively as NEW.
 */
export function compareMentorEvidenceReferences<T extends MentorComparableEvidence>(
 current:readonly T[],previous:readonly MentorComparableEvidence[]|null,
):Array<T&{change:MentorEvidenceChange}>{
 if(!previous)return current.map(item=>({...item,change:"ORIGINAL"}));
 const currentNames=new Map<string,number>();
 const previousNames=new Map<string,MentorComparableEvidence[]>();
 for(const row of current){
  const key=row.name.trim().toLocaleLowerCase("en-IN");
  currentNames.set(key,(currentNames.get(key)??0)+1);
 }
 for(const row of previous){
  const key=row.name.trim().toLocaleLowerCase("en-IN");
  const rows=previousNames.get(key)??[];
  rows.push(row);previousNames.set(key,rows);
 }
 return current.map(item=>{
  const key=item.name.trim().toLocaleLowerCase("en-IN");
  const matches=previousNames.get(key)??[];
  if(!key||currentNames.get(key)!==1||matches.length!==1)
   return {...item,change:"NEW"};
  const old=matches[0]!;
  return {...item,change:
    old.href===item.href&&old.type===item.type?"UNCHANGED":"LINK_CHANGED"};
 });
}
