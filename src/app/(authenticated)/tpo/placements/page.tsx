import { redirect } from "next/navigation";

/** The sidebar Drives entry opens the actual drive list, not an unrelated dashboard. */
export default function TpoPlacementsPage() {
  redirect("/tpo/placements/lifecycle");
}
