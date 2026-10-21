/** Legacy tracker status-only URL: the shared workflow handler enforces
 * origin, signed-in Super Admin scope and required expectedVersion CAS.
 * This alias does not restore the unsafe unversioned Spring update API. */
export {runtime,PATCH} from "../workflow/route";
