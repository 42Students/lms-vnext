import { randomUUID } from "node:crypto";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import { createInternalRoute } from "@/security/internal-route-core";

/** The one way to define a machine-to-machine route. See docs/security/central-security-architecture.md (L10). */
export const internalRoute = createInternalRoute({
  readSecret: (name) => process.env[name],
  readJson: readBoundedJsonBody,
  onError: apiErrorResponse,
  newRequestId: () => randomUUID(),
  onDenied: (event) => {
    // Structured, secret-free denial record; the credential is never logged.
    console.warn(JSON.stringify({ severity: "WARNING", event: "internal.route_denied", ...event }));
  },
});
