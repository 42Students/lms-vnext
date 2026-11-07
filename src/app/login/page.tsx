import type { Metadata } from "next";
import { generateMetadata as sharedLoginMetadata } from "../page";

// The anonymous platform root is marketing, while /login always remains the
// dedicated OTP entry route. Preserve verified tenant branding, but keep a
// credential-entry form out of search-engine indexes.
export { default } from "../page";

export async function generateMetadata(
  args: Parameters<typeof sharedLoginMetadata>[0],
): Promise<Metadata> {
  const metadata = await sharedLoginMetadata(args);
  return {
    ...metadata,
    robots: { index: false, follow: false, noarchive: true },
  };
}
