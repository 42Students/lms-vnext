type Choice={title:string;courseName:string;sectionName:string};
export function facultyLiveConfirmText(
 action:"CREATE"|"EDIT"|"CANCEL",session:Choice|undefined,lessonTitle:string,
):string{
 if(action==="CREATE")return "Schedule a new published live class for lesson: "+lessonTitle+"?";
 if(!session)return "No published live class selected.";
 const target='"'+session.title+'" ('+session.courseName+" · "+session.sectionName+")";
 return action==="CANCEL" ?
  "Cancel "+target+"? It will no longer appear as a published live class.":
  "Save schedule changes to "+target+"?";
}
