import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";

export async function projectApiError(response: Response): Promise<string> {
 try {
  const data:unknown=await response.json();
  const code=data&&typeof data==="object"&&"error" in data&&typeof data.error==="string"?data.error:null;
  return friendlyApiError({status:response.status,code});
 } catch{return friendlyApiError({status:response.status});}
}

export async function projectMutation(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
) {
  return apiFetch<Awaited<ReturnType<Response["json"]>>>(path, {
    method,
    ...(body === undefined ? {} : {
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(body),
    }),
  });
}
