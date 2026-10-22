/** Published/closed Quiz attempt limits are locked in the persisted service. */
export function facultyAssessmentLimitEditable(kind:"QUIZ"|"ASSIGNMENT",status:string){
 return kind==="ASSIGNMENT" || status==="DRAFT";
}
export function facultyAssessmentLimitPatch(
 kind:"QUIZ"|"ASSIGNMENT",status:string,value:number,
):{maxPoints:number}|{maxAttempts:number}|Record<string,never>{
 if(kind==="ASSIGNMENT")return {maxPoints:value};
 if(status==="DRAFT")return {maxAttempts:value};
 return {};
}

/** Archive is not deletion; an archived assessment is immutable. */
export function facultyAssessmentCanArchive(kind:"QUIZ"|"ASSIGNMENT",status:string){
 if(kind==="QUIZ")return ["DRAFT","PUBLISHED","CLOSED"].includes(status);
 return status==="DRAFT"||status==="PUBLISHED";
}

/** An edit response must identify the exact assessment and its persisted state. */
export function facultyAssessmentEditReceiptMatches(
 kind:"QUIZ"|"ASSIGNMENT",id:string,status:string,expectedTitle:string,raw:unknown,
):boolean {
 if(!raw||typeof raw!=="object")return false;
 const payload=raw as Record<string,unknown>;
 const entity=payload[kind==="QUIZ"?"quiz":"assignment"];
 if(!entity||typeof entity!=="object")return false;
 const row=entity as Record<string,unknown>;
 return row["id"]===id&&row["status"]===status&&row["title"]===expectedTitle &&
   typeof row["updatedAt"]==="string"&&Number.isFinite(Date.parse(row["updatedAt"]));
}

/** Archive never means deleting learner responses; demand the archived state receipt. */
export function facultyAssessmentArchiveReceiptMatches(
 kind:"QUIZ"|"ASSIGNMENT",id:string,title:string,raw:unknown,
){
 return facultyAssessmentEditReceiptMatches(kind,id,"ARCHIVED",title,raw);
}
