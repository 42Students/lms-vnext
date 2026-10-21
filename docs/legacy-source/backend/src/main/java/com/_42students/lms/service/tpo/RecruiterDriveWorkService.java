package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

/**
 * What a recruiter does on their own drives (Recruiter V1 - Locked.docx): see the applicants the placement cell has shared, shortlist and send
 * round results, propose interview slots, send the company's selection list, and read round status. Everything a recruiter sends lands in
 * the same staging the TPO works from, marked with its source, so the TPO applies or confirms it: nothing here changes what students see.
 * Every method takes the recruiter's id and refuses a drive that is not theirs at that college (looks like "not found").
 */
@Service
@RequiredArgsConstructor
public class RecruiterDriveWorkService {

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoShareService shareService;
    private final TpoResultsService resultsService;
    private final TpoOfferService offerService;
    private final TpoScheduleService scheduleService;
    private final TpoAuditService audit;
    private final TpoWorkspaceService workspaceService;
    private final TpoDriveExtrasService extrasService;

    /** Optional so tests that build this service directly keep working. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private TpoSettingsHubService settingsHub;

    /** The drive must belong to this recruiter at this college. */
    public void requireOwn(long recruiterId, Integer collegeId, Integer jobId) {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM job WHERE id = :j AND college_id = :c AND recruiter_id = :h AND (is_deleted = 0 OR is_deleted IS NULL)",
                new MapSqlParameterSource("j", jobId).addValue("c", collegeId).addValue("h", recruiterId), Long.class);
        if (n == null || n == 0) throw new IllegalArgumentException("Not found");
    }

    private void requireRoundOf(Integer jobId, Long roundId) {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM job_round WHERE id = :r AND job_id = :j", new MapSqlParameterSource("r", roundId).addValue("j", jobId), Long.class);
        if (n == null || n == 0) throw new IllegalArgumentException("Not found");
    }

    /** The recruiter's drives at a college, in recruiter wording, with the counts they may know. */
    public List<Map<String, Object>> drives(long recruiterId, Integer collegeId) {
        // When the college lets recruiters see applicants as they apply (N6), every drive counts as shared.
        int direct = settingsHub != null && settingsHub.recruiterSeesApplicantsDirectly(collegeId) ? 1 : 0;
        return jdbc.queryForList(
                "SELECT j.id, j.job_title AS roleTitle, j.lifecycle_status AS lifecycle, j.ctc_range AS ctc, j.drive_mode AS mode, j.application_deadline AS deadline, j.drive_group_id AS driveGroupId, " +
                // Open institutional requests: what the placement cell asked for, answered in place (recruiter phase 1, N14).
                "  (SELECT COUNT(*) FROM drive_change_request cr WHERE cr.job_id = j.id AND cr.status = 'OPEN' AND cr.direction = 'COLLEGE_TO_COMPANY') AS openRequests, " +
                "  CASE WHEN j.lifecycle_status = 'REJECTED' THEN j.sent_back_note END AS declinedReason, " +
                // The placement cell posted this drive and asked the recruiter to review it (N5 c).
                "  EXISTS (SELECT 1 FROM tpo_audit_log ra WHERE ra.college_id = j.college_id AND ra.entity_type = 'DRIVE' AND ra.entity_id = j.id AND ra.action = 'RECRUITER_REVIEW_INVITED') AS reviewInvited, " +
                "  j.job_type AS jobType, j.location AS location, " +
                "  (SELECT COUNT(*) FROM job_application a WHERE a.job_id = j.id AND (a.is_deleted = 0 OR a.is_deleted IS NULL)) AS applicants, " +
                // New applicants with no decision from the recruiter yet: the same count Today shows ("5 new applicants to review"),
                // so Today, the drive list and the drive say one number (recruiter UX audit, 19 Oct 2026).
                "  (SELECT COUNT(*) FROM job_application a WHERE a.job_id = j.id AND (a.is_deleted = 0 OR a.is_deleted IS NULL) AND a.application_status = 'APPLIED' " +
                "     AND NOT EXISTS (SELECT 1 FROM round_result x WHERE x.application_id = a.id AND x.submitted_by_type = 'RECRUITER' AND x.superseded_by IS NULL)) AS toReview, " +
                "  (:direct + (SELECT COUNT(*) FROM tpo_share_link s WHERE s.job_id = j.id AND s.revoked_at IS NULL AND s.expires_at > NOW())) AS liveShares, " +
                "  (SELECT COUNT(*) FROM job_offer o JOIN job_application a ON a.id = o.application_id WHERE a.job_id = j.id AND o.status IN ('RELEASED','ACCEPTED')) AS offers " +
                "FROM job j WHERE j.recruiter_id = :h AND j.college_id = :c AND (j.is_deleted = 0 OR j.is_deleted IS NULL) ORDER BY j.id DESC",
                new MapSqlParameterSource("h", recruiterId).addValue("c", collegeId).addValue("direct", direct));
    }

    /** Rounds with what the recruiter needs: when, mode, whether results were received, slots proposed and confirmed. */
    public List<Map<String, Object>> rounds(long recruiterId, Integer collegeId, Integer jobId) {
        requireOwn(recruiterId, collegeId, jobId);
        return jdbc.queryForList(
                "SELECT r.id, r.seq, r.kind, r.name, r.mode, r.scheduled_date AS scheduledDate, r.venue, r.meeting_url AS meetingUrl, r.status, " +
                "  (SELECT COUNT(*) FROM round_result x WHERE x.round_id = r.id AND x.applied_at IS NULL AND x.superseded_by IS NULL AND x.submitted_by_type = 'RECRUITER') AS resultsWaiting, " +
                "  (SELECT COUNT(*) FROM round_result x WHERE x.round_id = r.id AND x.applied_at IS NOT NULL) AS resultsApplied, " +
                "  (SELECT COUNT(*) FROM round_slot s WHERE s.round_id = r.id AND s.proposed_by = 'RECRUITER') AS slotsProposed, " +
                "  (SELECT COUNT(*) FROM round_slot s WHERE s.round_id = r.id AND s.status = 'CONFIRMED') AS slotsConfirmed, " +
                // Students booked into the round (a room or a slot): the round is scheduled once anyone is (UX audit, 19 Oct 2026).
                "  (SELECT COUNT(*) FROM round_assignment ra JOIN job_application ba ON ba.id = ra.application_id WHERE ra.round_id = r.id " +
                "     AND ba.application_status IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED')) AS booked, " +
                "  (SELECT COUNT(*) FROM round_slot s WHERE s.round_id = r.id) AS slotsTotal, " +
                "  (r.added_by_recruiter_id IS NOT NULL) AS addedByRecruiter, COALESCE(r.added_by_recruiter_id = :h, 0) AS mine, " +
                "  ((SELECT COUNT(*) FROM round_result x WHERE x.round_id = r.id) + (SELECT COUNT(*) FROM job_application a WHERE a.current_round_id = r.id) " +
                "   + (SELECT COUNT(*) FROM round_slot s WHERE s.round_id = r.id) + (r.scheduled_date IS NOT NULL)) AS inUse " +
                "FROM job_round r WHERE r.job_id = :j ORDER BY r.seq", new MapSqlParameterSource("j", jobId).addValue("h", recruiterId));
    }

    private static final java.util.Set<String> KINDS = java.util.Set.of("TALK", "TEST", "VENDOR_TEST", "GD", "INTERVIEW");

    private com._42students.lms.dto.tpo.RoundForm roundForm(String kind, String name, String mode) {
        String k = kind == null ? "" : kind.trim().toUpperCase(Locale.ROOT);
        if (!KINDS.contains(k)) throw new IllegalArgumentException("Choose a round type: talk, test, vendor test, group discussion or interview");
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Give the round a name");
        if (name.trim().length() > 100) throw new IllegalArgumentException("The round name is too long");
        com._42students.lms.dto.tpo.RoundForm f = new com._42students.lms.dto.tpo.RoundForm();
        f.setKind(k);
        f.setName(name.trim());
        f.setMode(mode == null || mode.isBlank() ? null : mode.trim().toUpperCase(Locale.ROOT));
        return f; // no date, venue or link: scheduling and telling students stay with the placement cell
    }

    /**
     * Results and selections act on shared applicants, so they need the same live share as reading them (BE-0151). Revoking or
     * letting the share expire used to stop the reads only; applicant refs learned earlier stayed writable.
     */
    /** What a recruiter sees when the college lets them see applicants directly (N6): no contact details until the placement cell shares them. */
    static final List<String> DIRECT_COLUMNS = List.of("name", "roll", "branch", "cgpa", "tenth", "twelfth", "resume", "projects", "skillMatch", "stage");

    /** The columns a recruiter sees with no share, when the college shows applicants directly; null when it does not. */
    public List<String> directColumnsFor(Integer jobId) {
        return direct(jobId) ? DIRECT_COLUMNS : null;
    }

    private boolean direct(Integer jobId) {
        if (settingsHub == null) return false;
        List<Integer> college = jdbc.queryForList("SELECT college_id FROM job WHERE id = :j", new MapSqlParameterSource("j", jobId), Integer.class);
        return !college.isEmpty() && college.get(0) != null && settingsHub.recruiterSeesApplicantsDirectly(college.get(0));
    }

    private void requireLiveShare(Integer jobId) {
        if (direct(jobId)) return;
        Long live = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_share_link WHERE job_id = :j AND revoked_at IS NULL AND expires_at > NOW()",
                new MapSqlParameterSource("j", jobId), Long.class);
        if (live == null || live == 0) {
            throw new IllegalArgumentException("The placement cell is not sharing applicants with you right now, so results and selections can't be sent. Ask them to share again.");
        }
    }

    private void requireOpenDrive(Integer jobId) {
        requireOpenDrive(jobId, "rounds can no longer be added or changed");
    }

    /**
     * A closed, cancelled or declined drive is history (BE-0139): no new rounds, results, slots or selections. Results, slots
     * and selections used to skip this check, so a finished drive could still gain them from the recruiter side.
     */
    private void requireOpenDrive(Integer jobId, String refused) {
        String status = jdbc.queryForObject("SELECT lifecycle_status FROM job WHERE id = :j", new MapSqlParameterSource("j", jobId), String.class);
        if (java.util.Set.of("CLOSED", "CANCELLED", "REJECTED").contains(status)) throw new IllegalArgumentException("This drive is finished, so " + refused);
    }

    /** Add a round at the end of the recruiter's own drive. The placement cell gets a note and sets the date; students hear nothing until then. */
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> addRound(long recruiterId, Integer collegeId, Integer jobId, String kind, String name, String mode) {
        requireOwn(recruiterId, collegeId, jobId);
        requireOpenDrive(jobId);
        var round = extrasService.saveRound(jobId, null, roundForm(kind, name, mode));
        jdbc.update("UPDATE job_round SET added_by_recruiter_id = :h WHERE id = :r", new MapSqlParameterSource("h", recruiterId).addValue("r", round.getId()));
        audit.log(collegeId, "RECRUITER", (int) recruiterId, "ROUND_ADDED", "DRIVE", jobId.longValue(), round.getName());
        audit.bell(collegeId, "RECRUITER_ROUND_ADDED", "A recruiter added a round: " + round.getName(), "Set its date and venue when you are ready.", "/tpo/drives/" + jobId + "?tab=rounds");
        return Map.of("id", round.getId(), "seq", round.getSeq(), "name", round.getName());
    }

    /** Copies the round's placement-cell fields onto a recruiter's edit, so saving it never blanks them. */
    private void keepPlacementCellFields(Long roundId, com._42students.lms.dto.tpo.RoundForm form) {
        jdbc.query("SELECT scheduled_date, venue, meeting_url, what_to_bring, platform, test_link, duration_minutes, results_due FROM job_round WHERE id = :r",
                new MapSqlParameterSource("r", roundId), rs -> {
                    java.sql.Timestamp at = rs.getTimestamp("scheduled_date");
                    java.sql.Timestamp due = rs.getTimestamp("results_due");
                    form.setScheduledDate(at == null ? null : at.toLocalDateTime());
                    form.setVenue(rs.getString("venue"));
                    form.setMeetingUrl(rs.getString("meeting_url"));
                    form.setWhatToBring(rs.getString("what_to_bring"));
                    form.setPlatform(rs.getString("platform"));
                    form.setTestLink(rs.getString("test_link"));
                    int minutes = rs.getInt("duration_minutes");
                    form.setDurationMinutes(rs.wasNull() ? null : minutes);
                    form.setResultsDue(due == null ? null : due.toLocalDateTime());
                });
    }

    private void requireOwnUnusedRound(long recruiterId, Integer jobId, Long roundId) {
        requireRoundOf(jobId, roundId);
        Long mine = jdbc.queryForObject("SELECT COUNT(*) FROM job_round WHERE id = :r AND added_by_recruiter_id = :h", new MapSqlParameterSource("r", roundId).addValue("h", recruiterId), Long.class);
        if (mine == null || mine == 0) throw new IllegalArgumentException("Only a round you added can be changed here. Ask the placement cell to change this one.");
        Long used = jdbc.queryForObject("SELECT (SELECT COUNT(*) FROM round_result WHERE round_id = :r) + (SELECT COUNT(*) FROM job_application WHERE current_round_id = :r)", new MapSqlParameterSource("r", roundId), Long.class);
        if (used != null && used > 0) throw new IllegalArgumentException("This round already has results or students in it, so it can't be changed");
        // BE-0138: once the placement cell has scheduled the round (a date, or any slots), it is theirs to change.
        Long scheduled = jdbc.queryForObject("SELECT (SELECT COUNT(*) FROM round_slot WHERE round_id = :r) + (SELECT COUNT(*) FROM job_round WHERE id = :r AND scheduled_date IS NOT NULL)",
                new MapSqlParameterSource("r", roundId), Long.class);
        if (scheduled != null && scheduled > 0) throw new IllegalArgumentException("The placement cell has already scheduled this round, so ask them to change it");
    }

    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> updateRound(long recruiterId, Integer collegeId, Integer jobId, Long roundId, String kind, String name, String mode) {
        requireOwn(recruiterId, collegeId, jobId);
        requireOpenDrive(jobId);
        requireOwnUnusedRound(recruiterId, jobId, roundId);
        var form = roundForm(kind, name, mode);
        keepPlacementCellFields(roundId, form);
        var round = extrasService.saveRound(jobId, roundId, form);
        audit.log(collegeId, "RECRUITER", (int) recruiterId, "ROUND_CHANGED", "DRIVE", jobId.longValue(), round.getName());
        return Map.of("id", round.getId(), "name", round.getName());
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteRound(long recruiterId, Integer collegeId, Integer jobId, Long roundId) {
        requireOwn(recruiterId, collegeId, jobId);
        requireOpenDrive(jobId);
        requireOwnUnusedRound(recruiterId, jobId, roundId);
        extrasService.deleteRound(jobId, roundId);
        audit.log(collegeId, "RECRUITER", (int) recruiterId, "ROUND_REMOVED", "DRIVE", jobId.longValue(), String.valueOf(roundId));
    }

    /**
     * The applicants, exactly as the placement cell shared them: needs a live share link, uses that link's columns and stage cap, and the college's
     * "What companies see" rules. A recruiter never sees more than the company would through the link.
     */
    /**
     * Placements UX pass: the same cumulative pipeline funnel the TPO sees on their own drive
     * dashboard (TpoWorkspaceService.funnel — reused as-is, not a second copy), for this
     * recruiter's own drive. Pure aggregate counts, so unlike {@link #applicants} it is never
     * gated behind a live share link: no individual student's data is exposed by a stage count.
     */
    public List<Map<String, Object>> pipeline(long recruiterId, Integer collegeId, Integer jobId) {
        requireOwn(recruiterId, collegeId, jobId);
        return workspaceService.funnel(jobId);
    }

    public Map<String, Object> applicants(long recruiterId, Integer collegeId, Integer jobId) {
        requireOwn(recruiterId, collegeId, jobId);
        List<Map<String, Object>> share = jdbc.queryForList("SELECT columns_json, max_stage FROM tpo_share_link WHERE job_id = :j AND revoked_at IS NULL AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
                new MapSqlParameterSource("j", jobId));
        if (share.isEmpty()) {
            if (direct(jobId)) return Map.of("shared", true, "direct", true, "applicants", shareService.rowsFor(jobId, collegeId, DIRECT_COLUMNS, null), "columns", DIRECT_COLUMNS);
            return Map.of("shared", false, "applicants", List.of(), "columns", List.of());
        }
        // On their own drive the recruiter always sees where each applicant stands (recruiter UX audit, 19 Oct 2026: with no stage
        // column the not-selected looked like everyone else). The share's own columns still decide everything else.
        List<String> cols = new java.util.ArrayList<>(TpoShareService.readColumns(String.valueOf(share.get(0).get("columns_json"))));
        if (!cols.contains("stage")) cols.add("stage");
        String maxStage = (String) share.get(0).get("max_stage");
        List<Map<String, Object>> rows = shareService.rowsFor(jobId, collegeId, cols, maxStage);
        if (!direct(jobId)) return Map.of("shared", true, "applicants", rows, "columns", cols);
        // "As they apply" and a share at once: every applicant with the direct columns, and the share's extra columns (email, phone)
        // only on the rows the share covers. A share used to replace the direct view, so sharing "up to shortlisted" hid everyone else
        // (audit 13 Oct 2026, A1).
        Map<Object, Map<String, Object>> sharedById = new HashMap<>();
        for (Map<String, Object> r : rows) sharedById.put(r.get("applicantId"), r);
        List<Map<String, Object>> merged = new java.util.ArrayList<>();
        for (Map<String, Object> r : shareService.rowsFor(jobId, collegeId, DIRECT_COLUMNS, null)) {
            Map<String, Object> extra = sharedById.get(r.get("applicantId"));
            if (extra == null) { merged.add(r); continue; }
            Map<String, Object> m = new java.util.LinkedHashMap<>(r);
            extra.forEach(m::putIfAbsent);
            merged.add(m);
        }
        java.util.LinkedHashSet<String> columns = new java.util.LinkedHashSet<>(DIRECT_COLUMNS);
        columns.addAll(cols);
        return Map.of("shared", true, "direct", true, "applicants", merged, "columns", new java.util.ArrayList<>(columns));
    }

    private Map<String, Integer> applicationsByRef(Integer jobId) {
        Map<String, Integer> byRef = new HashMap<>();
        jdbc.query("SELECT id, public_ref FROM job_application WHERE job_id = :j AND (is_deleted = 0 OR is_deleted IS NULL)", new MapSqlParameterSource("j", jobId),
                rs -> { byRef.put(rs.getString("public_ref"), rs.getInt("id")); });
        return byRef;
    }

    /**
     * Shortlists and round results from the recruiter. Each row names an applicant by the id the recruiter was given. The results wait for the TPO,
     * unless the TPO switched on "apply this company's results automatically" for this drive and the whole submission is pass lists: those apply at
     * once. A failed or absent row always waits for a person.
     */
    @Transactional
    public Map<String, Object> submitResults(long recruiterId, Integer collegeId, Integer jobId, Long roundId, List<Map<String, Object>> rows) {
        requireOwn(recruiterId, collegeId, jobId);
        requireOpenDrive(jobId, "results can no longer be sent");
        requireLiveShare(jobId);
        requireRoundOf(jobId, roundId);
        if (rows == null || rows.isEmpty()) throw new IllegalArgumentException("Add at least one row");
        Map<String, Integer> byRef = applicationsByRef(jobId);
        int staged = 0;
        boolean allPass = true;
        for (Map<String, Object> r : rows) {
            Integer appId = byRef.get(String.valueOf(r.get("applicantId")));
            String outcome = r.get("outcome") == null ? "" : String.valueOf(r.get("outcome")).toUpperCase(Locale.ROOT);
            if (appId == null) throw new IllegalArgumentException("Applicant " + r.get("applicantId") + " is not on this drive");
            if (!Set.of("PASS", "FAIL", "HOLD", "ABSENT").contains(outcome)) throw new IllegalArgumentException("Result must be PASS, FAIL, HOLD or ABSENT");
            if (!"PASS".equals(outcome)) allPass = false;
            resultsService.stage(roundId, appId, outcome, intOrNull(r.get("waitlistRank")), null, str(r.get("reasonCategory")),
                    str(r.get("comment")), "RECRUITER", "RECRUITER", (int) recruiterId);
            staged++;
        }
        boolean auto = Boolean.TRUE.equals(jdbc.queryForObject("SELECT results_auto_apply FROM job WHERE id = :j", new MapSqlParameterSource("j", jobId), Boolean.class));
        boolean applied = false;
        if (auto && allPass) {
            boolean otherWaiting = Optional.ofNullable(jdbc.queryForObject("SELECT COUNT(*) FROM round_result WHERE round_id = :r AND applied_at IS NULL AND superseded_by IS NULL AND outcome <> 'PASS'",
                    new MapSqlParameterSource("r", roundId), Long.class)).orElse(0L) > 0;
            if (!otherWaiting) { resultsService.applyRound(roundId, null, true); applied = true; }
        }
        audit.log(collegeId, "RECRUITER", (int) recruiterId, "RECRUITER_RESULTS_SENT", "DRIVE", jobId.longValue(), staged + " rows" + (applied ? ", applied automatically" : ""));
        audit.bell(collegeId, "RECRUITER_RESULTS", "A recruiter sent results", staged + " row(s) waiting" + (applied ? " (applied automatically)" : ""), "/tpo/drives/" + jobId + "?tab=rounds");
        return Map.of("staged", staged, "applied", applied);
    }

    @Transactional
    public int proposeSlots(long recruiterId, Integer collegeId, Integer jobId, Long roundId, List<Map<String, Object>> slots) {
        requireOwn(recruiterId, collegeId, jobId);
        requireOpenDrive(jobId, "slots can no longer be proposed");
        requireRoundOf(jobId, roundId);
        int n = scheduleService.proposeSlots(roundId, slots == null ? List.of() : slots, "RECRUITER");
        audit.log(collegeId, "RECRUITER", (int) recruiterId, "RECRUITER_SLOTS_PROPOSED", "ROUND", roundId, n + " slots");
        audit.bell(collegeId, "RECRUITER_SLOTS", "A recruiter proposed interview slots", n + " slot(s) to confirm", "/tpo/drives/" + jobId + "?tab=rounds");
        return n;
    }

    public List<Map<String, Object>> slots(long recruiterId, Integer collegeId, Integer jobId, Long roundId) {
        requireOwn(recruiterId, collegeId, jobId);
        requireRoundOf(jobId, roundId);
        return scheduleService.slots(roundId);
    }

    /** The company's selection list: each named applicant becomes a Selected offer that the TPO verifies and releases. */
    @Transactional
    public int submitSelections(long recruiterId, Integer collegeId, Integer jobId, List<String> applicantIds, String roleOption, BigDecimal ctcLpa, String kind) {
        requireOwn(recruiterId, collegeId, jobId);
        requireOpenDrive(jobId, "a selection list can no longer be sent");
        requireLiveShare(jobId);
        if (applicantIds == null || applicantIds.isEmpty()) throw new IllegalArgumentException("Choose at least one applicant");
        Map<String, Integer> byRef = applicationsByRef(jobId);
        int n = 0, skipped = 0;
        for (String ref : new LinkedHashSet<>(applicantIds)) {
            Integer appId = byRef.get(ref);
            if (appId == null) throw new IllegalArgumentException("Applicant " + ref + " is not on this drive");
            try {
                offerService.recordSelection(appId, roleOption, ctcLpa, "LOI".equalsIgnoreCase(kind) ? "LOI" : "OFFER", (int) recruiterId, "RECRUITER");
                n++;
            } catch (IllegalStateException alreadyOrOut) {
                skipped++; // already holds an offer, or no longer in play: a re-sent list no longer fails as a whole
            }
        }
        audit.log(collegeId, "RECRUITER", (int) recruiterId, "RECRUITER_SELECTIONS_SENT", "DRIVE", jobId.longValue(), n + " selections" + (skipped > 0 ? ", " + skipped + " skipped (already offered or out)" : ""));
        audit.bell(collegeId, "RECRUITER_SELECTIONS", "A recruiter sent a selection list", n + " selection(s) to verify", "/tpo/drives/" + jobId + "?tab=offers");
        return n;
    }

    private static String str(Object o) { return o == null || String.valueOf(o).isBlank() ? null : String.valueOf(o); }
    private static Integer intOrNull(Object o) {
        try { return o == null || String.valueOf(o).isBlank() ? null : Integer.valueOf(String.valueOf(o).replaceAll("\\.0+$", "")); } catch (NumberFormatException e) { return null; }
    }
}
