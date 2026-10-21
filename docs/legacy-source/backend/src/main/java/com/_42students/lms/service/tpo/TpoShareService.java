package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

/**
 * "Share with company" (TPO V1 - Locked.docx §5 Applicants): a secure link with a one-time code, 7-day expiry, the
 * company's saved columns, capped by stage and by "What companies see". Every open and download is logged. The raw
 * token and code are returned once to the TPO to pass on; only their hashes are stored. Never an attachment.
 */
@Service
@RequiredArgsConstructor
public class TpoShareService {

    public static final int TTL_DAYS = 7;
    /** Stages in the order a company may see them; phone numbers only appear from SHORTLISTED onward. */
    private static final List<String> STAGE_ORDER = List.of("APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "OFFERED", "HIRED");
    public static final List<String> ALL_COLUMNS = List.of("name", "roll", "branch", "cgpa", "tenth", "twelfth", "email", "phone", "resume", "projects", "skillMatch", "stage");
    private static final SecureRandom RNG = new SecureRandom();

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoAuditService audit;
    private final TpoMailService mail;
    private final org.springframework.core.env.Environment environment;
    private final AcademicMarksService marks;

    private static String token() {
        byte[] b = new byte[24]; RNG.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }
    private static String code() { return String.format("%06d", RNG.nextInt(1_000_000)); }

    @Transactional
    public Map<String, Object> create(Integer collegeId, Integer jobId, String recipientEmail, List<String> columns, String maxStage,
                                      LocalDateTime shortlistBy, Integer actorId, boolean emailLink, String linkBase) {
        // A real address: the link and its code are emailed there ("a@" or "x @y" used to be accepted).
        if (recipientEmail == null || !recipientEmail.trim().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) throw new IllegalArgumentException("Enter the company contact's email");
        List<String> cols = new ArrayList<>();
        for (String c : columns == null ? List.<String>of() : columns) {
            if (ALL_COLUMNS.contains(c) && !cols.contains(c)) cols.add(c);
        }
        if (cols.isEmpty()) cols.addAll(List.of("name", "roll", "branch", "cgpa", "resume")); // nothing usable chosen: the usual set, never a list of bare ids
        if (maxStage != null && !STAGE_ORDER.contains(maxStage)) throw new IllegalArgumentException("Unknown stage");
        String raw = token(), otp = code();
        String cols_json;
        try { cols_json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(cols); } catch (Exception e) { throw new IllegalStateException(e); }
        jdbc.update("INSERT INTO tpo_share_link (college_id, job_id, token_hash, recipient_email, code_hash, columns_json, max_stage, shortlist_by, expires_at, created_by) " +
                        "VALUES (:c, :j, :t, :e, :cd, :cols, :ms, :sb, :exp, :by)",
                new MapSqlParameterSource("c", collegeId).addValue("j", jobId).addValue("t", TpoRecruiterLeadService.sha256Hex(raw))
                        .addValue("e", recipientEmail.trim().toLowerCase(Locale.ROOT)).addValue("cd", TpoRecruiterLeadService.sha256Hex(otp))
                        .addValue("cols", cols_json).addValue("ms", maxStage).addValue("sb", shortlistBy)
                        .addValue("exp", LocalDateTime.now().plusDays(TTL_DAYS)).addValue("by", actorId));
        Long id = jdbc.queryForObject("SELECT id FROM tpo_share_link WHERE token_hash = :t", new MapSqlParameterSource("t", TpoRecruiterLeadService.sha256Hex(raw)), Long.class);
        event(id, "CREATED", "for " + recipientEmail.trim());
        audit.log(collegeId, "TPO", actorId, "APPLICANTS_SHARED", "DRIVE", jobId.longValue(), "with " + recipientEmail.trim());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", id); out.put("token", raw); out.put("code", otp); out.put("expiresAt", LocalDateTime.now().plusDays(TTL_DAYS).toString());
        out.put("emailAvailable", mail.isConfigured("share-link"));
        boolean emailed = false;
        if (emailLink && linkBase != null && mail.isConfigured("share-link")) {
            Map<String, Object> ctx = jdbc.queryForMap("SELECT j.company_name AS company, j.job_title AS role, c.name AS college FROM job j LEFT JOIN college c ON c.id = j.college_id WHERE j.id = :j",
                    new MapSqlParameterSource("j", jobId));
            Map<String, String> merge = new LinkedHashMap<>();
            merge.put("company", String.valueOf(ctx.get("company"))); merge.put("role", String.valueOf(ctx.get("role")));
            merge.put("collegeName", ctx.get("college") == null ? "" : String.valueOf(ctx.get("college")));
            merge.put("link", linkBase + "/company-share/" + raw); merge.put("expiresOn", LocalDateTime.now().plusDays(TTL_DAYS).toLocalDate().format(java.time.format.DateTimeFormatter.ofPattern("d MMM yyyy", java.util.Locale.ENGLISH)));
            emailed = mail.sendAsCollege("share-link", recipientEmail.trim(), merge, collegeId) == TpoMailService.Result.SENT;
            if (emailed) event(id, "LINK_EMAILED", recipientEmail.trim());
        }
        out.put("emailed", emailed);
        return out;
    }

    public List<Map<String, Object>> listForDrive(Integer jobId) {
        return jdbc.queryForList("SELECT sl.id, sl.recipient_email AS recipientEmail, sl.columns_json AS columns, sl.max_stage AS maxStage, sl.expires_at AS expiresAt, " +
                "sl.revoked_at AS revokedAt, sl.created_at AS createdAt, (SELECT COUNT(*) FROM tpo_share_event e WHERE e.share_id = sl.id AND e.action LIKE 'DOWNLOADED%') AS downloads, " +
                "(SELECT COUNT(*) FROM tpo_share_event e WHERE e.share_id = sl.id AND e.action = 'OPENED') AS opens FROM tpo_share_link sl WHERE sl.job_id = :j ORDER BY sl.created_at DESC",
                new MapSqlParameterSource("j", jobId));
    }

    public List<Map<String, Object>> events(Long shareId) {
        return jdbc.queryForList("SELECT action, detail, created_at AS createdAt FROM tpo_share_event WHERE share_id = :s ORDER BY created_at DESC",
                new MapSqlParameterSource("s", shareId));
    }

    @Transactional
    public void revoke(Long shareId, Integer collegeId, Integer actorId) {
        int n = jdbc.update("UPDATE tpo_share_link SET revoked_at = NOW() WHERE id = :s AND college_id = :c AND revoked_at IS NULL",
                new MapSqlParameterSource("s", shareId).addValue("c", collegeId));
        if (n > 0) { event(shareId, "REVOKED", null); audit.log(collegeId, "TPO", actorId, "SHARE_REVOKED", "SHARE", shareId, null); }
    }

    private void event(Long shareId, String action, String detail) {
        jdbc.update("INSERT INTO tpo_share_event (share_id, action, detail) VALUES (:s, :a, :d)",
                new MapSqlParameterSource("s", shareId).addValue("a", action).addValue("d", detail));
    }

    // ---------------------------------------------------------------- public (company) side
    private Map<String, Object> usable(String rawToken) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT sl.*, j.company_name, j.job_title FROM tpo_share_link sl JOIN job j ON j.id = sl.job_id WHERE sl.token_hash = :t",
                new MapSqlParameterSource("t", TpoRecruiterLeadService.sha256Hex(rawToken == null ? "" : rawToken)));
        if (rows.isEmpty()) throw new IllegalArgumentException("Not found");
        Map<String, Object> sl = rows.get(0);
        if (sl.get("revoked_at") != null || TpoTime.ldt(sl.get("expires_at")).isBefore(LocalDateTime.now())) throw new IllegalArgumentException("Not found");
        return sl;
    }

    /** What the company sees before entering the code: just who it is from. Every unusable link answers the same. */
    public Map<String, Object> publicInfo(String rawToken) {
        Map<String, Object> sl = usable(rawToken);
        return Map.of("company", sl.get("company_name"), "role", sl.get("job_title"), "needsCode", true, "expiresAt", String.valueOf(sl.get("expires_at")),
                "emailCodeAvailable", mail.isConfigured("share-code"));
    }

    /** Wrong codes allowed per link per hour before it stops opening (a six-digit code is otherwise guessable). */
    static final int MAX_WRONG_CODES_PER_HOUR = 10;

    /**
     * The code check every public action goes through. After MAX_WRONG_CODES_PER_HOUR wrong codes in the last hour the link
     * opens for nobody (not even with the right code) until the hour has passed; each wrong code is recorded, and the placement
     * cell is told once when a link locks. There was no limit: the link plus a million tries opened the list.
     */
    private void requireCode(Map<String, Object> sl, String code) {
        long shareId = ((Number) sl.get("id")).longValue();
        Long wrong = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_share_event WHERE share_id = :s AND action = 'CODE_FAILED' AND created_at > NOW() - INTERVAL 1 HOUR",
                new MapSqlParameterSource("s", shareId), Long.class);
        long n = wrong == null ? 0 : wrong;
        if (n >= MAX_WRONG_CODES_PER_HOUR) throw new IllegalArgumentException("Not found");
        if (codeOk(sl, code)) return;
        event(shareId, "CODE_FAILED", null);
        if (n + 1 >= MAX_WRONG_CODES_PER_HOUR) {
            audit.bell(((Number) sl.get("college_id")).intValue(), "SHARE_LOCKED", "A shared applicant list was locked after " + MAX_WRONG_CODES_PER_HOUR + " wrong codes",
                    String.valueOf(sl.get("company_name")) + ": it opens again in an hour, or revoke it and share again", "/tpo/drives/" + sl.get("job_id"));
        }
        throw new IllegalArgumentException("Not found");
    }

    /** A code is good if it is the one made with the link, or the latest one emailed to the company and not yet expired. */
    private boolean codeOk(Map<String, Object> sl, String code) {
        if (code == null || code.isBlank()) return false;
        String h = TpoRecruiterLeadService.sha256Hex(code.trim());
        if (h.equals(sl.get("code_hash"))) return true;
        Object eh = sl.get("email_code_hash");
        Object ex = sl.get("email_code_expires");
        return eh != null && h.equals(eh) && ex != null && TpoTime.ldt(ex).isAfter(LocalDateTime.now());
    }

    /**
     * "Email me a code": proves the person holds the mailbox the TPO named. A new code replaces the last emailed one. Returns the
     * template state so the page can say what happened; the TPO's own code keeps working as the fallback.
     */
    /** BE-0191: at most one emailed code a minute and SHARE_CODE_EMAILS_PER_HOUR an hour, per link. */
    static final int SHARE_CODE_EMAILS_PER_HOUR = 5;

    @Transactional
    public String sendCode(String rawToken) {
        Map<String, Object> sl = usable(rawToken);
        if (!mail.isConfigured("share-code")) return "NOT_AVAILABLE";
        // The link row is locked so two clicks at once count each other; inside the limits the last code stays valid.
        jdbc.queryForList("SELECT id FROM tpo_share_link WHERE id = :id FOR UPDATE", new MapSqlParameterSource("id", sl.get("id")));
        Map<String, Object> sent = jdbc.queryForMap("SELECT " +
                "SUM(created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)) AS lastMinute, SUM(created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)) AS lastHour " +
                "FROM tpo_share_event WHERE share_id = :id AND action = 'CODE_EMAILED' FOR UPDATE", new MapSqlParameterSource("id", sl.get("id")));
        if (sent.get("lastMinute") != null && ((Number) sent.get("lastMinute")).intValue() > 0) return "TOO_SOON";
        if (sent.get("lastHour") != null && ((Number) sent.get("lastHour")).intValue() >= SHARE_CODE_EMAILS_PER_HOUR) return "LIMIT";
        String otp = code();
        jdbc.update("UPDATE tpo_share_link SET email_code_hash = :h, email_code_expires = :e WHERE id = :id",
                new MapSqlParameterSource("h", TpoRecruiterLeadService.sha256Hex(otp)).addValue("e", LocalDateTime.now().plusMinutes(15)).addValue("id", sl.get("id")));
        Map<String, String> merge = new LinkedHashMap<>();
        merge.put("company", String.valueOf(sl.get("company_name"))); merge.put("role", String.valueOf(sl.get("job_title")));
        merge.put("code", otp); merge.put("minutes", "15");
        TpoMailService.Result r = mail.sendAsCollege("share-code", String.valueOf(sl.get("recipient_email")), merge, sl.get("college_id") == null ? null : ((Number) sl.get("college_id")).intValue());
        if (r == TpoMailService.Result.SENT) event(((Number) sl.get("id")).longValue(), "CODE_EMAILED", null);
        return r == TpoMailService.Result.SENT ? "SENT" : "FAILED";
    }

    /** Verifies the code and returns the rows for the allowed columns. */
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public Map<String, Object> publicOpen(String rawToken, String code) {
        Map<String, Object> sl = usable(rawToken);
        requireCode(sl, code);
        long shareId = ((Number) sl.get("id")).longValue();
        int jobId = ((Number) sl.get("job_id")).intValue();
        int collegeId = ((Number) sl.get("college_id")).intValue();
        @SuppressWarnings("unchecked") List<String> cols = readCols((String) sl.get("columns_json"));

        List<Map<String, Object>> out = rowsFor(jobId, collegeId, cols, (String) sl.get("max_stage"));
        Long opens = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_share_event WHERE share_id = :s AND action = 'OPENED'", new MapSqlParameterSource("s", shareId), Long.class);
        if (opens == null || opens == 0) audit.bell(collegeId, "SHARE_OPENED", String.valueOf(sl.get("company_name")) + " opened the applicant list", String.valueOf(sl.get("job_title")), "/tpo/drives/" + jobId);
        event(shareId, "OPENED", out.size() + " applicants");
        List<String> college = jdbc.queryForList("SELECT name FROM college WHERE id = :c", new MapSqlParameterSource("c", collegeId), String.class);
        return Map.of("company", sl.get("company_name"), "role", sl.get("job_title"), "shortlistBy", String.valueOf(sl.get("shortlist_by")),
                "applicants", out, "columns", cols, "sharedBy", college.isEmpty() ? "" : college.get(0),
                "sharedOn", LocalDateTime.now().toLocalDate().toString(), "zipAvailable", cols.contains("resume"));
    }

    /**
     * The applicants a company (or a recruiter looking at their own drive) may see: only the ticked columns, CGPA as a band unless the college shows
     * it exactly, phone only from SHORTLISTED on, nobody past the stage cap. One place, so the share page, the ZIP and the recruiter portal always agree.
     */
    /** recruiter V1 §9 retention: 90 days after a drive closes, contact details and resumes of students it did NOT hire disappear from recruiter
     * screens (counts and who was hired stay). Enforced at read time against the college's own data, never by deleting anything —
     * the TPO's own screens are unaffected, and if a closed drive somehow reopens the 90-day clock simply stops applying. */
    private static final int RETENTION_DAYS = 90;

    public List<Map<String, Object>> rowsFor(int jobId, int collegeId, List<String> cols, String maxStage) {
        return rowsFor(jobId, collegeId, cols, maxStage, null);
    }

    /**
     * Same rules as above, with an optional {@code onlyLearnerId} to get back just one student's
     * own row — Student V1 §7 "See what companies see": a self-preview must follow exactly the
     * same column/band/retention logic a real company gets, not a second hand-written copy of it.
     */
    public List<Map<String, Object>> rowsFor(int jobId, int collegeId, List<String> cols, String maxStage, Integer onlyLearnerId) {
        List<Map<String, Object>> see = jdbc.queryForList("SELECT show_cgpa_exact, show_tenth_twelfth, show_project_links, show_assessment_scores FROM college_what_companies_see WHERE college_id = :c",
                new MapSqlParameterSource("c", collegeId));
        boolean exactCgpa = !see.isEmpty() && bool(see.get(0).get("show_cgpa_exact"));
        boolean tenthTwelfth = see.isEmpty() || bool(see.get(0).get("show_tenth_twelfth"));
        boolean projects = see.isEmpty() || bool(see.get(0).get("show_project_links"));

        List<Map<String, Object>> closedRows = jdbc.queryForList("SELECT closed_at FROM job WHERE id = :j", new MapSqlParameterSource("j", jobId));
        boolean pastRetention = !closedRows.isEmpty() && closedRows.get(0).get("closed_at") != null
                && TpoTime.ldt(closedRows.get(0).get("closed_at")).isBefore(LocalDateTime.now().minusDays(RETENTION_DAYS));
        Set<Integer> hiredLearnerIds = pastRetention ? new HashSet<>(jdbc.queryForList(
                "SELECT a.learner_id FROM job_offer o JOIN job_application a ON a.id = o.application_id WHERE a.job_id = :j AND o.status = 'ACCEPTED'",
                new MapSqlParameterSource("j", jobId), Integer.class)) : Set.of();

        MapSqlParameterSource params = new MapSqlParameterSource("j", jobId);
        String learnerFilter = "";
        if (onlyLearnerId != null) { learnerFilter = " AND a.learner_id = :l"; params.addValue("l", onlyLearnerId); }
        List<Map<String, Object>> applicants = jdbc.queryForList(
                "SELECT a.public_ref AS applicantId, a.application_status AS stage, a.learner_id AS learnerId, l.skills AS profile_skills, l.first_name, l.last_name, l.roll_number, l.department, " +
                "l.contact_mail, l.contact_mobile, l.resume_url, l.github, l.portfolio, r.cgpa, r.tenth_pct, r.twelfth_pct, r.diploma_pct " +
                "FROM job_application a JOIN learner l ON l.id = a.learner_id LEFT JOIN learner_academic_record r ON r.learner_id = l.id " +
                "WHERE a.job_id = :j AND (a.is_deleted = 0 OR a.is_deleted IS NULL) AND a.application_status NOT IN ('WITHDRAWN')" + learnerFilter + " ORDER BY l.roll_number",
                params);
        // Marks as the placement cell sees them: a percentage, CGPA converted with the college's rule. Only verified marks leave the college.
        Map<Integer, Map<String, Object>> marksOf = (cols.contains("cgpa") || cols.contains("tenth") || cols.contains("twelfth")) && !applicants.isEmpty()
                ? marks.marksForLearners(applicants.stream().map(x -> ((Number) x.get("learnerId")).intValue()).toList()) : Map.of();
        List<Object> prefs = cols.contains("skillMatch") ? jdbc.queryForList("SELECT candidate_preferences FROM job WHERE id = :j",
                new MapSqlParameterSource("j", jobId), Object.class) : List.of();
        Set<String> wantedSkills = SkillMatch.wanted(prefs.isEmpty() ? null : prefs.get(0)); // a drive with no preferences reads as a null row
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> a : applicants) {
            String stage = String.valueOf(a.get("stage"));
            int learnerId = ((Number) a.get("learnerId")).intValue();
            int stageIdx = STAGE_ORDER.indexOf(stage);
            // "Up to <stage>" shares only students on the way to that stage: a not-selected or waitlisted student has no place in the
            // order and was shared whatever the TPO chose (with their email and resume).
            if (maxStage != null && (stageIdx < 0 || stageIdx > STAGE_ORDER.indexOf(maxStage))) continue;
            boolean retained = pastRetention && !hiredLearnerIds.contains(((Number) a.get("learnerId")).intValue());
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("applicantId", a.get("applicantId"));
            if (cols.contains("name")) row.put("name", (str(a.get("first_name")) + " " + str(a.get("last_name"))).trim());
            if (cols.contains("roll")) row.put("roll", a.get("roll_number"));
            if (cols.contains("branch")) row.put("branch", a.get("department"));
            // The "cgpa" column (its key kept for saved share links) now carries the UG %: exact, or a 5-point band.
            java.math.BigDecimal ug = verifiedPct(marksOf.get(learnerId), "UG");
            if (cols.contains("cgpa") && ug != null) row.put("cgpa", exactCgpa ? ug.setScale(1, java.math.RoundingMode.HALF_UP).stripTrailingZeros().toPlainString() : band(ug.doubleValue()));
            if (cols.contains("tenth") && tenthTwelfth) row.put("tenth", verifiedPct(marksOf.get(learnerId), "10TH"));
            if (cols.contains("twelfth") && tenthTwelfth) { java.math.BigDecimal tw = verifiedPct(marksOf.get(learnerId), "12TH"); row.put("twelfth", tw != null ? tw : verifiedPct(marksOf.get(learnerId), "DIPLOMA")); }
            if (cols.contains("email") && !retained) row.put("email", a.get("contact_mail"));
            // Phone only after shortlist, whatever columns were ticked; never past the retention window for a student not hired.
            if (cols.contains("phone") && !retained && stageIdx >= STAGE_ORDER.indexOf("SHORTLISTED")) row.put("phone", a.get("contact_mobile"));
            if (cols.contains("resume") && !retained) row.put("resume", a.get("resume_url"));
            if (cols.contains("projects") && projects && !retained) { row.put("github", a.get("github")); row.put("portfolio", a.get("portfolio")); }
            if (cols.contains("skillMatch")) { Object m = SkillMatch.of(wantedSkills, a.get("profile_skills")).get("skillMatch"); if (m != null) row.put("skillMatch", m); }
            if (cols.contains("stage")) row.put("stage", stage);
            out.add(row);
        }
        return out;
    }

    /** The company reports a download (list or resumes) so the TPO's Activity shows it. */
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public void publicLogDownload(String rawToken, String code, String kind) {
        Map<String, Object> sl = usable(rawToken);
        requireCode(sl, code);
        event(((Number) sl.get("id")).longValue(), "ZIP".equals(kind) ? "DOWNLOADED_ZIP" : "DOWNLOADED_LIST", null);
    }

    /**
     * All shared resumes as one ZIP named ROLL_Name.pdf, with a README saying who shared it and when. Only files from the platform's own
     * storage host are fetched (never an arbitrary link a student typed), with size and count limits. Logged as a ZIP download.
     */
    public void writeResumeZip(String rawToken, String code, java.io.OutputStream target) throws java.io.IOException {
        Map<String, Object> sl = usable(rawToken);
        requireCode(sl, code);
        List<String> cols = readCols((String) sl.get("columns_json"));
        if (!cols.contains("resume")) throw new IllegalArgumentException("Not found");
        Map<String, Object> shared = publicOpen(rawToken, code); // same rows, same caps, same log entry as opening the list
        @SuppressWarnings("unchecked") List<Map<String, Object>> rows = (List<Map<String, Object>>) shared.get("applicants");
        writeZipCore(rows, String.valueOf(shared.get("sharedBy")), String.valueOf(shared.get("company")), String.valueOf(shared.get("role")),
                String.valueOf(shared.get("sharedOn")), target);
        event(((Number) sl.get("id")).longValue(), "DOWNLOADED_ZIP", null);
    }

    /**
     * recruiter V1 §7 "Resumes (ZIP)": the recruiter is already authenticated, so this needs no token or code — just their own drive's
     * shared rows, same column and stage caps as the share link (rowsFor is the one place those rules live), same file naming and
     * README as the public path.
     */
    public void writeResumeZipForRecruiter(Integer jobId, Integer collegeId, java.io.OutputStream target) throws java.io.IOException {
        writeResumeZipForRecruiter(jobId, collegeId, null, target);
    }

    /** {@code directColumns}: what to include when nothing is shared but the college shows recruiters applicants directly; null otherwise. */
    public void writeResumeZipForRecruiter(Integer jobId, Integer collegeId, List<String> directColumns, java.io.OutputStream target) throws java.io.IOException {
        // rowsFor trusts jobId for the applicants and collegeId only for display settings — it does not itself check the two agree.
        // The caller (RecruiterDriveController) already checks the drive is this recruiter's own, but a resume ZIP is sensitive enough to
        // check again here rather than rely on every future caller remembering to.
        Long ownJob = jdbc.queryForObject("SELECT COUNT(*) FROM job WHERE id = :j AND college_id = :c", new MapSqlParameterSource("j", jobId).addValue("c", collegeId), Long.class);
        if (ownJob == null || ownJob == 0) throw new IllegalArgumentException("Not found");
        List<Map<String, Object>> share = jdbc.queryForList("SELECT columns_json, max_stage FROM tpo_share_link WHERE job_id = :j AND revoked_at IS NULL AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
                new MapSqlParameterSource("j", jobId));
        List<String> cols;
        String maxStage;
        if (!share.isEmpty()) {
            cols = readCols(String.valueOf(share.get(0).get("columns_json")));
            maxStage = (String) share.get(0).get("max_stage");
        } else if (directColumns != null) {
            // The college lets recruiters see applicants as they apply (N6): the same columns the recruiter's table shows.
            cols = directColumns;
            maxStage = null;
        } else {
            throw new IllegalArgumentException("Not found");
        }
        if (!cols.contains("resume")) throw new IllegalArgumentException("Not found");
        List<Map<String, Object>> rows = rowsFor(jobId, collegeId, cols, maxStage);
        Map<String, Object> job = jdbc.queryForMap("SELECT company_name AS company, job_title AS role FROM job WHERE id = :j", new MapSqlParameterSource("j", jobId));
        List<String> college = jdbc.queryForList("SELECT name FROM college WHERE id = :c", new MapSqlParameterSource("c", collegeId), String.class);
        writeZipCore(rows, college.isEmpty() ? "" : college.get(0), String.valueOf(job.get("company")), String.valueOf(job.get("role")),
                LocalDateTime.now().toLocalDate().toString(), target);
    }

    private void writeZipCore(List<Map<String, Object>> rows, String sharedBy, String company, String role, String sharedOn, java.io.OutputStream target) throws java.io.IOException {
        String base = environment.getProperty("r2.public.url", "");
        java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder().connectTimeout(java.time.Duration.ofSeconds(10)).build();
        List<String> missing = new ArrayList<>();
        Set<String> names = new HashSet<>();
        long total = 0;
        try (java.util.zip.ZipOutputStream zip = new java.util.zip.ZipOutputStream(target)) {
            int count = 0;
            for (Map<String, Object> r : rows) {
                Object url = r.get("resume");
                String label = (str(r.get("roll")) + "_" + str(r.get("name"))).replaceAll("[^A-Za-z0-9._-]+", "_");
                if (url == null || String.valueOf(url).isBlank()) { missing.add(label + " (no resume uploaded)"); continue; }
                if (base.isBlank() || !String.valueOf(url).startsWith(base) || count >= 300 || total > 150L * 1024 * 1024) { missing.add(label + " (not included)"); continue; }
                try {
                    java.net.http.HttpResponse<byte[]> resp = client.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(String.valueOf(url)))
                            .timeout(java.time.Duration.ofSeconds(20)).GET().build(), java.net.http.HttpResponse.BodyHandlers.ofByteArray());
                    if (resp.statusCode() / 100 != 2 || resp.body().length > 15 * 1024 * 1024) { missing.add(label + " (could not be fetched)"); continue; }
                    String file = label + ".pdf";
                    for (int n = 2; !names.add(file); n++) file = label + "_" + n + ".pdf";
                    zip.putNextEntry(new java.util.zip.ZipEntry(file));
                    zip.write(resp.body());
                    zip.closeEntry();
                    total += resp.body().length; count++;
                } catch (Exception e) {
                    missing.add(label + " (could not be fetched)");
                }
            }
            String readme = "Shared by " + sharedBy + " for " + company + " (" + role + ") on " + sharedOn
                    + ".\nThis file is confidential. Please do not forward it.\n" + (missing.isEmpty() ? "" : "\nNot included:\n - " + String.join("\n - ", missing) + "\n");
            zip.putNextEntry(new java.util.zip.ZipEntry("README.txt"));
            zip.write(readme.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            zip.closeEntry();
        }
    }

    /** 5-point bands: 75-80%. */
    private static String band(double pct) {
        int lo = Math.min(95, (int) Math.floor(pct / 5) * 5);
        return lo + "-" + (lo + 5) + "%";
    }

    @SuppressWarnings("unchecked")
    private static java.math.BigDecimal verifiedPct(Map<String, Object> row, String level) {
        if (row == null || !(row.get("marks") instanceof Map<?, ?> m) || !(m.get(level) instanceof Map<?, ?> e)) return null;
        if (!Boolean.TRUE.equals(e.get("verified")) || !(e.get("pct") instanceof java.math.BigDecimal p)) return null;
        return p;
    }
    private static boolean bool(Object o) { return o instanceof Boolean b ? b : o instanceof Number n && n.intValue() != 0; }
    private static String str(Object o) { return o == null ? "" : String.valueOf(o); }
    public static List<String> readColumns(String json) { return readCols(json); }

    @SuppressWarnings("unchecked")
    private static List<String> readCols(String json) {
        try { return new com.fasterxml.jackson.databind.ObjectMapper().readValue(json, List.class); } catch (Exception e) { return List.of("name", "roll"); }
    }
}
