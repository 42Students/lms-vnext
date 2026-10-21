import { useEffect } from "react";
import Router from "next/router";

// Shared by the template/workspace create+edit forms — each is long enough (multiple sections,
// repeating sprint/task/resource rows) that losing it to an accidental tab close or a
// misclicked "Cancel"/"Back" link was a real, reported failure mode, not a hypothetical one.
//
// Guards BOTH ways out of a page:
//   - `beforeunload` for a real unload (tab close, reload, typed URL);
//   - `routeChangeStart` for a Next client-side navigation.
//
// The second half exists because the projects module was split into section pages, which made
// tab-switching the primary interaction and moved "Back" into the shells. Both are client-side, so
// with only `beforeunload` a half-filled sprint table vanished on a stray tab click with no
// prompt. Handling it here rather than in each shell means the tab strip, the Back button and the
// sidebar are all covered at once, and every page that already calls this hook gets it for free.
export function useUnsavedFormGuard(form, { enabled = true } = {}) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;

    const handleBeforeUnload = (event) => {
      if (!form.isFieldsTouched()) return;
      event.preventDefault();
      // Chrome requires returnValue to be set (to any non-empty string) to show its own
      // native "leave site?" prompt — the string itself is never displayed to the user.
      event.returnValue = "";
    };

    const handleRouteChangeStart = (url) => {
      if (!form.isFieldsTouched()) return;
      // Next has no "cancel navigation" API; throwing from this handler is the documented way to
      // abort one.
      if (window.confirm("You have unsaved changes. Leave without saving them?")) return;
      // Only restore the address bar when the browser has ALREADY moved it — which is true for a
      // Back/Forward press (the URL changes first, then Next routes) and false for an in-app
      // navigation like a tab click (routeChangeStart fires before the URL moves).
      //
      // The earlier version of this compared against the target `url`, which is always different
      // from where we are, so it also ran on tab clicks — pushing a duplicate of the current entry
      // onto the history stack every time someone cancelled. Back then appeared to do nothing on
      // the first press. Comparing against the live address bar tells the two cases apart.
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) {
        window.history.pushState(null, "", Router.asPath);
      }
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted by unsaved-changes guard.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    Router.events.on("routeChangeStart", handleRouteChangeStart);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      Router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, [form, enabled]);
}

// Guards an in-app navigation (a "Cancel"/"Back to X" link) that would otherwise discard a
// dirty form silently, since beforeunload only fires on a real page unload/reload — not on
// Next.js client-side route changes.
export const confirmDiscardIfDirty = (form, message = "You have unsaved changes. Leave without saving them?") =>
  !form.isFieldsTouched() || window.confirm(message);
