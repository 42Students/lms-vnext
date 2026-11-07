import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * UX-G185 browser acceptance fixture. This route cannot be activated in a
 * production build, even by setting the fixture environment variable.
 * The exception contains only synthetic text and no private data.
 */
export default function RootErrorFixture() {
  if (process.env.NODE_ENV !== "development" ||
      process.env.UX_ROOT_ERROR_FIXTURE !== "1") {
    notFound();
  }
  throw new Error("SYNTHETIC_TEST_ERROR_DO_NOT_DISPLAY");
}
