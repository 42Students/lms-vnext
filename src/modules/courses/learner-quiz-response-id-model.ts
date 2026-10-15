import {z} from "zod";
/** Reject a mismatched or malformed GET response before restoring any draft or answers. */
export function requireLearnerQuizResponseId(requestedId:string,responseId:unknown):void {
 const parsed=z.string().uuid().safeParse(responseId);
 if(!parsed.success || parsed.data!==requestedId)throw new Error("Quiz response does not match the requested quiz.");
}
