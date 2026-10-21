package com._42students.lms.dto.request;

import lombok.Data;

/**
 * A frontend-observed problem, reported by the browser itself: an uncaught JS exception, a
 * console.error call, a failed API response, a failed resource load, or an auth failure that hit
 * mid-action rather than on page load. Deliberately does NOT carry an account/role field -- that
 * comes from the caller's own authenticated principal, never from the client, so a report can't be
 * spoofed as belonging to someone else.
 */
@Data
public class ClientErrorReportRequest {
    /** One of: JS_ERROR, UNHANDLED_REJECTION, CONSOLE_ERROR, API_FAILURE, RESOURCE_LOAD_FAILURE, AUTH_FAILURE. */
    private String type;
    private String message;
    private String stack;
    /** The page/route the browser was on when this happened, e.g. "/dashboard/course/55". */
    private String page;
    /** For API_FAILURE only: the endpoint that failed and the status code it returned. */
    private String endpoint;
    private Integer statusCode;
    /** A per-build identifier baked in at frontend build time -- ties a report to the deploy that caused it. */
    private String buildVersion;
    private String browser;
    private String viewport;
}
