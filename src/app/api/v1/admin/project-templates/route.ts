/** Versioned legacy admin URL alias. Canonical auth, strict field validation,
 * membership scope and same-origin POST checks remain in the vNext handler.
 * Integer legacy detail IDs are not silently converted to tenant UUIDs. */
export {runtime,GET,POST} from "../../../projects/templates/route";
