package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import com._42students.lms.model.tpo.JobEligibility;
import com._42students.lms.model.tpo.JobLifecycleStatus;
import com._42students.lms.model.tpo.JobRoleOption;
import com._42students.lms.repository.JobRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Change requests on a drive (recruiter phase 1, N9 and N14): a reviewer never sends a drive back. They ask for a change
 * on a named field, either proposing a value (the other side answers Accept or Decline) or asking for a detail (answered in
 * one input). An accepted or answered request is applied to the drive at once. When the company has settled every institutional
 * request on a drive in review, the drive is marked "changes made" and goes back to the top of the placement cell's queue.
 *
 * The same row serves both directions: COLLEGE_TO_COMPANY (an institutional request, from the placement cell) and
 * COMPANY_TO_COLLEGE (a company request, from the recruiter). Every step leaves a line in the drive's company thread
 * (TpoMessagesService.postEvent), so the Discussion is the drive's one timeline; talking a request over happens there too.
 *
 * Locking: every change takes the request row (when there is one) and then the drive row FOR UPDATE before reading anything,
 * so two people acting at once take turns, and a save never overwrites a drive edit made in between.
 * Audit of every edge case: docs/recruiter-global/REQUESTS-DISCUSSION-AUDIT-2026-10-12.md.
 */
@Service
@RequiredArgsConstructor
public class DriveChangeRequestService {

    public static final String TO_COMPANY = "COLLEGE_TO_COMPANY";
    public static final String TO_COLLEGE = "COMPANY_TO_COLLEGE";
    public static final Set<String> FIELDS = Set.of("ROLE_TITLE", "DESCRIPTION", "LOCATION", "JOB_TYPE", "MODE", "DEADLINE",
            "CTC_LPA", "STIPEND", "MIN_CGPA", "BRANCHES", "OTHER");
    private static final Map<String, String> LABEL = Map.ofEntries(
            Map.entry("ROLE_TITLE", "Role title"), Map.entry("DESCRIPTION", "Description"), Map.entry("LOCATION", "Location"),
            Map.entry("JOB_TYPE", "Job type"), Map.entry("MODE", "Mode"), Map.entry("DEADLINE", "Application deadline"),
            Map.entry("CTC_LPA", "CTC (LPA)"), Map.entry("STIPEND", "Monthly stipend"), Map.entry("MIN_CGPA", "Minimum CGPA"),
            Map.entry("BRANCHES", "Branches"), Map.entry("OTHER", "Other"));
    private static final String SEVERAL_ROLES = "This drive has several roles; use Something else and say which role should change";

    private final NamedParameterJdbcTemplate jdbc;
    private final JobRepository jobRepository;
    private final TpoAuditService audit;
    private final TpoMessagesService messages;
    private final LiveDriveChangeService liveDriveChange;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** Who is acting: "FACULTY" (the placement cell) or "RECRUITER". */
    public record Actor(String type, Integer id, String name) {
        boolean isCollege() {
            return !"RECRUITER".equals(type);
        }
    }

    public static class NewRequest {
        public String field;
        public String kind;
        public String proposedValue;
        public String note;
    }

    public List<Map<String, Object>> list(Integer jobId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, job_id AS jobId, direction, field, kind, current_value AS currentValue, "
                        + "proposed_value AS proposedValue, note, status, answer_value AS answerValue, reply_text AS replyText, created_by_type AS createdByType, "
                        + "created_by_name AS createdByName, created_at AS createdAt, resolved_at AS resolvedAt FROM drive_change_request WHERE job_id = :j ORDER BY id DESC",
                new MapSqlParameterSource("j", jobId));
        for (Map<String, Object> r : rows) r.put("fieldLabel", label(r.get("field")));
        return rows;
    }

    public static String label(Object field) {
        return LABEL.getOrDefault(String.valueOf(field), "Other");
    }

    /** Open requests waiting on this side, for Today and the drive header. */
    public int openFor(Integer jobId, boolean forCompany) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM drive_change_request WHERE job_id = :j AND status = 'OPEN' AND direction = :d",
                new MapSqlParameterSource("j", jobId).addValue("d", forCompany ? TO_COMPANY : TO_COLLEGE), Integer.class);
        return n == null ? 0 : n;
    }

    @Transactional
    public Map<String, Object> create(Integer jobId, NewRequest in, Actor actor) {
        lockJob(jobId); // first: two creates at once take turns here, so the second sees the first
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Drive not found"));
        requireRunning(job, "changes can't be requested");
        if (in == null || in.field == null || !FIELDS.contains(in.field)) throw new IllegalArgumentException("Pick what should change");
        // OTHER has nothing to apply, so it is always a question: "accepting" it would settle it with nothing changed.
        String kind = "OTHER".equals(in.field) || "ASK".equals(in.kind) ? "ASK" : "PROPOSE";
        String proposed = trim(in.proposedValue, 2000);
        String note = trim(in.note, 1000);
        if ("OTHER".equals(in.field) && note == null) throw new IllegalArgumentException("Say what should change");
        if (!actor.isCollege() && job.getRecruiterId() == null) throw new IllegalArgumentException("Drive not found");
        String direction = actor.isCollege() ? TO_COMPANY : TO_COLLEGE;
        if (TO_COMPANY.equals(direction)) {
            if (job.getRecruiterId() == null) throw new IllegalStateException("No recruiter works on this drive yet; edit it directly");
            // They could never see it: same words as the Messages screen.
            if (!messages.recruiterCanSee(job.getCollegeId(), job.getRecruiterId())) {
                throw new IllegalStateException("This recruiter's access to your college has ended. Give access again in Settings > Recruiters to ask them.");
            }
        }
        if (("CTC_LPA".equals(in.field) || "STIPEND".equals(in.field)) && roles(job).size() > 1) throw new IllegalArgumentException(SEVERAL_ROLES);
        if ("PROPOSE".equals(kind)) {
            if (proposed == null) throw new IllegalArgumentException("Give the new value, or ask for it instead");
            proposed = normalize(in.field, proposed);
            validate(in.field, proposed);
            checkAgainstDrive(job, in.field, proposed);
            String current = currentValue(job, in.field);
            if (current != null && sameValue(in.field, current, proposed)) throw new IllegalArgumentException("That is already the drive's value");
        }
        if (!"OTHER".equals(in.field)) {
            Integer dup = jdbc.queryForObject("SELECT COUNT(*) FROM drive_change_request WHERE job_id = :j AND field = :f AND direction = :d AND status = 'OPEN'",
                    new MapSqlParameterSource("j", jobId).addValue("f", in.field).addValue("d", direction), Integer.class);
            if (dup != null && dup > 0) throw new IllegalStateException("There is already an open request on " + label(in.field) + ". Withdraw it or discuss it first");
        }
        String name = actor.name() != null ? actor.name() : facultyName(actor);
        jdbc.update("INSERT INTO drive_change_request (job_id, college_id, direction, field, kind, current_value, proposed_value, note, created_by_type, "
                        + "created_by_id, created_by_name) VALUES (:j, :c, :d, :f, :k, :cur, :p, :n, :t, :i, :nm)",
                new MapSqlParameterSource("j", jobId).addValue("c", job.getCollegeId()).addValue("d", direction).addValue("f", in.field)
                        .addValue("k", kind).addValue("cur", trim(currentValue(job, in.field), 2000)).addValue("p", "ASK".equals(kind) ? null : proposed)
                        .addValue("n", note).addValue("t", actor.type()).addValue("i", actor.id()).addValue("nm", trim(name, 200)));
        Long id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", new MapSqlParameterSource(), Long.class);
        if (TO_COMPANY.equals(direction)) {
            job.setChangesMadeAt(null);
            jobRepository.save(job);
        } else {
            audit.bell(job.getCollegeId(), "COMPANY_REQUEST", (job.getCompanyName() == null ? "The company" : job.getCompanyName()) + " suggested a change",
                    job.getJobTitle() + ": " + label(in.field), "/tpo/drives/" + jobId);
        }
        String words = "OTHER".equals(in.field) ? "Asked for a change"
                : "ASK".equals(kind) ? "Asked for the " + label(in.field).toLowerCase() : "Asked to change " + label(in.field);
        line(job, actor, "CREATED", id, words);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("open", openFor(jobId, TO_COMPANY.equals(direction)));
        out.put("id", id);
        return out;
    }

    /** Accept a proposed value: it is applied to the drive. Only the side the request was sent to. */
    @Transactional
    public void accept(Long requestId, Actor actor) {
        Map<String, Object> r = requireOpenFor(requestId, actor);
        if (!"PROPOSE".equals(r.get("kind")) || "OTHER".equals(r.get("field"))) throw new IllegalStateException("This one asks for a detail: answer it instead");
        Job job = lockedJob(r);
        requireRunning(job, "it can't be changed now");
        String field = String.valueOf(r.get("field"));
        String value = (String) r.get("proposed_value");
        // Still valid now? A deadline asked for last week may be in the past today.
        validate(field, value);
        checkAgainstDrive(job, field, value);
        apply(job, field, value);
        resolve(requestId, "ACCEPTED", null, null, actor);
        afterResolve(job, String.valueOf(r.get("direction")), actor);
        afterLiveChange(job, field);
        line(job, actor, "ACCEPTED", requestId, "Accepted the change to " + label(field));
    }

    /** Answer a question (or an OTHER request) with a value or words; a field value is applied to the drive. */
    @Transactional
    public void answer(Long requestId, String value, Actor actor) {
        Map<String, Object> r = requireOpenFor(requestId, actor);
        String v = trim(value, 2000);
        if (v == null) throw new IllegalArgumentException("Type the answer");
        Job job = lockedJob(r);
        requireRunning(job, "it can't be changed now");
        String field = String.valueOf(r.get("field"));
        if (!"OTHER".equals(field)) {
            v = normalize(field, v);
            validate(field, v);
            checkAgainstDrive(job, field, v);
            apply(job, field, v);
        }
        resolve(requestId, "ANSWERED", v, null, actor);
        afterResolve(job, String.valueOf(r.get("direction")), actor);
        afterLiveChange(job, field);
        line(job, actor, "ANSWERED", requestId, "Answered: " + label(field));
    }

    /**
     * Decline with a reason. Stored as REPLIED, the status the old one-shot reply used: those rows were refusals too. Talking a
     * request over happens in the drive's Discussion ("Discuss" on the request) and leaves it open.
     */
    @Transactional
    public void reply(Long requestId, String text, Actor actor) {
        Map<String, Object> r = requireOpenFor(requestId, actor);
        String t = trim(text, 1000);
        if (t == null) throw new IllegalArgumentException("Type a reason");
        Job job = lockedJob(r);
        requireRunning(job, "there is nothing left to decline");
        resolve(requestId, "REPLIED", null, t, actor);
        afterResolve(job, String.valueOf(r.get("direction")), actor);
        line(job, actor, "DECLINED", requestId, "Declined the change to " + label(r.get("field")));
    }

    /** The side that asked takes it back. Works on a drive that is over too, so the list can be tidied. */
    @Transactional
    public void withdraw(Long requestId, Actor actor) {
        Map<String, Object> r = lockedRow(requestId);
        if (!"OPEN".equals(r.get("status"))) throw new IllegalStateException("This request is already settled");
        boolean askedByCollege = TO_COMPANY.equals(r.get("direction"));
        if (askedByCollege != actor.isCollege()) throw new IllegalArgumentException("Not found");
        Job job = lockedJob(r);
        resolve(requestId, "WITHDRAWN", null, null, actor);
        afterResolve(job, String.valueOf(r.get("direction")), actor);
        line(job, actor, "WITHDRAWN", requestId, "Withdrew the request on " + label(r.get("field")));
    }

    public Integer jobOf(Long requestId) {
        return ((Number) row(requestId).get("job_id")).intValue();
    }

    // ---------------------------------------------------------------- internals

    private Map<String, Object> row(Long requestId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM drive_change_request WHERE id = :id", new MapSqlParameterSource("id", requestId));
        if (rows.isEmpty()) throw new IllegalArgumentException("Not found");
        return rows.get(0);
    }

    /** The request row, locked: the first statement of every settle, so two people settling it at once take turns. */
    private Map<String, Object> lockedRow(Long requestId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM drive_change_request WHERE id = :id FOR UPDATE", new MapSqlParameterSource("id", requestId));
        if (rows.isEmpty()) throw new IllegalArgumentException("Not found");
        return rows.get(0);
    }

    private void lockJob(Integer jobId) {
        jdbc.queryForList("SELECT id FROM job WHERE id = :j FOR UPDATE", new MapSqlParameterSource("j", jobId));
    }

    /** The drive, locked before it is read, so a direct edit in between waits instead of being overwritten by this save. */
    private Job lockedJob(Map<String, Object> r) {
        Integer jobId = ((Number) r.get("job_id")).intValue();
        lockJob(jobId);
        return jobRepository.findById(jobId).orElseThrow(() -> new IllegalArgumentException("Drive not found"));
    }

    private static void requireRunning(Job job, String what) {
        if (JobLifecycleStatus.INACTIVE.contains(job.getLifecycleStatus()) || JobLifecycleStatus.REJECTED.equals(job.getLifecycleStatus())) {
            throw new IllegalStateException("This drive is over; " + what);
        }
    }

    private Map<String, Object> requireOpenFor(Long requestId, Actor actor) {
        Map<String, Object> r = lockedRow(requestId);
        if (!"OPEN".equals(r.get("status"))) throw new IllegalStateException("This request is already settled");
        boolean sentToCompany = TO_COMPANY.equals(r.get("direction"));
        if (sentToCompany == actor.isCollege()) throw new IllegalArgumentException("Not found");
        return r;
    }

    private void resolve(Long requestId, String status, String answer, String reply, Actor actor) {
        int n = jdbc.update("UPDATE drive_change_request SET status = :s, answer_value = :a, reply_text = :r, resolved_by_type = :t, resolved_by_id = :i, resolved_at = :now "
                        + "WHERE id = :id AND status = 'OPEN'",
                new MapSqlParameterSource("s", status).addValue("a", answer).addValue("r", reply).addValue("t", actor.type()).addValue("i", actor.id())
                        .addValue("now", LocalDateTime.now()).addValue("id", requestId));
        if (n != 1) throw new IllegalStateException("This request is already settled");
    }

    /**
     * The company settled the last institutional request on a drive: "changes made", back to the top of the placement cell's queue.
     * Only when the company did it (the placement cell withdrawing its own last request is not the company's work), and the bell
     * says "answered", since the company may have declined some.
     */
    private void afterResolve(Job job, String direction, Actor actor) {
        if (TO_COMPANY.equals(direction) && !actor.isCollege() && openFor(job.getId(), true) == 0) {
            job.setChangesMadeAt(LocalDateTime.now());
            jobRepository.save(job);
            if (JobLifecycleStatus.REQUEST.equals(job.getLifecycleStatus())) {
                audit.bell(job.getCollegeId(), "DRIVE_CHANGES_MADE", (job.getCompanyName() == null ? "The company" : job.getCompanyName()) + " answered your change requests",
                        job.getJobTitle() + ": ready to review again", "/tpo/drives/" + job.getId());
            }
        } else {
            jobRepository.save(job);
        }
    }

    /**
     * A live drive whose terms just changed through a request: applicants still in it are told (as the drive form's "notify
     * applicants" does), and a rules change flags those it now leaves out (owner, 19 Oct 2026; REQUESTS-DISCUSSION-AUDIT open item).
     */
    private void afterLiveChange(Job job, String field) {
        if (!JobLifecycleStatus.PUBLISHED.equals(job.getLifecycleStatus()) || !LiveDriveChangeService.TERMS.contains(field)) return;
        liveDriveChange.tellApplicants(job, label(field));
        if (LiveDriveChangeService.RULES.contains(field)) liveDriveChange.recheckEligibility(job);
    }

    /** The request's line in the drive's company thread: never unread, never emailed. */
    private void line(Job job, Actor actor, String event, Long requestId, String words) {
        if (job.getRecruiterId() == null || requestId == null) return;
        messages.postEvent(job.getCollegeId(), job.getRecruiterId(), job.getId(), actor.isCollege() ? "TPO" : "RECRUITER",
                actor.id() == null ? 0 : actor.id(), event, requestId, words);
    }

    private String facultyName(Actor actor) {
        if (!actor.isCollege() || actor.id() == null) return null;
        List<String> n = jdbc.queryForList("SELECT TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) FROM faculty WHERE id = :f",
                new MapSqlParameterSource("f", actor.id()), String.class);
        return n.isEmpty() || n.get(0) == null || n.get(0).isBlank() ? null : n.get(0);
    }

    /** A value as it will be stored: job types in their usual spelling, branches without repeats, numbers without commas. */
    static String normalize(String field, String v) {
        return switch (field) {
            case "JOB_TYPE" -> {
                String t = JobTypes.normalize(v);
                yield t == null || t.isBlank() ? v : t;
            }
            case "BRANCHES" -> String.join(", ", new LinkedHashSet<>(Arrays.stream(v.split(",")).map(String::trim).filter(x -> !x.isEmpty()).toList()));
            case "CTC_LPA", "STIPEND", "MIN_CGPA" -> v.replace(",", "").trim();
            default -> v;
        };
    }

    private static boolean sameValue(String field, String current, String proposed) {
        if ("CTC_LPA".equals(field) || "STIPEND".equals(field) || "MIN_CGPA".equals(field)) {
            try { return new BigDecimal(current).compareTo(new BigDecimal(proposed)) == 0; } catch (NumberFormatException e) { return false; }
        }
        if ("DEADLINE".equals(field)) {
            try { return parseDeadline(current).equals(parseDeadline(proposed)); } catch (Exception e) { return false; }
        }
        return current.trim().equalsIgnoreCase(proposed.trim());
    }

    /** Rules that depend on the drive: one role only for pay, and a CTC can't drop below that role's fixed + variable (the drive form's rule). */
    private void checkAgainstDrive(Job job, String field, String v) {
        if (("CTC_LPA".equals(field) || "STIPEND".equals(field)) && roles(job).size() > 1) throw new IllegalArgumentException(SEVERAL_ROLES);
        if ("CTC_LPA".equals(field)) {
            JobRoleOption role = firstRole(job);
            if (role != null) {
                BigDecimal parts = (role.getFixedLpa() == null ? BigDecimal.ZERO : role.getFixedLpa()).add(role.getVariableLpa() == null ? BigDecimal.ZERO : role.getVariableLpa());
                if (parts.signum() > 0 && new BigDecimal(v).compareTo(parts) < 0) {
                    throw new IllegalArgumentException("CTC can't be less than fixed + variable (" + parts.stripTrailingZeros().toPlainString() + " LPA)");
                }
            }
        }
    }

    private static LocalDateTime parseDeadline(String v) {
        return LocalDateTime.parse(v.length() == 16 ? v + ":00" : v);
    }

    static void validate(String field, String v) {
        switch (field) {
            case "CTC_LPA", "STIPEND", "MIN_CGPA" -> {
                BigDecimal n;
                try { n = new BigDecimal(v.replace(",", "").trim()); } catch (NumberFormatException e) { throw new IllegalArgumentException("Enter a number"); }
                if (n.signum() < 0) throw new IllegalArgumentException("It can't be negative");
                if ("MIN_CGPA".equals(field) && n.compareTo(BigDecimal.TEN) > 0) throw new IllegalArgumentException("CGPA is out of 10");
                if ("CTC_LPA".equals(field) && n.compareTo(BigDecimal.valueOf(1000)) > 0) throw new IllegalArgumentException("CTC must be at most 1000 LPA");
            }
            case "MODE" -> {
                if (!List.of("ON_CAMPUS", "POOL", "OFF_CAMPUS").contains(v)) throw new IllegalArgumentException("Mode must be on campus, pool or off campus");
            }
            case "DEADLINE" -> {
                LocalDateTime d;
                try { d = parseDeadline(v); } catch (Exception e) { throw new IllegalArgumentException("Give the deadline as a date and time"); }
                // Both sides are UTC: the screen sends UTC and the server clock is UTC.
                if (d.isBefore(LocalDateTime.now())) throw new IllegalArgumentException("The deadline has to be in the future");
            }
            case "ROLE_TITLE" -> {
                if (v.length() < 3 || v.length() > 255) throw new IllegalArgumentException("The role needs 3 to 255 characters");
            }
            case "LOCATION" -> {
                if (v.length() > 255) throw new IllegalArgumentException("Keep the location under 255 characters");
            }
            case "JOB_TYPE" -> {
                if (v.length() > 100) throw new IllegalArgumentException("Keep the job type under 100 characters");
            }
            case "BRANCHES" -> {
                if (v.isBlank()) throw new IllegalArgumentException("Name at least one branch");
            }
            default -> { }
        }
    }

    private String currentValue(Job job, String field) {
        return switch (field) {
            case "ROLE_TITLE" -> job.getJobTitle();
            case "DESCRIPTION" -> job.getJobDescription();
            case "LOCATION" -> job.getLocation();
            case "JOB_TYPE" -> job.getJobType();
            case "MODE" -> job.getDriveMode();
            case "DEADLINE" -> job.getApplicationDeadline() == null ? null : job.getApplicationDeadline().toString();
            case "CTC_LPA" -> firstRole(job) == null || firstRole(job).getCtcLpa() == null ? null : firstRole(job).getCtcLpa().toPlainString();
            case "STIPEND" -> firstRole(job) == null || firstRole(job).getStipendPerMonth() == null ? null : firstRole(job).getStipendPerMonth().toPlainString();
            case "MIN_CGPA" -> eligibility(job).getMinCgpa() == null ? null : String.valueOf(eligibility(job).getMinCgpa());
            case "BRANCHES" -> eligibility(job).getBranches() == null ? null : String.join(", ", eligibility(job).getBranches());
            default -> null;
        };
    }

    private void apply(Job job, String field, String v) {
        switch (field) {
            case "ROLE_TITLE" -> job.setJobTitle(v);
            case "DESCRIPTION" -> job.setJobDescription(paragraphs(v)); // the drive keeps HTML; a request is plain text
            case "LOCATION" -> job.setLocation(v);
            case "JOB_TYPE" -> job.setJobType(v);
            case "MODE" -> job.setDriveMode(v);
            case "DEADLINE" -> job.setApplicationDeadline(parseDeadline(v));
            case "CTC_LPA", "STIPEND" -> {
                List<JobRoleOption> roles = roles(job);
                if (roles.isEmpty()) { JobRoleOption o = new JobRoleOption(); o.setName("Default"); roles.add(o); }
                BigDecimal n = new BigDecimal(v.replace(",", "").trim());
                if ("CTC_LPA".equals(field)) roles.get(0).setCtcLpa(n); else roles.get(0).setStipendPerMonth(n);
                job.setRoleOptionsJson(objectMapper.convertValue(roles, List.class));
            }
            case "MIN_CGPA", "BRANCHES" -> {
                JobEligibility e = eligibility(job);
                if ("MIN_CGPA".equals(field)) e.setMinCgpa(Double.valueOf(v.replace(",", "").trim()));
                else e.setBranches(new ArrayList<>(new LinkedHashSet<>(Arrays.stream(v.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList())));
                job.setEligibilityJson(objectMapper.convertValue(e, Map.class));
            }
            default -> { }
        }
    }

    /** Plain text as HTML paragraphs, escaped: a blank line starts a paragraph, a single line break stays a line break. */
    static String paragraphs(String text) {
        return Arrays.stream(text.trim().split("\\r?\\n\\s*\\r?\\n"))
                .map(p -> "<p>" + HtmlUtils.htmlEscape(p.trim()).replaceAll("\\r?\\n", "<br>") + "</p>")
                .collect(Collectors.joining());
    }

    private JobEligibility eligibility(Job job) {
        if (job.getEligibilityJson() == null) return new JobEligibility();
        return objectMapper.convertValue(job.getEligibilityJson(), JobEligibility.class);
    }

    private List<JobRoleOption> roles(Job job) {
        if (job.getRoleOptionsJson() == null) return new ArrayList<>();
        return new ArrayList<>(Arrays.asList(objectMapper.convertValue(job.getRoleOptionsJson(), JobRoleOption[].class)));
    }

    private JobRoleOption firstRole(Job job) {
        List<JobRoleOption> r = roles(job);
        return r.isEmpty() ? null : r.get(0);
    }

    private static String trim(String s, int max) {
        if (s == null) return null;
        String t = s.trim();
        if (t.isEmpty()) return null;
        return t.length() > max ? t.substring(0, max) : t;
    }

    /** For tests: the label shown for a field. */
    static Map<String, String> labels() {
        return new LinkedHashMap<>(LABEL);
    }
}
