/** Machine-to-machine routes never accept a browser: any Origin header is a rejection. */
export function hasBrowserOrigin(request: Request): boolean {
  return request.headers.has("origin");
}
