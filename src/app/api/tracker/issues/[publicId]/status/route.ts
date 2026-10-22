/** Legacy tracker status-only URL: the shared workflow handler enforces
 * origin, signed-in Super Admin scope and required expectedVersion CAS.
 * This alias does not restore the unsafe unversioned Spring update API. */
export {PATCH} from "../workflow/route";
export const runtime="nodejs";
