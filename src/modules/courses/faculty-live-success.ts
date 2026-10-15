export function facultyLiveMutationSuccess(action:"CREATE"|"EDIT"|"CANCEL"):string {
 switch(action){
  case "CREATE":return "Live class scheduled. The list is refreshing.";
  case "EDIT":return "Live class updated. The list is refreshing.";
  case "CANCEL":return "Live class cancelled. The list is refreshing.";
 }
}
