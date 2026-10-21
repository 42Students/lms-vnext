/** Legacy /learn returned HTTP 302 Found to /learn/courses.
 * Route handlers do not render authenticated layouts, but this GET returns no
 * protected data: the destination's learner layout rechecks the active role,
 * membership and session before displaying any content. */
export function GET(request: Request): Response {
  return Response.redirect(new URL("/learn/courses", request.url), 302);
}
