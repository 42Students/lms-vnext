/** Legacy syllabus item aliases are resolved before building a vNext
 * learning-path item. Unknown items are visible as diagnostics, not silently
 * coerced into a downloadable content type. */
export type LegacySyllabusKind="CONTENT"|"ASSIGNMENT"|"QUIZ"|"UNSUPPORTED";
export function legacySyllabusKind(value:string):LegacySyllabusKind{
 switch(value.trim().toLowerCase().replaceAll("-","_")){
  case "resource":case "notes":case "material":
  case "video":case "youtube":case "youtube_video":
  case "live_class":case "liveclass":return "CONTENT";
  case "assignment":case "assessment":return "ASSIGNMENT";
  case "quiz":case "quiz_v2":case "quizv2":return "QUIZ";
  default:return "UNSUPPORTED";
 }
}

export type SyllabusProgressItem={
 id:string;
 kind:"CONTENT"|"ASSIGNMENT"|"QUIZ";
 progress:{status:string};
};
export function selectedLessonCompletion(
 items:readonly SyllabusProgressItem[],
 completeStateKnown:boolean,
){
 const completed=items.filter(item=>item.progress.status==="COMPLETED").length;
 const total=items.length;
 // Do not claim completion on a partial roster, missing quiz-attempt query
 // or failed assignment-submission read. Content can still be opened.
 const nextIncomplete=completeStateKnown
  ?items.find(item=>item.progress.status==="NOT_STARTED"||
    item.progress.status==="IN_PROGRESS")??null:null;
 return {
  completed:completeStateKnown?completed:null,
  total:completeStateKnown?total:null,
  percent:completeStateKnown&&total>0?Math.round(completed/total*100):null,
  complete:completeStateKnown&&total>0&&completed===total,
  nextIncomplete,
  stateKnown:completeStateKnown,
 };
}
