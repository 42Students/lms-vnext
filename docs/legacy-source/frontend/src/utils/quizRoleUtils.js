/**
 * The quiz page opts out of the app's normal layout (StudentQuiz.nolayout = true), which is what
 * dispatches the current user's profile into Redux's loginUser on a fresh page load. That's fine
 * for ordinary in-app navigation (Redux state carries over across client-side route changes), but
 * the teacher/roadmap "preview" flow loads this page inside an <iframe> -- a genuinely separate
 * browsing context that never runs that bootstrap, so loginUser.userType stays undefined there
 * regardless of who's actually logged in. The access token's own JWT claims are reliable in every
 * context, so prefer decoding role from there and only fall back to Redux when no token is
 * available yet (e.g. the very first render, before any authenticated call has resolved).
 */
export function resolveEffectiveUserType(tokenPayload, loginUser) {
  return tokenPayload?.userType || loginUser?.userType || undefined;
}
