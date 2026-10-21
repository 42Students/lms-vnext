# Lane chat-19 cross-lane handoffs

- `src/app/api/placements/tpo/students/[membershipId]/debarments/route.ts` (G2-5-022-021/-022): legacy POST created 201+entity / lifted 204+empty, while vNext always emits 200 `{rows}`. Decide explicit compatibility endpoint/handling without breaking the vNext client; service functions already return the current row.
- `src/app/(authenticated)/tpo/calendar/page.tsx` + `src/components/placements/placement-calendar-workspace.tsx` (G2-5-012-077): server currently chooses default by user-agent. Use `tpoCalendarViewForViewport(window.innerWidth, explicitUrlView)` in client-owned calendar navigation/view initialization so narrow desktop and resized windows select Agenda at <768px; preserve explicit URL `view` and avoid hydration mismatch.
