export function superAdminStudentBulkFailure(status:number):string{
 if(status===401||status===403)
   return "Your access changed. Refresh the page and select a college before retrying.";
 if(status===409)
   return "Student access changed. Reload the roster and review your selection before retrying.";
 if(status===400||status===422)
   return "Check the selected students and module access choice, then try again.";
 return "Cannot update selected student overrides. Refresh this college and retry.";
}

export function bulkStudentSelectionIsCurrent(
 selected:readonly string[],
 visibleIds:readonly string[],
):boolean{
 const visible=new Set(visibleIds);
 return selected.length>0&&selected.length<=25&&
  new Set(selected).size===selected.length&&
  selected.every(id=>visible.has(id));
}
