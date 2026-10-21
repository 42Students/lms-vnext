import { useRef } from "react";
import { dj } from "./dj";
import { GRID_END_HOUR, GRID_START_HOUR, HOUR_PX, eventBox, gridHeight, isAllDay, layoutDay, nowOffset, slotFromOffset } from "./ui/calendarGrid";

const HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);
const hourLabel = (h) => dj().hour(h).minute(0).format("h A");

/**
 * The week as a time grid: days across, hours down. Click an empty spot to start something at that time; drag a draggable event
 * (a follow-up) to another day or time to move it. Deadlines and blocked dates sit in an all-day strip above the hours.
 *
 * Props: days (dayjs[]), events (already filtered), colorOf(event), renderEvent(event, style) -> node, canDrag(event),
 *        onSlotClick(dayjs), onDropEvent(event, dayjs), dragging, setDragging
 */
/** BE-0122: where Enter/Space on a day starts something: the next whole hour today, otherwise 10 AM (inside the grid). */
export function keyboardSlot(day, now = dj()) {
  const hour = day.isSame(now, "day") ? Math.min(Math.max(now.hour() + 1, GRID_START_HOUR), GRID_END_HOUR - 1) : Math.min(Math.max(10, GRID_START_HOUR), GRID_END_HOUR - 1);
  return day.hour(hour).minute(0).second(0).millisecond(0);
}

export default function WeekTimeGrid({ days, events, colorOf, renderEvent, canDrag, onSlotClick, onDropEvent, dragging, setDragging }) {
  const colRefs = useRef({});
  const today = dj();

  const offsetIn = (key, clientY) => {
    const el = colRefs.current[key];
    if (!el) return 0;
    return clientY - el.getBoundingClientRect().top;
  };

  return (
    <div className="tpo-timegrid" role="grid" aria-label="Week schedule">
      <div className="tpo-timegrid__head" role="row">
        <div className="tpo-timegrid__corner" />
        {days.map((d) => (
          <div key={d.format("YYYY-MM-DD")} role="columnheader" className={`tpo-timegrid__dayhead${d.isSame(today, "day") ? " is-today" : ""}`}>
            <span>{d.format("ddd")}</span><strong>{d.format("D")}</strong>
          </div>
        ))}
      </div>

      <div className="tpo-timegrid__allday" role="row">
        <div className="tpo-timegrid__corner">all day</div>
        {days.map((d) => (
          <div key={d.format("YYYY-MM-DD")} className="tpo-timegrid__allday-cell" role="gridcell">
            {events.filter((e) => isAllDay(e) && dj(e.startsAt).isSame(d, "day")).map((e) => renderEvent(e, { "--event-color": colorOf(e) }))}
          </div>
        ))}
      </div>

      <div className="tpo-timegrid__body" style={{ height: gridHeight() }}>
        <div className="tpo-timegrid__hours" aria-hidden="true">
          {HOURS.map((h) => <div key={h} style={{ height: HOUR_PX }}>{hourLabel(h)}</div>)}
        </div>
        {days.map((d) => {
          const key = d.format("YYYY-MM-DD");
          const laid = layoutDay(events.filter((e) => dj(e.startsAt).isSame(d, "day")));
          const nowTop = d.isSame(today, "day") ? nowOffset(today) : null;
          return (
            <div
              key={key}
              ref={(el) => { colRefs.current[key] = el; }}
              role="gridcell"
              tabIndex={0}
              aria-label={`${d.format("dddd D MMMM")}: click a time to add something, or press Enter to add one at ${keyboardSlot(d).format("h A")}`}
              onKeyDown={(ev) => {
                if (ev.target !== ev.currentTarget || (ev.key !== "Enter" && ev.key !== " ")) return;
                ev.preventDefault();
                onSlotClick(keyboardSlot(d));
              }}
              className={`tpo-timegrid__col${dragging ? " is-droppable" : ""}`}
              onClick={(ev) => { if (ev.target === ev.currentTarget) onSlotClick(slotFromOffset(d, offsetIn(key, ev.clientY))); }}
              onDragOver={(ev) => { if (dragging) ev.preventDefault(); }}
              onDrop={(ev) => { ev.preventDefault(); const e = dragging; setDragging(null); if (e) onDropEvent(e, slotFromOffset(d, offsetIn(key, ev.clientY))); }}
            >
              {HOURS.map((h) => <div key={h} className="tpo-timegrid__line" style={{ height: HOUR_PX }} />)}
              {nowTop != null && <div className="tpo-timegrid__now" style={{ top: nowTop }} />}
              {laid.map(({ event, lane, lanes }) => {
                const { top, height } = eventBox(event);
                return renderEvent(event, {
                  "--event-color": colorOf(event), position: "absolute", top, height,
                  left: `calc(${(lane * 100) / lanes}% + 2px)`, width: `calc(${100 / lanes}% - 4px)`,
                }, canDrag(event));
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
