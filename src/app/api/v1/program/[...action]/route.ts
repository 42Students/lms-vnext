/** Historical /api/v1/program endpoints are the same college-scoped
 * compatibility surface as /api/v1/new-program. No unscoped global reads or
 * numeric-ID mutations are reintroduced by this alias. */
export {GET, POST, PUT, DELETE} from "@/app/api/v1/new-program/[...action]/route";
