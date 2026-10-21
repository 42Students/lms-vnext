import {GET as getProjectTemplate} from "../route";

/** Legacy preview bookmark: the canonical GET authorizes and scopes every
 * read, including imported template IDs resolved before reaching this route. */
export const GET=getProjectTemplate;
