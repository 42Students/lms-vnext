import {redirect} from "next/navigation";

/** Legacy Drives bookmark; selected sidebar state belongs to the canonical list. */
export default function LegacyTpoDrivesPage(){
 redirect("/tpo/placements/lifecycle");
}
