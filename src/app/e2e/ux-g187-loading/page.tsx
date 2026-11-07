import { notFound } from "next/navigation";
import Loading from "@/app/loading";

export const dynamic = "force-dynamic";
export default function UXG187LoadingFixture() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Loading />;
}
