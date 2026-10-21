package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Slots, room/slot assignment with a preview, reschedule requests, and drive-day attendance
 * (TPO V1 - Locked.docx §5 Rounds and Drive day). Nobody is told anything until the TPO commits a preview.
 */
@Service
@RequiredArgsConstructor
public class TpoScheduleService {

    private static final Set<String> INACTIVE = Set.of("REJECTED", "WITHDRAWN", "NOT_SELECTED");

    private final NamedParameterJdbcTemplate jdbc;
    private final NotificationOutboxService outbox;
    private final TpoAuditService audit;

    // ---------------------------------------------------------------- who is in a round
    /**
     * Who is in a round: students still in play (applied, shortlisted, test or interview; never offered, placed, waitlisted or
     * out). The first round, or a round with only talks before it, takes all of them. A later round takes those who cleared
     * the round that decides it (the nearest earlier round that is not a talk), plus anyone the placement cell moved forward by
     * hand to this round's stage without a result there, plus anyone already scheduled into it.
     * It used to look only at the round numbered one less: nobody reached the round after a talk or after a deleted round, a
     * student moved to Interview on the board never appeared in the interview round, and offered or placed students sat in
     * round 1's roster.
     */
    public List<Map<String, Object>> candidates(Long roundId) {
        Map<String, Object> r = jdbc.queryForMap("SELECT job_id, seq, kind FROM job_round WHERE id = :r", new MapSqlParameterSource("r", roundId));
        int jobId = ((Number) r.get("job_id")).intValue();
        int seq = ((Number) r.get("seq")).intValue();
        List<Long> gate = jdbc.queryForList("SELECT id FROM job_round WHERE job_id = :j AND seq < :s AND kind <> 'TALK' ORDER BY seq DESC LIMIT 1",
                new MapSqlParameterSource("j", jobId).addValue("s", seq), Long.class);
        int rank = "INTERVIEW".equals(r.get("kind")) ? 3 : "TALK".equals(r.get("kind")) ? 1 : 2;
        String gated = gate.isEmpty() ? "" :
                " AND (EXISTS (SELECT 1 FROM round_result rr WHERE rr.application_id = a.id AND rr.round_id = :g AND rr.applied_at IS NOT NULL AND rr.outcome = 'PASS') " +
                "   OR (NOT EXISTS (SELECT 1 FROM round_result rr WHERE rr.application_id = a.id AND rr.round_id = :g AND rr.applied_at IS NOT NULL) " +
                "       AND (CASE a.application_status WHEN 'SHORTLISTED' THEN 1 WHEN 'ASSESSMENT' THEN 2 WHEN 'INTERVIEW' THEN 3 ELSE 0 END) >= :rank) " +
                "   OR EXISTS (SELECT 1 FROM round_assignment ra WHERE ra.application_id = a.id AND ra.round_id = :r))";
        return jdbc.queryForList(
                "SELECT a.id AS applicationId, l.id AS learnerId, l.first_name AS firstName, l.last_name AS lastName, l.roll_number AS rollNumber, " +
                "  l.department AS branch, l.contact_mobile AS phone, a.application_status AS stage " +
                "FROM job_application a JOIN learner l ON l.id = a.learner_id WHERE a.job_id = :j AND (a.is_deleted = 0 OR a.is_deleted IS NULL) " +
                "AND a.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW')" + gated + " ORDER BY l.roll_number, l.first_name",
                new MapSqlParameterSource("j", jobId).addValue("g", gate.isEmpty() ? null : gate.get(0)).addValue("rank", rank).addValue("r", roundId));
    }

    // ---------------------------------------------------------------- slots
    public List<Map<String, Object>> slots(Long roundId) {
        return jdbc.queryForList("SELECT s.id, s.starts_at AS startsAt, s.ends_at AS endsAt, s.room, s.panel, s.capacity, s.proposed_by AS proposedBy, s.status, " +
                "(SELECT COUNT(*) FROM round_assignment ra JOIN job_application ba ON ba.id = ra.application_id WHERE ra.slot_id = s.id AND ba.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED')) AS booked FROM round_slot s WHERE s.round_id = :r ORDER BY s.starts_at",
                new MapSqlParameterSource("r", roundId));
    }

    @Transactional
    public int proposeSlots(Long roundId, List<Map<String, Object>> slots, String proposedBy) {
        int n = 0;
        for (Map<String, Object> s : slots) {
            LocalDateTime start = LocalDateTime.parse(String.valueOf(s.get("startsAt")));
            LocalDateTime end = LocalDateTime.parse(String.valueOf(s.get("endsAt")));
            if (!end.isAfter(start)) throw new IllegalArgumentException("A slot must end after it starts");
            jdbc.update("INSERT INTO round_slot (round_id, starts_at, ends_at, room, panel, capacity, proposed_by, status) VALUES (:r, :s, :e, :room, :panel, :cap, :by, :st)",
                    new MapSqlParameterSource("r", roundId).addValue("s", start).addValue("e", end).addValue("room", s.get("room"))
                            .addValue("panel", s.get("panel")).addValue("cap", s.get("capacity") == null ? 1 : Integer.valueOf(String.valueOf(s.get("capacity"))))
                            .addValue("by", proposedBy).addValue("st", "TPO".equals(proposedBy) ? "CONFIRMED" : "PROPOSED"));
            n++;
        }
        return n;
    }

    /** Removes one slot that nobody is booked into (a slot with students in it has to be emptied first). */
    @Transactional
    public int deleteSlot(Long roundId, Long slotId) {
        // BE-0043: lock the slot first, so a booking can't land between the "nobody booked" check and the delete.
        jdbc.queryForList("SELECT id FROM round_slot WHERE id = :s AND round_id = :r FOR UPDATE", new MapSqlParameterSource("s", slotId).addValue("r", roundId));
        Long booked = jdbc.queryForObject("SELECT COUNT(*) FROM round_assignment WHERE slot_id = :s", new MapSqlParameterSource("s", slotId), Long.class);
        if (booked != null && booked > 0) throw new IllegalStateException("Students are booked into this slot, so it can't be removed");
        return jdbc.update("DELETE FROM round_slot WHERE id = :s AND round_id = :r", new MapSqlParameterSource("s", slotId).addValue("r", roundId));
    }

    /** Clears every slot of the round that has nobody booked: the undo for "I generated the wrong day". Slots with students stay. */
    @Transactional
    public int deleteUnbookedSlots(Long roundId) {
        return jdbc.update("DELETE FROM round_slot WHERE round_id = :r AND NOT EXISTS (SELECT 1 FROM round_assignment ra WHERE ra.slot_id = round_slot.id)",
                new MapSqlParameterSource("r", roundId));
    }

    /** Confirms a recruiter-proposed slot with a venue (virtual panels need none). */
    @Transactional
    public void confirmSlot(Long roundId, Long slotId, String room, Integer collegeId, Integer actorId) {
        Map<String, Object> mode = jdbc.queryForMap("SELECT mode, job_id FROM job_round WHERE id = :r", new MapSqlParameterSource("r", roundId));
        if (!"VIRTUAL".equals(mode.get("mode")) && (room == null || room.isBlank())) throw new IllegalArgumentException("Add the venue or room to confirm this slot");
        int n = jdbc.update("UPDATE round_slot SET status = 'CONFIRMED', room = COALESCE(:room, room) WHERE id = :s AND round_id = :r",
                new MapSqlParameterSource("room", room == null || room.isBlank() ? null : room.trim()).addValue("s", slotId).addValue("r", roundId));
        if (n == 0) throw new IllegalArgumentException("Not found");
        audit.log(collegeId, "TPO", actorId, "SLOT_CONFIRMED", "ROUND", roundId, "slot " + slotId);
    }

    // ---------------------------------------------------------------- assignment with preview
    /**
     * Test rounds: by roll number range, filling each room to capacity in order. Interview rounds: first confirmed slot
     * with space that does not overlap another round the student is already placed in. Nothing is saved.
     */
    public Map<String, Object> assignmentPreview(Long roundId, List<Map<String, Object>> rooms) {
        Map<String, Object> round = jdbc.queryForMap("SELECT kind, job_id FROM job_round WHERE id = :r", new MapSqlParameterSource("r", roundId));
        String kind = String.valueOf(round.get("kind"));
        List<Map<String, Object>> cands = candidates(roundId);
        List<Map<String, Object>> placed = new ArrayList<>(), couldNot = new ArrayList<>();
        if ("INTERVIEW".equals(kind)) {
            List<Map<String, Object>> slots = jdbc.queryForList("SELECT s.id, s.starts_at, s.ends_at, s.room, s.capacity, " +
                    "(SELECT COUNT(*) FROM round_assignment ra JOIN job_application ba ON ba.id = ra.application_id WHERE ra.slot_id = s.id AND ba.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED')) AS booked FROM round_slot s WHERE s.round_id = :r AND s.status = 'CONFIRMED' ORDER BY s.starts_at",
                    new MapSqlParameterSource("r", roundId));
            Map<Long, Integer> used = new HashMap<>();
            for (Map<String, Object> c : cands) {
                int learnerId = ((Number) c.get("learnerId")).intValue();
                Map<String, Object> pick = null;
                for (Map<String, Object> s : slots) {
                    long sid = ((Number) s.get("id")).longValue();
                    int free = ((Number) s.get("capacity")).intValue() - ((Number) s.get("booked")).intValue() - used.getOrDefault(sid, 0);
                    if (free <= 0) continue;
                    if (clashes(learnerId, TpoTime.ldt(s.get("starts_at")), TpoTime.ldt(s.get("ends_at")))) continue;
                    pick = s; break;
                }
                if (pick == null) { couldNot.add(Map.of("applicationId", c.get("applicationId"), "name", name(c), "roll", str(c.get("rollNumber")), "reason", "No free slot without a clash")); continue; }
                long sid = ((Number) pick.get("id")).longValue();
                used.merge(sid, 1, Integer::sum);
                placed.add(Map.of("applicationId", c.get("applicationId"), "name", name(c), "roll", str(c.get("rollNumber")), "slotId", sid,
                        "startsAt", String.valueOf(pick.get("starts_at")), "room", str(pick.get("room"))));
            }
        } else {
            int idx = 0, filled = 0;
            List<Map<String, Object>> rs = rooms == null ? List.of() : rooms;
            // A room without a name was saved as the word "null" and shown to students as their room.
            for (Map<String, Object> room : rs) {
                Object n = room == null ? null : room.get("name");
                if (n == null || String.valueOf(n).isBlank()) throw new IllegalArgumentException("Give each room a name");
            }
            for (Map<String, Object> c : cands) {
                while (idx < rs.size() && filled >= Integer.parseInt(String.valueOf(rs.get(idx).get("capacity")))) { idx++; filled = 0; }
                if (idx >= rs.size()) { couldNot.add(Map.of("applicationId", c.get("applicationId"), "name", name(c), "roll", str(c.get("rollNumber")), "reason", "No room space left")); continue; }
                filled++;
                placed.add(Map.of("applicationId", c.get("applicationId"), "name", name(c), "roll", str(c.get("rollNumber")), "room", String.valueOf(rs.get(idx).get("name"))));
            }
        }
        return Map.of("placed", placed, "couldNotPlace", couldNot, "total", cands.size());
    }

    private boolean clashes(int learnerId, LocalDateTime start, LocalDateTime end) {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM round_assignment ra JOIN round_slot s ON s.id = ra.slot_id JOIN job_application a ON a.id = ra.application_id " +
                // Only slots of applications still in play: a not-selected or withdrawn student's old slot no longer blocks the time.
                "WHERE a.learner_id = :l AND s.starts_at < :e AND s.ends_at > :s AND a.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED')",
                new MapSqlParameterSource("l", learnerId).addValue("s", start).addValue("e", end), Long.class);
        return n != null && n > 0;
    }

    private static String name(Map<String, Object> c) { return (str(c.get("firstName")) + " " + str(c.get("lastName"))).trim(); }
    private static String str(Object o) { return o == null ? "" : String.valueOf(o); }

    /** Saves a previewed assignment and (optionally) tells each student. */
    // READ COMMITTED: the checks after the slot lock must see bookings committed while this request waited for it.
    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public int commitAssignment(Long roundId, List<Map<String, Object>> placed, boolean notify, Integer collegeId, Integer actorId) {
        // Only this round's own students and slots: the list comes from the browser, and an id from another drive (or college)
        // used to be booked in and told.
        Set<Integer> inRound = new HashSet<>();
        for (Map<String, Object> c : candidates(roundId)) inRound.add(((Number) c.get("applicationId")).intValue());
        // BE-0043: the commit is the authority, not the browser's preview. The round's slots are locked (two people saving the
        // same last seat wait for each other, and a slot can't be deleted under a booking), then every booking is checked again:
        // a CONFIRMED slot of this round, room left in it, and no clash with the student's other bookings. Nothing is written
        // unless the whole list passes.
        Map<Long, Map<String, Object>> slotRows = new HashMap<>();
        for (Map<String, Object> sr : jdbc.queryForList("SELECT id, status, capacity, starts_at, ends_at FROM round_slot WHERE round_id = :r FOR UPDATE",
                new MapSqlParameterSource("r", roundId))) {
            slotRows.put(((Number) sr.get("id")).longValue(), sr);
        }
        Set<Long> roundSlots = slotRows.keySet();
        checkPlacements(roundId, placed == null ? List.of() : placed, inRound, slotRows);
        int n = 0;
        for (Map<String, Object> p : placed) {
            Integer appId = Integer.valueOf(String.valueOf(p.get("applicationId")));
            Long slotId = p.get("slotId") == null ? null : Long.valueOf(String.valueOf(p.get("slotId")));
            if (!inRound.contains(appId)) throw new IllegalArgumentException("A student in this list is not in this round");
            if (slotId != null && !roundSlots.contains(slotId)) throw new IllegalArgumentException("A slot in this list is not this round's");
            // Saving the same booking again changes nothing: it used to tell the student "scheduled" once more and wipe their confirmation.
            String room = p.get("room") == null ? null : String.valueOf(p.get("room"));
            List<Map<String, Object>> was = jdbc.queryForList("SELECT slot_id, room, notified_at FROM round_assignment WHERE round_id = :r AND application_id = :a",
                    new MapSqlParameterSource("r", roundId).addValue("a", appId));
            if (!was.isEmpty() && Objects.equals(was.get(0).get("slot_id") == null ? null : ((Number) was.get(0).get("slot_id")).longValue(), slotId)
                    && Objects.equals(was.get(0).get("room"), room) && (!notify || was.get(0).get("notified_at") != null)) {
                n++;
                continue;
            }
            jdbc.update("INSERT INTO round_assignment (round_id, application_id, slot_id, room, notified_at) VALUES (:r, :a, :s, :room, :nt) " +
                            "ON DUPLICATE KEY UPDATE slot_id = VALUES(slot_id), room = VALUES(room), student_confirmed_at = NULL, notified_at = VALUES(notified_at)",
                    new MapSqlParameterSource("r", roundId).addValue("a", appId).addValue("s", slotId)
                            .addValue("room", room).addValue("nt", notify ? LocalDateTime.now() : null));
            if (notify) {
                List<Integer> learner = jdbc.queryForList("SELECT learner_id FROM job_application WHERE id = :a", new MapSqlParameterSource("a", appId), Integer.class);
                if (!learner.isEmpty()) {
                    Map<String, Object> ctx = jdbc.queryForMap("SELECT j.company_name AS company, j.job_title AS role, r.name AS round FROM job_round r JOIN job j ON j.id = r.job_id WHERE r.id = :r",
                            new MapSqlParameterSource("r", roundId));
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("roundId", roundId); payload.put("room", p.get("room") == null ? "" : p.get("room")); payload.put("startsAt", p.get("startsAt") == null ? "" : String.valueOf(p.get("startsAt")).replace('T', ' '));
                    payload.put("company", ctx.get("company")); payload.put("role", ctx.get("role")); payload.put("round", ctx.get("round"));
                    // What is saved (slot time or round date, room or venue, meeting link), with the time and venue the email shows.
                    Map<String, Object> saved = InterviewReminderService.payloadFor(jdbc, roundId, appId);
                    if (saved != null) payload.putAll(saved);
                    outbox.enqueue("ROUND_SCHEDULED", "LEARNER", learner.get(0), "APP", payload, null, false);
                }
            }
            n++;
        }
        audit.log(collegeId, "TPO", actorId, "ROUND_ASSIGNMENT_SAVED", "ROUND", roundId, n + " students" + (notify ? ", notified" : ""));
        return n;
    }

    /** BE-0043: every booking in the list is valid together, against what is saved right now (slots already locked). */
    private void checkPlacements(Long roundId, List<Map<String, Object>> placed, Set<Integer> inRound, Map<Long, Map<String, Object>> slotRows) {
        Set<Integer> listed = new HashSet<>();
        for (Map<String, Object> p : placed) listed.add(Integer.valueOf(String.valueOf(p.get("applicationId"))));
        // Seats already taken in each slot by students who are not in this list (their bookings stay as they are).
        Map<Long, Integer> taken = new HashMap<>();
        if (!slotRows.isEmpty()) {
            MapSqlParameterSource q = new MapSqlParameterSource("r", roundId).addValue("apps", listed.isEmpty() ? List.of(-1) : listed);
            for (Map<String, Object> t : jdbc.queryForList("SELECT ra.slot_id AS slotId, COUNT(*) AS n FROM round_assignment ra JOIN job_application a ON a.id = ra.application_id " +
                    "WHERE ra.round_id = :r AND ra.slot_id IS NOT NULL AND ra.application_id NOT IN (:apps) " +
                    "AND a.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED') GROUP BY ra.slot_id", q)) {
                taken.put(((Number) t.get("slotId")).longValue(), ((Number) t.get("n")).intValue());
            }
        }
        for (Map<String, Object> p : placed) {
            Integer appId = Integer.valueOf(String.valueOf(p.get("applicationId")));
            if (!inRound.contains(appId)) throw new IllegalArgumentException("A student in this list is not in this round");
            if (p.get("slotId") == null) continue; // a test-room booking has no slot
            Long slotId = Long.valueOf(String.valueOf(p.get("slotId")));
            Map<String, Object> slot = slotRows.get(slotId);
            if (slot == null) throw new IllegalArgumentException("A slot in this list is not this round's");
            if (!"CONFIRMED".equals(String.valueOf(slot.get("status")))) throw new IllegalStateException("A slot in this list is not confirmed yet. Confirm it first, then save.");
            int capacity = slot.get("capacity") == null ? 1 : ((Number) slot.get("capacity")).intValue();
            int now = taken.merge(slotId, 1, Integer::sum);
            if (now > capacity) throw new IllegalStateException("A slot in this list is already full. Refresh the plan and save again.");
            Integer learnerId = jdbc.queryForObject("SELECT learner_id FROM job_application WHERE id = :a", new MapSqlParameterSource("a", appId), Integer.class);
            Long clash = jdbc.queryForObject("SELECT COUNT(*) FROM round_assignment ra JOIN round_slot s2 ON s2.id = ra.slot_id JOIN job_application a ON a.id = ra.application_id " +
                    "WHERE a.learner_id = :l AND ra.round_id <> :r AND s2.starts_at < :e AND s2.ends_at > :s " +
                    "AND a.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED')",
                    new MapSqlParameterSource("l", learnerId).addValue("r", roundId)
                            .addValue("s", TpoTime.ldt(slot.get("starts_at"))).addValue("e", TpoTime.ldt(slot.get("ends_at"))), Long.class);
            if (clash != null && clash > 0) throw new IllegalStateException("A student in this list now has another interview at that time. Refresh the plan and save again.");
        }
    }

    public List<Map<String, Object>> assignments(Long roundId) {
        return jdbc.queryForList("SELECT ra.application_id AS applicationId, ra.room, ra.slot_id AS slotId, s.starts_at AS startsAt, ra.student_confirmed_at AS studentConfirmedAt, " +
                "l.first_name AS firstName, l.last_name AS lastName, l.roll_number AS rollNumber FROM round_assignment ra JOIN job_application a ON a.id = ra.application_id " +
                "JOIN learner l ON l.id = a.learner_id LEFT JOIN round_slot s ON s.id = ra.slot_id WHERE ra.round_id = :r ORDER BY l.roll_number",
                new MapSqlParameterSource("r", roundId));
    }

    // ---------------------------------------------------------------- reschedule requests
    public List<Map<String, Object>> rescheduleRequests(Long roundId) {
        return jdbc.queryForList("SELECT q.id, q.application_id AS applicationId, q.reason, q.preferred_times AS preferredTimes, q.status, q.reply, q.created_at AS createdAt, " +
                "l.first_name AS firstName, l.last_name AS lastName, l.roll_number AS rollNumber FROM reschedule_request q JOIN job_application a ON a.id = q.application_id " +
                "JOIN learner l ON l.id = a.learner_id WHERE q.round_id = :r ORDER BY q.status, q.created_at", new MapSqlParameterSource("r", roundId));
    }

    @Transactional
    public void decideReschedule(Long requestId, String decision, Long newSlotId, String reply, Integer collegeId, Integer actorId) {
        // BE-0039: the request row is locked, so a second answer waits and then sees it answered (no second move or message).
        Map<String, Object> q = jdbc.queryForMap("SELECT round_id, application_id, status FROM reschedule_request WHERE id = :id FOR UPDATE", new MapSqlParameterSource("id", requestId));
        // A second answer moved the slot again and told the student twice.
        if (q.get("status") != null && !"PENDING".equals(String.valueOf(q.get("status")))) throw new IllegalStateException("This request was already answered");
        Long roundId = ((Number) q.get("round_id")).longValue();
        Integer appId = ((Number) q.get("application_id")).intValue();
        String status;
        if ("MOVE".equals(decision)) {
            if (newSlotId == null) throw new IllegalArgumentException("Choose the new slot");
            Long ok = jdbc.queryForObject("SELECT COUNT(*) FROM round_slot WHERE id = :s AND round_id = :r AND status = 'CONFIRMED'",
                    new MapSqlParameterSource("s", newSlotId).addValue("r", roundId), Long.class);
            if (ok == null || ok == 0) throw new IllegalArgumentException("Not found");
            // A confirmed slot that changes needs the student to confirm again.
            jdbc.update("INSERT INTO round_assignment (round_id, application_id, slot_id, notified_at) VALUES (:r, :a, :s, NOW()) " +
                            "ON DUPLICATE KEY UPDATE slot_id = VALUES(slot_id), student_confirmed_at = NULL, notified_at = NOW()",
                    new MapSqlParameterSource("r", roundId).addValue("a", appId).addValue("s", newSlotId));
            status = "MOVED";
        } else if ("KEEP".equals(decision)) status = "KEPT";
        else throw new IllegalArgumentException("Choose Move, Keep or Reply");
        jdbc.update("UPDATE reschedule_request SET status = :st, reply = :rp, decided_by = :by WHERE id = :id",
                new MapSqlParameterSource("st", status).addValue("rp", reply).addValue("by", actorId).addValue("id", requestId));
        List<Integer> learner = jdbc.queryForList("SELECT learner_id FROM job_application WHERE id = :a", new MapSqlParameterSource("a", appId), Integer.class);
        if (!learner.isEmpty()) outbox.enqueue("RESCHEDULE_DECIDED", "LEARNER", learner.get(0), "APP", Map.of("status", status, "reply", reply == null ? "" : reply), null, false);
        audit.log(collegeId, "TPO", actorId, "RESCHEDULE_" + status, "ROUND", roundId, "request " + requestId);
    }

    /** Student side: ask to move a slot. */
    @Transactional
    public void requestReschedule(Integer learnerId, Long roundId, String reason, String preferredTimes) {
        List<Integer> app = jdbc.queryForList("SELECT a.id FROM job_application a JOIN job_round r ON r.job_id = a.job_id WHERE r.id = :r AND a.learner_id = :l",
                new MapSqlParameterSource("r", roundId).addValue("l", learnerId), Integer.class);
        if (app.isEmpty()) throw new IllegalArgumentException("Not found");
        // BE-0039: two submissions at once take turns on the application, so the second sees the first request.
        jdbc.queryForList("SELECT id FROM job_application WHERE id = :a FOR UPDATE", new MapSqlParameterSource("a", app.get(0)));
        Long scheduled = jdbc.queryForObject("SELECT COUNT(*) FROM round_assignment WHERE round_id = :r AND application_id = :a",
                new MapSqlParameterSource("r", roundId).addValue("a", app.get(0)), Long.class);
        if (scheduled == null || scheduled == 0) throw new IllegalStateException("You have no slot in this round to move");
        Long open = jdbc.queryForObject("SELECT COUNT(*) FROM reschedule_request WHERE round_id = :r AND application_id = :a AND status = 'PENDING' FOR UPDATE",
                new MapSqlParameterSource("r", roundId).addValue("a", app.get(0)), Long.class);
        if (open != null && open > 0) throw new IllegalStateException("You already asked to move this slot; the placement cell will reply");
        jdbc.update("INSERT INTO reschedule_request (round_id, application_id, reason, preferred_times) VALUES (:r, :a, :re, :p)",
                new MapSqlParameterSource("r", roundId).addValue("a", app.get(0)).addValue("re", reason).addValue("p", preferredTimes));
    }

    @Transactional
    public void studentConfirm(Integer learnerId, Long roundId) {
        int n = jdbc.update("UPDATE round_assignment ra JOIN job_application a ON a.id = ra.application_id SET ra.student_confirmed_at = NOW() WHERE ra.round_id = :r AND a.learner_id = :l",
                new MapSqlParameterSource("r", roundId).addValue("l", learnerId));
        if (n == 0) throw new IllegalArgumentException("Not found");
    }

    public List<Map<String, Object>> assignmentsForLearner(Integer learnerId) {
        // A test or group discussion has no slots: its time and place are the round's own (startsAt and room were empty for
        // them; night audit 13 Oct 2026). An interview's are its confirmed slot's.
        return jdbc.queryForList("SELECT r.id AS roundId, r.name AS roundName, r.kind, j.id AS jobId, j.company_name AS company, j.job_title AS title, " +
                "COALESCE(NULLIF(NULLIF(ra.room, ''), 'null'), s.room, r.venue) AS room, COALESCE(s.starts_at, r.scheduled_date) AS startsAt, s.ends_at AS endsAt, " +
                "r.mode, r.meeting_url AS meetingUrl, r.what_to_bring AS whatToBring, " +
                "ra.student_confirmed_at AS confirmedAt FROM round_assignment ra JOIN job_application a ON a.id = ra.application_id JOIN job_round r ON r.id = ra.round_id " +
                "JOIN job j ON j.id = r.job_id LEFT JOIN round_slot s ON s.id = ra.slot_id WHERE a.learner_id = :l " +
                // Only rounds still ahead of them: an application that ended (not selected, withdrawn, a cancelled or closed drive)
                // left its booked slots on the student's schedule.
                "AND a.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED') AND j.lifecycle_status = 'PUBLISHED' " +
                "ORDER BY COALESCE(s.starts_at, r.scheduled_date)", new MapSqlParameterSource("l", learnerId));
    }

    // ---------------------------------------------------------------- drive day
    /** Today's on-campus rounds of the college (Drive day). */
    public List<Map<String, Object>> driveDayRounds(Integer collegeId) {
        return jdbc.queryForList("SELECT r.id AS roundId, r.name AS roundName, r.kind, r.scheduled_date AS startsAt, r.venue AS venue, j.id AS jobId, j.company_name AS company, j.job_title AS title FROM job_round r JOIN job j ON j.id = r.job_id " +
                        "WHERE j.college_id = :c AND r.mode = 'ON_CAMPUS' AND DATE(r.scheduled_date) = CURDATE() AND j.lifecycle_status = 'PUBLISHED' ORDER BY r.scheduled_date",
                new MapSqlParameterSource("c", collegeId));
    }

    public Map<String, Object> roster(Long roundId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT a.id AS applicationId, l.id AS learnerId, l.first_name AS firstName, l.last_name AS lastName, l.roll_number AS rollNumber, l.department AS branch, " +
                // Reuses the same "website field doubles as profile-photo URL" convention as
                // DiscussionServiceImpl.getProfileImageUrl - the app has no dedicated photo column.
                "(CASE WHEN l.website IS NULL OR TRIM(l.website) = '' OR l.website = 'string' THEN NULL ELSE l.website END) AS photoUrl, " +
                "l.contact_mobile AS phone, " +
                "COALESCE(att.status, 'WAITING') AS attendance, att.room AS room, ra.room AS assignedRoom " +
                "FROM job_application a JOIN learner l ON l.id = a.learner_id JOIN job_round r ON r.job_id = a.job_id " +
                "LEFT JOIN round_attendance att ON att.round_id = r.id AND att.application_id = a.id " +
                "LEFT JOIN round_assignment ra ON ra.round_id = r.id AND ra.application_id = a.id " +
                "WHERE r.id = :r AND (a.is_deleted = 0 OR a.is_deleted IS NULL) AND a.application_status NOT IN ('REJECTED','WITHDRAWN','NOT_SELECTED') " +
                "ORDER BY l.roll_number", new MapSqlParameterSource("r", roundId));
        Set<Integer> allowed = new HashSet<>();
        for (Map<String, Object> c : candidates(roundId)) allowed.add(((Number) c.get("applicationId")).intValue());
        rows.removeIf(x -> !allowed.contains(((Number) x.get("applicationId")).intValue()));
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (String k : List.of("WAITING", "PRESENT", "IN_INTERVIEW", "DONE", "ABSENT")) counts.put(k, 0);
        for (Map<String, Object> x : rows) counts.merge(String.valueOf(x.get("attendance")), 1, Integer::sum);
        // Which drive and round this is, so the screen on the day says it (and does not say LIVE for a round that is done).
        List<Map<String, Object>> round = jdbc.queryForList("SELECT r.name, r.status, r.scheduled_date AS scheduledAt, j.id AS jobId, j.company_name AS company, j.job_title AS title " +
                "FROM job_round r JOIN job j ON j.id = r.job_id WHERE r.id = :r", new MapSqlParameterSource("r", roundId));
        return Map.of("students", rows, "counts", counts, "round", round.isEmpty() ? Map.of() : round.get(0));
    }

    @Transactional
    public void mark(Long roundId, Integer applicationId, String status, String room, Integer markedBy, String role, Integer collegeId) {
        if (!Set.of("PRESENT", "ABSENT", "IN_INTERVIEW", "DONE", "WAITING").contains(status)) throw new IllegalArgumentException("Unknown status");
        Long inRound = jdbc.queryForObject("SELECT COUNT(*) FROM job_application a JOIN job_round r ON r.job_id = a.job_id WHERE r.id = :r AND a.id = :a",
                new MapSqlParameterSource("r", roundId).addValue("a", applicationId), Long.class);
        if (inRound == null || inRound == 0) throw new IllegalArgumentException("Not found");
        // Only a student still in play is marked: a not-selected or withdrawn student marked absent used to get the "you were absent" notice.
        String stage = jdbc.queryForObject("SELECT application_status FROM job_application WHERE id = :a", new MapSqlParameterSource("a", applicationId), String.class);
        if (!ApplicationTransitionService.OPEN_STAGES.contains(String.valueOf(stage))) {
            throw new IllegalStateException("This student is no longer in this drive (" + LearnerPlacementService.STATUS_WORDS.getOrDefault(String.valueOf(stage), String.valueOf(stage).toLowerCase()) + ")");
        }
        // The same students the roster lists: a student still at an earlier round (or not yet moved on) is not marked for this one.
        boolean candidate = candidates(roundId).stream().anyMatch(c -> ((Number) c.get("applicationId")).intValue() == applicationId);
        if (!candidate) throw new IllegalStateException("This student is not in this round");
        // BE-0040: two phones marking the same student at once take turns here, so only the first sees "not absent yet" and
        // only one absence message and audit entry go out (the attendance row itself was already de-duplicated by its key).
        jdbc.queryForList("SELECT id FROM job_application WHERE id = :a FOR UPDATE", new MapSqlParameterSource("a", applicationId));
        List<String> before = jdbc.queryForList("SELECT status FROM round_attendance WHERE round_id = :r AND application_id = :a FOR UPDATE",
                new MapSqlParameterSource("r", roundId).addValue("a", applicationId), String.class);
        boolean newlyAbsent = "ABSENT".equals(status) && (before.isEmpty() || !"ABSENT".equals(before.get(0)));
        jdbc.update("INSERT INTO round_attendance (round_id, application_id, status, room, marked_by, marked_by_role) VALUES (:r, :a, :s, :room, :by, :role) " +
                        "ON DUPLICATE KEY UPDATE status = VALUES(status), room = COALESCE(VALUES(room), room), marked_by = VALUES(marked_by), marked_by_role = VALUES(marked_by_role), marked_at = NOW()",
                new MapSqlParameterSource("r", roundId).addValue("a", applicationId).addValue("s", status).addValue("room", room)
                        .addValue("by", markedBy).addValue("role", role));
        if (newlyAbsent) { // marking the same student absent again (a double tap on the drive-day phone) no longer tells them twice
            // Absent students are told the same day and can dispute (creates an ABSENCE_DISPUTE request from their side).
            List<Integer> learner = jdbc.queryForList("SELECT learner_id FROM job_application WHERE id = :a", new MapSqlParameterSource("a", applicationId), Integer.class);
            if (!learner.isEmpty()) outbox.enqueue("MARKED_ABSENT", "LEARNER", learner.get(0), "APP", Map.of("roundId", roundId, "applicationId", applicationId), null, false);
            audit.log(collegeId, "TPO", markedBy, "MARKED_ABSENT", "ROUND", roundId, "application " + applicationId);
        }
    }

    /** Roll-number search for the phone-first drive-day screen. */
    public List<Map<String, Object>> search(Long roundId, String q) {
        String like = "%" + (q == null ? "" : q.trim().toLowerCase(Locale.ROOT)) + "%";
        List<Map<String, Object>> all = new ArrayList<>((List<Map<String, Object>>) roster(roundId).get("students"));
        all.removeIf(r -> !(str(r.get("rollNumber")).toLowerCase(Locale.ROOT).contains(like.replace("%", ""))
                || name(r).toLowerCase(Locale.ROOT).contains(like.replace("%", ""))));
        return all.size() > 30 ? all.subList(0, 30) : all;
    }
}
