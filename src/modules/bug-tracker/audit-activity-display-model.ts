/** Legacy 42 Tracker activity text, with the same four branches used in
 * ActivityTimeline.jsx. The surrounding timeline retains actor and IST date. */
const statusLabels:Record<string,string>={
 NEW:"New",CHECKING:"Checking",FIXING:"Fixing",
 READY_FOR_RETEST:"Ready for Retest",CLOSED:"Closed",
};
const resolutionLabels:Record<string,string>={
 FIXED:"Fixed",DUPLICATE:"Duplicate",NOT_A_BUG:"Not a Bug",
 CANNOT_REPRODUCE:"Cannot Reproduce",WONT_FIX:"Won't Fix",
};
function label(value:string|null,lookup:Record<string,string>,missing:string){
 return value?lookup[value]??value:missing;
}
export function auditActivityText(activity:{
 type:string;fromValue:string|null;toValue:string|null;
}):string{
 if(activity.type==="RETEST"||activity.type==="RETEST_COMPLETED"){
  return activity.toValue==="CLOSED / FIXED"||activity.toValue==="PASS"?
   "Retest passed — issue closed":"Retest failed — returned to Fixing";
 }
 if(activity.type==="STATUS_CHANGED")return
  "Status changed from "+label(activity.fromValue,statusLabels,"Unknown")+
  " to "+label(activity.toValue,statusLabels,"Unknown");
 if(activity.type==="RESOLUTION_CHANGED")return
  "Resolution changed from "+label(activity.fromValue,resolutionLabels,"None")+
  " to "+label(activity.toValue,resolutionLabels,"None");
 return activity.type||"Activity";
}
/** A note supplements a transition; it must not be hidden when both exist. */
export function auditActivityTransition(activity:{fromValue:string|null;toValue:string|null}):string{
 if(activity.fromValue&&activity.toValue)return activity.fromValue+" → "+activity.toValue;
 if(activity.fromValue)return activity.fromValue+" → (cleared)";
 if(activity.toValue)return "(unset) → "+activity.toValue;
 return "Workflow update";
}
