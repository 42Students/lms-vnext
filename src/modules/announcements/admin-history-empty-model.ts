export function announcementHistoryEmptyMessage({hasFilters}:{hasFilters:boolean}){
 return hasFilters
  ? "No announcements match the selected filters. Clear filters above to return to the full authorized history."
  : "No announcements have been published in this authorized scope yet.";
}
