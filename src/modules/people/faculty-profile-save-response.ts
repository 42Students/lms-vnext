import {emptyFacultyProfileDocument,facultyProfileDocumentSchema,type FacultyProfileDocument} from "./faculty-profile-document";

/** Protect local Faculty drafts from a malformed 2xx response. */
export class FacultyProfileSaveResponseError extends Error {
 constructor(){super("PROFILE_SAVE_RESPONSE_INVALID");}
}
export type FacultyProfileSaveReceipt={document:FacultyProfileDocument;version:number};
export function facultyProfileSaveReceipt(raw:unknown,expectedVersion:number):FacultyProfileSaveReceipt {
 if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new FacultyProfileSaveResponseError();
 const payload=raw as Record<string,unknown>;
 if(!payload.document||typeof payload.document!=="object"||Array.isArray(payload.document))
  throw new FacultyProfileSaveResponseError();
 const persisted=payload.document as Record<string,unknown>;
 if(Object.keys(emptyFacultyProfileDocument).some(key=>!Object.hasOwn(persisted,key)))
  throw new FacultyProfileSaveResponseError();
 const parsed=facultyProfileDocumentSchema.safeParse(persisted);
 if(!parsed.success)throw new FacultyProfileSaveResponseError();
 if(typeof payload.version!=="number"||!Number.isSafeInteger(payload.version)||
    payload.version!==expectedVersion+1)throw new FacultyProfileSaveResponseError();
 return {document:parsed.data,version:payload.version};
}
