export type PinnedAnnouncementCandidate={
 id:string;title:string;createdAt:string;source?:"ANNOUNCEMENT";pinned?:boolean;
};
/** Only authorized, actually pinned college announcements may be featured. */
export function learnerPinnedAnnouncementPreview<T extends PinnedAnnouncementCandidate>(items:readonly T[],limit=3):T[]{
 return items.filter(item=>item.source==="ANNOUNCEMENT"&&item.pinned===true)
  .sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||a.id.localeCompare(b.id))
  .slice(0,Math.min(3,Math.max(0,Math.floor(limit))));
}
