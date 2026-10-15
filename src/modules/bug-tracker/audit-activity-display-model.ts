/** A note supplements a transition; it must not be hidden when both exist. */
export function auditActivityTransition(activity:{fromValue:string|null;toValue:string|null}):string{
 if(activity.fromValue&&activity.toValue)return activity.fromValue+" → "+activity.toValue;
 if(activity.fromValue)return activity.fromValue+" → (cleared)";
 if(activity.toValue)return "(unset) → "+activity.toValue;
 return "Workflow update";
}
