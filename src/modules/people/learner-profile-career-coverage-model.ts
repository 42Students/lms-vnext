/** Legacy learner profile weights, applied only to non-sensitive career fields.
 * Aadhaar/PAN deliberately remain optional and excluded from a job-facing score.
 * Extra vNext introduction/metadata sections remain visible but don't inflate it. */
export const learnerCareerSectionWeights:Readonly<Record<string,number>>={
 "personal-details":15,contacts:10,address:5,education:15,skills:10,
 experiences:10,projects:10,certifications:5,achievements:5,
 languages:3,extracurriculars:3,hobbies:2,"social-profiles":2,
};
export function learnerCareerCompletionMessage(percentage:number){
 if(percentage===100)return "Excellent! Your profile is complete!";
 if(percentage>=80)return "Great job! Almost there!";
 if(percentage>=60)return "Good progress! Keep going!";
 if(percentage>=40)return "You are on your way! Add more details.";
 if(percentage>=20)return "Good start! Complete your profile to stand out.";
 return "Welcome! Let's build your profile together.";
}
/** Weighted career coverage is not placement eligibility or verification. */
export function learnerProfileCareerCoverage(input:{
 items:readonly {section:string;label:string;completed:boolean}[];
}){
 const career=input.items.filter(item=>item.section!=="identity");
 const completed=career.filter(item=>item.completed).length;
 const total=career.length;
 const weightTotal=career.reduce((sum,item)=>sum+(learnerCareerSectionWeights[item.section]??0),0);
 const weightDone=career.reduce((sum,item)=>sum+(item.completed?(learnerCareerSectionWeights[item.section]??0):0),0);
 const percentage=weightTotal===0?null:Math.round(100*weightDone/weightTotal);
 const next=[...career].filter(item=>!item.completed)
   .sort((a,b)=>(learnerCareerSectionWeights[b.section]??0)-(learnerCareerSectionWeights[a.section]??0))[0]??null;
 return {completed,total,percentage,weightDone,weightTotal,next,
  optionalIdentityCompleted:input.items.find(item=>item.section==="identity")?.completed??false};
}
