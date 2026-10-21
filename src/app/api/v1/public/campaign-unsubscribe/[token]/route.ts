/** Legacy Spring-compatible path: POST /api/v1/public/campaign-unsubscribe/{token}.
 * Forward to the single same-origin, token-verified and durable vNext handler.
 * The nested adapter returns JSON 200 only after confirmed persistence. */
export {POST,runtime} from "../../../../public/campaign-unsubscribe/[token]/route";
