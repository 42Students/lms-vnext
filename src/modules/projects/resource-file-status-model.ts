import type {ProjectResourceFile} from "./resource-file-list-model";
export type FileBadgeTone="info"|"warning"|"success"|"neutral"|"error";
const STATES:Record<ProjectResourceFile["status"],{label:string;tone:FileBadgeTone;detail:string;downloadable:boolean}>={
 QUEUED:{label:"Queued",tone:"neutral",detail:"Upload is waiting to start.",downloadable:false},
 UPLOADING:{label:"Uploading",tone:"info",detail:"File transfer is in progress.",downloadable:false},
 VERIFYING:{label:"Checking file",tone:"info",detail:"Uploaded data is not cleared for access.",downloadable:false},
 READY:{label:"Available",tone:"success",detail:"File passed backend verification.",downloadable:true},
 QUARANTINED:{label:"Blocked",tone:"warning",detail:"File failed verification and cannot be opened.",downloadable:false},
 FAILED:{label:"Failed",tone:"error",detail:"Upload failed. Retry with a new upload.",downloadable:false},
 DELETED:{label:"Removed",tone:"neutral",detail:"This file is no longer available.",downloadable:false},
};
/** Status never authorizes a download; storage must independently verify tenant and role. */
export function resourceFileBadge(status:ProjectResourceFile["status"]){return STATES[status];}
