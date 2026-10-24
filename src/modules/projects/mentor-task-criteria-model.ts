/** Markdown task criteria are persisted as a single text field.
 * Only explicit [ ]/[x] markers are treated as checkable. Plain text
 * remains plain text; never infer that finishing the task checks all criteria.
 */
export type MentorCriterionLine={
 index:number;text:string;checked:boolean;checkable:boolean;
};
const MARKER=/^(\s*(?:[-*]\s+)?\[)([ xX])(\]\s*.+)$/;
export function mentorCriteriaLines(raw:string|null):MentorCriterionLine[]{
 if(!raw?.trim())return [];
 return raw.split(/\r?\n/).map((line,index)=>{
  const match=MARKER.exec(line);
  return {index,text:match?match[3]!.replace(/^\]\s*/,""):line.trim(),
    checked:Boolean(match&&match[2]!.toLowerCase()==="x"),
    checkable:Boolean(match)};
 }).filter(line=>line.text.trim().length>0);
}
export function toggleMentorCriterion(raw:string|null,lineIndex:number):string|null{
 if(raw===null)return null;
 const lines=raw.split(/\r?\n/);
 const line=lines[lineIndex];
 if(line===undefined)return null;
 const marker=MARKER.exec(line);
 if(!marker)return null;
 lines[lineIndex]=marker[1]!+(marker[2]!.toLowerCase()==="x"?" ":"x")+
    marker[3]!;
 return lines.join("\n");
}
