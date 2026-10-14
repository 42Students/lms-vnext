/** Non-sensitive career profile coverage does not require optional identity numbers. */
export function learnerProfileCareerCoverage(input:{
  items:readonly {section:string;label:string;completed:boolean}[];
}){
  const career=input.items.filter(x=>x.section!=="identity");
  const completed=career.filter(x=>x.completed).length;
  const total=career.length;
  return {completed,total,percentage:total===0?null:Math.round(completed*100/total),
    next:career.find(x=>!x.completed)??null,
    optionalIdentityCompleted:input.items.find(x=>x.section==="identity")?.completed??false};
}
