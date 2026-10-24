import { Suspense } from "react";
import { redirect } from "next/navigation";
import {TpoPrototypeSectionTabs} from "@/components/tpo/tpo-prototype-section-tabs";
import { getCurrentRequestContext } from "@/auth/request-context";
import { canOpenTpoWorkspace, hasTpoTooling } from "@/modules/placements/tpo-workspace-access-model";
import { TpoKeyboardShortcuts } from "@/components/tpo/tpo-keyboard-shortcuts";
import { TpoMobileFooter } from "@/components/tpo/tpo-mobile-footer";
import { deniedPortalHome } from "@/modules/identity/unauthorized-portal-home";

/** The global 68px topbar now owns Find, +New, Messages and Notifications.
 * Keep the TPO-specific keyboard handler and mobile footer without painting
 * a second command/notification strip inside the single page canvas.
 */
export default async function TpoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const context = await getCurrentRequestContext();
  if (!canOpenTpoWorkspace(context)) redirect(deniedPortalHome(context));
  if (!hasTpoTooling(context))
    return <div className="min-w-0 space-y-4 pb-20 md:pb-0">{children}</div>;
  return <div className="min-w-0 space-y-4">
    <TpoKeyboardShortcuts showTrigger={false}/>
    <Suspense fallback={null}><TpoPrototypeSectionTabs/></Suspense>
    {children}
    <TpoMobileFooter/>
  </div>;
}
