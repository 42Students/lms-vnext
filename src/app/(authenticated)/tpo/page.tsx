import { redirect } from "next/navigation";
/** Route-only entry: /tpo/home owns the legacy shell and page canvas. */
export default function TpoIndex(){redirect("/tpo/home");}
