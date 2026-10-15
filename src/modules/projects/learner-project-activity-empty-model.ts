type State={valid:boolean;fetchedCount:number;pageCount:number;searching:boolean;filtered:boolean;olderPage:boolean;hasMore:boolean};
/** Loaded-page filters must not claim all Project history is empty when older records exist. */
export function learnerProjectActivityEmptyMessage(state:State):string {
 if(!state.valid)return "Apply a valid filter to view activity.";
 if(state.searching && state.pageCount>0)return "No events on this loaded page match your text. Clear the search or browse older activity pages.";
 if(state.fetchedCount>0)return "No events on this loaded page match the selected category. Clear the filter or browse older activity pages.";
 if(state.hasMore)return "No activity on this loaded page. Older Project activity may exist.";
 if(state.olderPage)return "No older activity found for this selection. Return to the newest activity page.";
 if(state.filtered)return "No activity matches these filters. Clear them to see recent activity.";
 return "No persisted Project activity yet.";
}
