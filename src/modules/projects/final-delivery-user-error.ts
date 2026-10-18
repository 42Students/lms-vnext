import {FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";

/** Only intentional recovery wording may be exposed from local exceptions.
 * Unknown errors, network/provider failures and stack details stay private. */
export function finalDeliveryUserError(caught:unknown):string {
 if(caught instanceof FriendlyFetchError)return caught.message;
 if(caught instanceof Error&&[
  "Refresh this final draft to get its latest revision before saving.",
  "Could not confirm the draft revision. Refresh before editing again.",
 ].includes(caught.message))return caught.message;
 return friendlyApiError({});
}
