import {NextResponse} from "next/server";

/** Account-security device responses must never enter a browser/shared cache. */
export function privateAuthResponse<T>(response:NextResponse<T>):NextResponse<T> {
  response.headers.set("Cache-Control","private, no-store");
  return response;
}

/** Login/challenge responses contain sensitive account state, even on failures. */
export function privateAuthJson(body:unknown,init?:ResponseInit):NextResponse<unknown> {
  return privateAuthResponse(NextResponse.json(body,init));
}
