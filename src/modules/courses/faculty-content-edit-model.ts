import { authoringDueInstant } from "./faculty-authoring-datetime-model";
export type EditableContent = "RESOURCE" | "YOUTUBE" | "LIVE_CLASS" | "VIDEO";
export function facultyContentPatch(input: {
  kind: EditableContent;
  title: string;
  notes: string;
  url: string;
  duration?: string;
  starts?: string;
  ends?: string;
  hasStoredResource?: boolean;
  points?: string;
}) {
  const title = input.title.trim();
  const notes = input.notes.trim();
  const url = input.url.trim();
  if(input.points!==undefined&&!input.points.trim())throw new Error("Points are required.");
  const points = input.points===undefined ? undefined : Number(input.points);
  if (points !== undefined && (!Number.isInteger(points) || points < 0 || points > 1000))
    throw new Error("Points must be a whole number between 0 and 1000.");
  if (!title || title.length > 255) throw new Error("Title must have 1-255 characters.");
  if (notes.length > 5000) throw new Error("Notes cannot exceed 5000 characters.");
  if (input.kind !== "RESOURCE" && input.kind !== "VIDEO" && !url) throw new Error("An HTTPS URL is required.");
  if (url) {
    let parsed: URL;
    try { parsed = new URL(url); } catch { throw new Error("Enter a valid HTTPS URL."); }
    if (parsed.protocol !== "https:") throw new Error("Only HTTPS URLs are allowed.");
    if (parsed.username || parsed.password) throw new Error("Remove embedded credentials from the HTTPS URL.");
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (host === "localhost" || host.endsWith(".localhost") || host === "::1" ||
        host === "0.0.0.0" || /^127(?:\.\d{1,3}){3}$/.test(host))
      throw new Error("Use a publicly reachable HTTPS hostname.");
    if (input.kind === "YOUTUBE") {
      const host = parsed.hostname.toLowerCase();
      if (!["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be",
        "www.youtube-nocookie.com"].includes(host))
        throw new Error("Use a youtube.com or youtu.be link.");
    }
  }
  if(input.kind==="VIDEO") return {title,notes:notes||null,...(points===undefined?{}:{points})};
  const base = { title, notes: notes || null, externalUrl: url || null,...(points===undefined?{}:{points}) };
  if (input.kind === "RESOURCE") {
    if (!notes && !url && !input.hasStoredResource) throw new Error("Add notes or a resource link.");
    return base;
  }
  if (input.kind === "YOUTUBE") {
    if (!/^[1-9]\d*$/.test(input.duration ?? "")) throw new Error("Duration must be 1-86400 seconds.");
    const seconds = Number(input.duration);
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 86400)
      throw new Error("Duration must be 1-86400 seconds.");
    return { ...base, durationSeconds: seconds };
  }
  const startIso = authoringDueInstant(input.starts ?? "");
  const endIso = authoringDueInstant(input.ends ?? "");
  const start = new Date(startIso ?? "");
  const end = new Date(endIso ?? "");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start)
    throw new Error("End time must be after a valid start time.");
  return { ...base, startsAt: start.toISOString(), endsAt: end.toISOString() };
}

export type FacultyContentDraftSnapshot = {
  title:string; notes:string; url:string; duration:string; starts:string; ends:string; points?:string;
};
/** Compare the form values, not a guessed server revision. */
export function facultyContentDraftChanged(a:FacultyContentDraftSnapshot,b:FacultyContentDraftSnapshot){
  return a.title!==b.title || a.notes!==b.notes || a.url!==b.url ||
    a.duration!==b.duration || a.starts!==b.starts || a.ends!==b.ends || a.points!==b.points;
}

/** Closing must never drop a pending save or silently discard a changed form. */
export function facultyContentMayChangeOpen(
  nextOpen:boolean, changed:boolean, saving:boolean, confirmDiscard:()=>boolean,
){
  if(saving) return false;
  return nextOpen || !changed || confirmDiscard();
}

/** Success is only certain when the API acknowledges the requested content ID and fields. */
export function facultyContentSaveReceiptMatches(id:string, expected:ReturnType<typeof facultyContentPatch>, raw:unknown):boolean{
 if(typeof raw!=="object" || raw===null || !("content" in raw)) return false;
 const row=(raw as {content:unknown}).content;
 if(typeof row!=="object" || row===null) return false;
 const data=row as Record<string,unknown>;
 if(data.id!==id || data.title!==expected.title ||
    data.notes!==expected.notes || ("externalUrl" in expected && data.externalUrl!==expected.externalUrl)) return false;
 if("points" in expected && data.points!==expected.points) return false;
 if("durationSeconds" in expected && data.durationSeconds!==expected.durationSeconds) return false;
 if("startsAt" in expected && data.startsAt!==expected.startsAt) return false;
 if("endsAt" in expected && data.endsAt!==expected.endsAt) return false;
 return true;
}

/** A React render may lag behind the request: the synchronous ref is authoritative. */
export function facultyContentMaySave(pending:boolean,locked:boolean,dirty:boolean){
 return !pending && !locked && dirty;
}

/** Only show a deletion outcome after the server has confirmed the delete.
 * Historical YouTube edit surface used this exact copy for 2000 milliseconds.
 */
export const FACULTY_YOUTUBE_DELETE_FEEDBACK = {
 success:"YouTube video deleted successfully",
 failure:"Failed to delete",
 durationMs:2000,
} as const;

/** Exact legacy YoutubeDrawer affordances, separate from the learner player.
 * Source: legacy frontend syllabus/youtube.js and YoutubeDrawer.jsx. */
export const FACULTY_YOUTUBE_DRAWER_CONTRACT={
 drawerWidthPx:600,
 createTitle:"New Youtube Video",
 editTitle:"Update Youtube Video",
 cancelButton:"Cancel",
 submitButton:"Submit",
 titleLabel:"Youtube Video Title",
 titlePlaceholder:"Enter Youtube Video Title",
 pointsLabel:"Points",
 pointsPlaceholder:"Enter Points",
 urlLabel:"Youtube Video Link",
 requiredTitle:"Enter Content Title",
 requiredUrl:"Enter youtube link",
 invalidUrl:"Paste a YouTube video link (watch, youtu.be or Shorts)",
 deleteTitle:"Delete the YouTube video",
 deleteDescription:"Are you sure you want to delete this YouTube video?",
 confirmButton:"Yes",
 cancelDeleteButton:"No",
 refreshOnDrawerClose:true,
} as const;

export type FacultyContentAction="EDIT"|"DELETE";
export function facultyYoutubeActions(actorRoles:readonly string[]):readonly FacultyContentAction[]{
 return actorRoles.includes("FACULTY")?["EDIT","DELETE"]:[];
}
export function facultyYoutubeEditDefaults(content:{
 contentTitle?:string|null;points?:number|null;
 contentDataDTO?:{link?:string|null;html_content?:string|null;
  file_dto?:{cloud_storage_object?:string|null}|null}|null;
}):{contentTitle:string;points:string;youtubeLink:string}{
 const data=content.contentDataDTO;
 return {
  contentTitle:content.contentTitle??"",
  points:content.points==null?"":String(content.points),
  youtubeLink:data?.link||data?.html_content||data?.file_dto?.cloud_storage_object||"",
 };
}
/** Use only after the matching content ID has been confirmed removed by the
 * scoped authoring mutation; do not refetch on API failure or optimistic click. */
export function facultyYoutubeDeleteReceiptMatches(id:string,raw:unknown):boolean{
 if(typeof raw!=="object"||raw===null)return false;
 const data=raw as Record<string,unknown>;
 return data.deleted===true&&(data.id===id||data.contentId===id);
}
