package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.RecruiterLead;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * RecruiterLeads (TPO V1 - Locked.docx §3): the table with derived stages and chips, the recruiter lead page, the Companies list and
 * page, bulk actions and the import with preview. Stages are never typed except New / Contacted / Not now;
 * Invited, Joined, Drive planned and Recruited are worked out from facts here.
 */
@Service
@RequiredArgsConstructor
public class TpoRecruiterLeadsHubService {

    private static final Set<String> FREE_EMAIL = Set.of("gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "rediffmail.com", "icloud.com", "proton.me", "live.com");

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoRecruiterLeadService recruiterLeadService;
    private final TpoAuditService audit;

    /** "Counts as placed" (Settings > Placement rules), for the hired numbers. Optional so unit tests can build the service alone. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private PlacementRulesService placementRules;

    /** Drives that ran or are running (a request, a draft, a cancelled or declined drive is not a drive with the company). */
    static final Set<String> RAN = Set.of("PUBLISHED", "CLOSED");
    /** Drives still ahead: a recruiter lead with one of these (their own) is "Drive planned". */
    static final Set<String> PLANNED = Set.of("REQUEST", "DRAFT", "PUBLISHED");

    /**
     * One company, however it was typed: "Infosys", "Infosys Ltd", " infosys limited " and "Infosys Pvt. Ltd." are the same.
     * Case, spaces, punctuation and the legal suffix are ignored.
     */
    public static String companyKey(String name) {
        if (name == null) return "";
        String k = name.toLowerCase(Locale.ROOT).replace("&amp;", "&").replaceAll("[^a-z0-9& ]", " ").replaceAll("\\s+", " ").trim();
        String prev;
        do {
            prev = k;
            k = k.replaceAll("\\s+(pvt|private|ltd|limited|llp|inc|incorporated|corp|corporation|co|company|plc)$", "").trim();
        } while (!k.equals(prev));
        return k.isEmpty() ? name.trim().toLowerCase(Locale.ROOT) : k;
    }

    /** The college's drives and who was placed from each: what the recruiter lead and company numbers are worked out from. */
    private final class Facts {
        final List<Map<String, Object>> jobs;
        final Map<Integer, Set<Integer>> placedByJob = new HashMap<>();

        Facts(Integer collegeId) {
            MapSqlParameterSource c = new MapSqlParameterSource("c", collegeId);
            jobs = jdbc.queryForList("SELECT j.id, j.company_name AS companyName, j.recruiter_id AS recruiterId, j.lifecycle_status AS status, j.created_at AS createdAt " +
                    "FROM job j WHERE j.college_id = :c AND (j.is_deleted = 0 OR j.is_deleted IS NULL)", c);
            for (Map<String, Object> j : jobs) j.put("key", companyKey((String) j.get("companyName")));
            String placed = TpoWorkspaceService.placedOfferStatuses(placementRules == null ? null : placementRules.rulesFor(collegeId).getCountsAsPlacedAt());
            jdbc.query("SELECT DISTINCT a.job_id AS j, a.learner_id AS l FROM job_offer o JOIN job_application a ON a.id = o.application_id " +
                    "JOIN job j ON j.id = a.job_id WHERE j.college_id = :c AND o.status IN " + placed, c,
                    rs -> { placedByJob.computeIfAbsent(rs.getInt("j"), k -> new HashSet<>()).add(rs.getInt("l")); });
        }

        List<Map<String, Object>> ofCompany(String key) { return jobs.stream().filter(j -> key.equals(j.get("key"))).toList(); }

        long ran(List<Map<String, Object>> js) { return js.stream().filter(j -> RAN.contains(String.valueOf(j.get("status")))).count(); }

        long hired(List<Map<String, Object>> js) {
            Set<Integer> people = new HashSet<>();
            js.forEach(j -> people.addAll(placedByJob.getOrDefault(((Number) j.get("id")).intValue(), Set.of())));
            return people.size();
        }
    }

    public List<Map<String, Object>> table(Integer collegeId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT l.id, l.name, l.designation, l.company_name AS companyName, l.company_logo AS companyLogo, l.email_norm AS email, " +
                "  l.phone_norm AS phone, l.manual_stage AS manualStage, l.not_now_reason AS notNowReason, l.not_now_until AS notNowUntil, " +
                "  l.owner_faculty_id AS ownerId, CONCAT(COALESCE(f.first_name,''), ' ', COALESCE(f.last_name,'')) AS ownerName, l.source, " +
                "  l.recruiter_id AS recruiterId, l.invite_sent_at AS inviteSentAt, l.invite_clicked_at AS inviteClickedAt, " +
                "  l.invite_bounced_at AS inviteBouncedAt, l.unsubscribed_at AS unsubscribedAt, l.created_at AS createdAt, " +
                "  (SELECT a.type FROM recruiter_lead_activity a WHERE a.recruiter_lead_id = l.id ORDER BY a.created_at DESC, a.id DESC LIMIT 1) AS lastActivityType, " +
                "  (SELECT a.note FROM recruiter_lead_activity a WHERE a.recruiter_lead_id = l.id AND a.is_system = 0 ORDER BY a.created_at DESC, a.id DESC LIMIT 1) AS lastActivityNote, " +
                "  (SELECT a.created_at FROM recruiter_lead_activity a WHERE a.recruiter_lead_id = l.id ORDER BY a.created_at DESC, a.id DESC LIMIT 1) AS lastActivityAt, " +
                "  (SELECT fu.due_at FROM follow_up fu WHERE fu.recruiter_lead_id = l.id AND fu.done_at IS NULL ORDER BY fu.due_at LIMIT 1) AS nextFollowUp, " +
                "  (SELECT hca.verification FROM recruiter_college_access hca WHERE hca.recruiter_id = l.recruiter_id AND hca.college_id = l.college_id LIMIT 1) AS verification, " +
                "  (SELECT h.last_login_at FROM recruiter h WHERE h.id = l.recruiter_id) AS recruiterLastLoginAt " +
                "FROM recruiter_lead l LEFT JOIN faculty f ON f.id = l.owner_faculty_id WHERE l.college_id = :c ORDER BY l.created_at DESC",
                new MapSqlParameterSource("c", collegeId));
        LocalDateTime now = LocalDateTime.now();
        Facts facts = new Facts(collegeId);
        for (Map<String, Object> r : rows) {
            String manual = (String) r.get("manualStage");
            // The company's numbers (every drive that ran, every student placed): the same as the Companies tab and the company page.
            List<Map<String, Object>> company = facts.ofCompany(companyKey((String) r.get("companyName")));
            Object recruiter = r.get("recruiterId");
            List<Map<String, Object>> withRecruiter = recruiter == null ? List.of() : facts.jobs.stream().filter(j -> recruiter.equals(j.get("recruiterId"))).toList();
            Set<Object> seen = new HashSet<>();
            List<Map<String, Object>> companyJobs = new ArrayList<>();
            for (Map<String, Object> j : company) if (seen.add(j.get("id"))) companyJobs.add(j);
            for (Map<String, Object> j : withRecruiter) if (seen.add(j.get("id"))) companyJobs.add(j);
            r.put("drives", facts.ran(companyJobs));
            r.put("studentsHired", facts.hired(companyJobs));
            // The stage is this person's own relationship: drives through their recruiter account, or with their company since they
            // were added. A contact added today at a company hired from years ago is not "Recruited" on day one.
            LocalDateTime added = TpoTime.ldt(r.get("createdAt"));
            List<Map<String, Object>> own = companyJobs.stream().filter(j -> (recruiter != null && recruiter.equals(j.get("recruiterId")))
                    || (added != null && TpoTime.ldt(j.get("createdAt")) != null && !TpoTime.ldt(j.get("createdAt")).isBefore(added))).toList();
            boolean recruited = facts.hired(own) > 0;
            // A drive with their company that is open right now (requested, drafted or live) is a planned drive whenever it was made.
            boolean planned = companyJobs.stream().anyMatch(j -> PLANNED.contains(String.valueOf(j.get("status"))));
            boolean joined = r.get("recruiterId") != null;
            boolean invited = r.get("inviteSentAt") != null;
            String stage = "NOT_NOW".equals(manual) ? "NOT_NOW" : recruited ? "RECRUITED" : planned ? "DRIVE_PLANNED"
                    : joined ? "JOINED" : invited ? "INVITED" : "CONTACTED".equals(manual) ? "CONTACTED" : "NEW";
            r.put("stage", stage);
            r.put("inviteStatus", joined ? "JOINED" : r.get("inviteBouncedAt") != null ? "BOUNCED" : r.get("inviteClickedAt") != null ? "CLICKED" : invited ? "SENT" : "NOT_SENT");

            List<String> chips = new ArrayList<>();
            LocalDateTime next = TpoTime.ldt(r.get("nextFollowUp"));
            LocalDateTime last = TpoTime.ldt(r.get("lastActivityAt"));
            boolean closed = "NOT_NOW".equals(stage) || "RECRUITED".equals(stage);
            if (next != null && next.isBefore(now)) chips.add("OVERDUE");
            if (next == null && !closed) chips.add("NO_NEXT_STEP");
            // Nothing ever logged: quiet counts from when they were added.
            LocalDateTime since = last != null ? last : TpoTime.ldt(r.get("createdAt"));
            long quietDays = since == null ? -1 : java.time.Duration.between(since, now).toDays();
            if (!closed && quietDays >= 14) { chips.add("QUIET"); r.put("quietDays", quietDays); }
            if (r.get("inviteBouncedAt") != null) chips.add("BOUNCED");
            if (joined && r.get("verification") != null && !"VERIFIED_DOMAIN".equals(r.get("verification")) && !"TPO_APPROVED".equals(r.get("verification"))) chips.add("UNVERIFIED");
            r.put("chips", chips);
            // Never ship the token hash or raw invite state beyond what the page needs.
        }
        return rows;
    }

    private static long num(Object o) { return o == null ? 0 : ((Number) o).longValue(); }

    public Map<String, Object> detail(Integer collegeId, Long recruiterLeadId) {
        Map<String, Object> recruiterLead = table(collegeId).stream().filter(x -> recruiterLeadId.equals(((Number) x.get("id")).longValue())).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Not found"));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("recruiterLead", recruiterLead);
        out.put("timeline", jdbc.queryForList("SELECT id, type, outcome, note, is_system AS isSystem, created_by AS createdBy, created_at AS createdAt " +
                "FROM recruiter_lead_activity WHERE recruiter_lead_id = :id ORDER BY created_at DESC, id DESC LIMIT 200", new MapSqlParameterSource("id", recruiterLeadId)));
        out.put("followUps", jdbc.queryForList("SELECT id, due_at AS dueAt, note, done_at AS doneAt FROM follow_up WHERE recruiter_lead_id = :id " +
                "ORDER BY (done_at IS NOT NULL), due_at", new MapSqlParameterSource("id", recruiterLeadId)));
        out.put("drives", jdbc.queryForList(
                "SELECT j.id, j.job_title AS jobTitle, j.lifecycle_status AS status, j.season_id AS seasonId FROM job j " +
                "WHERE j.college_id = :c AND (j.is_deleted = 0 OR j.is_deleted IS NULL) AND ((:hr IS NOT NULL AND j.recruiter_id = :hr) OR LOWER(TRIM(j.company_name)) IN (:names)) " +
                "ORDER BY j.id DESC",
                new MapSqlParameterSource("c", collegeId).addValue("hr", recruiterLead.get("recruiterId"))
                        .addValue("names", spellings(collegeId, recruiterLead.get("companyName") == null ? "" : String.valueOf(recruiterLead.get("companyName"))))));
        return out;
    }

    // ---------------------------------------------------------------- bulk
    private void requireRecruiterLeads(Integer collegeId, Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) throw new IllegalArgumentException("Choose at least one recruiter");
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM recruiter_lead WHERE college_id = :c AND id IN (:ids)",
                new MapSqlParameterSource("c", collegeId).addValue("ids", new HashSet<>(ids)), Long.class);
        if (n == null || n != new HashSet<>(ids).size()) throw new IllegalArgumentException("Not found");
    }

    @Transactional
    public int assignOwner(Integer collegeId, List<Long> recruiterLeadIds, Integer ownerFacultyId, Integer actorId) {
        requireRecruiterLeads(collegeId, recruiterLeadIds);
        Long ok = jdbc.queryForObject("SELECT COUNT(*) FROM faculty WHERE id = :f AND college_id = :c",
                new MapSqlParameterSource("f", ownerFacultyId).addValue("c", collegeId), Long.class);
        if (ok == null || ok == 0) throw new IllegalArgumentException("Not found");
        int n = jdbc.update("UPDATE recruiter_lead SET owner_faculty_id = :o WHERE college_id = :c AND id IN (:ids)",
                new MapSqlParameterSource("o", ownerFacultyId).addValue("c", collegeId).addValue("ids", new HashSet<>(recruiterLeadIds)));
        audit.log(collegeId, "TPO", actorId, "RECRUITER_LEADS_OWNER_SET", "RECRUITER_LEAD", null, n + (n == 1 ? " recruiter" : " recruiters"));
        return n;
    }

    @Transactional
    public int setStage(Integer collegeId, List<Long> recruiterLeadIds, String stage, String reason, LocalDate revisit, Integer actorId) {
        requireRecruiterLeads(collegeId, recruiterLeadIds);
        if (!Set.of("NEW", "CONTACTED", "NOT_NOW").contains(stage)) throw new IllegalArgumentException("Only New, Contacted or Not now can be set by hand");
        if ("NOT_NOW".equals(stage) && (reason == null || reason.isBlank())) throw new IllegalArgumentException("Say why it is not now");
        int n = jdbc.update("UPDATE recruiter_lead SET manual_stage = :s, not_now_reason = :r, not_now_until = :u WHERE college_id = :c AND id IN (:ids)",
                new MapSqlParameterSource("s", stage).addValue("r", "NOT_NOW".equals(stage) ? reason.trim() : null)
                        .addValue("u", "NOT_NOW".equals(stage) ? revisit : null).addValue("c", collegeId).addValue("ids", new HashSet<>(recruiterLeadIds)));
        audit.log(collegeId, "TPO", actorId, "RECRUITER_LEADS_STAGE_SET", "RECRUITER_LEAD", null, n + (n == 1 ? " recruiter" : " recruiters") + " moved to " + stageWord(stage));
        return n;
    }

    /**
     * Undo of a bulk action: puts each recruiter lead's owner and hand-set stage back exactly as they were (the client sends the values it
     * showed before the action). rows: [{ id, ownerId, manualStage, notNowReason, notNowUntil }].
     */
    @Transactional
    public int restore(Integer collegeId, List<Map<String, Object>> rows, Integer actorId) {
        if (rows == null || rows.isEmpty()) throw new IllegalArgumentException("Nothing to undo");
        List<Long> ids = new ArrayList<>();
        for (Map<String, Object> r : rows) ids.add(((Number) Objects.requireNonNull(r.get("id"), "id")).longValue());
        requireRecruiterLeads(collegeId, ids);
        int n = 0;
        for (Map<String, Object> r : rows) {
            Integer owner = r.get("ownerId") == null ? null : ((Number) r.get("ownerId")).intValue();
            if (owner != null) {
                Long ok = jdbc.queryForObject("SELECT COUNT(*) FROM faculty WHERE id = :f AND college_id = :c",
                        new MapSqlParameterSource("f", owner).addValue("c", collegeId), Long.class);
                if (ok == null || ok == 0) throw new IllegalArgumentException("Not found");
            }
            String stage = r.get("manualStage") == null || r.get("manualStage").toString().isBlank() ? "NEW" : r.get("manualStage").toString(); // NEW is the column's own default
            if (!Set.of("NEW", "CONTACTED", "NOT_NOW").contains(stage)) throw new IllegalArgumentException("Only New, Contacted or Not now can be set by hand");
            String reason = "NOT_NOW".equals(stage) && r.get("notNowReason") != null ? r.get("notNowReason").toString() : null;
            LocalDate until = "NOT_NOW".equals(stage) && r.get("notNowUntil") != null && !r.get("notNowUntil").toString().isBlank()
                    ? LocalDate.parse(r.get("notNowUntil").toString().substring(0, 10)) : null;
            n += jdbc.update("UPDATE recruiter_lead SET owner_faculty_id = :o, manual_stage = :s, not_now_reason = :r, not_now_until = :u WHERE college_id = :c AND id = :id",
                    new MapSqlParameterSource("o", owner).addValue("s", stage).addValue("r", reason).addValue("u", until)
                            .addValue("c", collegeId).addValue("id", ((Number) r.get("id")).longValue()));
        }
        audit.log(collegeId, "TPO", actorId, "RECRUITER_LEADS_RESTORED", "RECRUITER_LEAD", null, n + " recruiters put back (undo)");
        return n;
    }

    // ---------------------------------------------------------------- import
    public Map<String, Object> importPreview(Integer collegeId, List<Map<String, Object>> rows) {
        List<Map<String, Object>> fresh = new ArrayList<>(), duplicates = new ArrayList<>(), toFix = new ArrayList<>();
        Set<String> inFile = new HashSet<>();
        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> row = rows.get(i);
            String name = s(row, "name"), email = s(row, "email"), phone = s(row, "phone"), company = s(row, "company");
            String contact = email != null ? email : phone;
            if (name == null || contact == null) { toFix.add(Map.of("row", i, "reason", name == null ? "Name is missing" : "Email or phone is missing", "data", row)); continue; }
            // The same checks as adding one by hand, so a row the preview calls new never fails the import.
            if (email != null && !TpoRecruiterLeadService.normalizeEmail(email).matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) { toFix.add(Map.of("row", i, "reason", "That email does not look right", "data", row)); continue; }
            if (email == null && (TpoRecruiterLeadService.normalizePhone(phone) == null || TpoRecruiterLeadService.normalizePhone(phone).length() < 8)) { toFix.add(Map.of("row", i, "reason", "That phone number does not look right", "data", row)); continue; }
            String key = email != null ? TpoRecruiterLeadService.normalizeEmail(email) : TpoRecruiterLeadService.normalizePhone(phone);
            if (key == null || !inFile.add(key)) { duplicates.add(Map.of("row", i, "reason", "Appears twice in this file", "data", row)); continue; }
            if (company == null && email != null) company = companyFromEmail(email);
            if (company == null) { toFix.add(Map.of("row", i, "reason", "Company is missing", "data", row)); continue; }
            // An optional "source" column: where the placement cell found them (a code or a label, any case).
            try { TpoRecruiterLeadService.pickedSource(s(row, "source")); } catch (IllegalArgumentException e) { toFix.add(Map.of("row", i, "reason", e.getMessage(), "data", row)); continue; }
            RecruiterLead existing = recruiterLeadService.findExisting(collegeId, contact);
            if (existing != null) duplicates.add(Map.of("row", i, "reason", "Already a recruiter", "recruiterLeadId", existing.getId(), "data", row));
            else fresh.add(Map.of("row", i, "name", name, "company", company, "contact", contact, "hasEmail", email != null));
        }
        return Map.of("new", fresh, "duplicates", duplicates, "toFix", toFix);
    }

    @Transactional
    public Map<String, Object> importCommit(Integer collegeId, List<Map<String, Object>> rows, Integer ownerId, Integer actorId) {
        // BE-0105: a chosen owner must be a faculty member of this college, the same rule as bulk "Assign owner".
        // (No owner given means the importer themselves.)
        if (ownerId != null && !ownerId.equals(actorId)) {
            Long ok = jdbc.queryForObject("SELECT COUNT(*) FROM faculty WHERE id = :f AND college_id = :c",
                    new MapSqlParameterSource("f", ownerId).addValue("c", collegeId), Long.class);
            if (ok == null || ok == 0) throw new IllegalArgumentException("Not found");
        }
        Map<String, Object> preview = importPreview(collegeId, rows);
        @SuppressWarnings("unchecked") List<Map<String, Object>> fresh = (List<Map<String, Object>>) preview.get("new");
        List<Long> ids = new ArrayList<>();
        int skipped = 0;
        for (Map<String, Object> f : fresh) {
            Map<String, Object> row = rows.get((Integer) f.get("row"));
            // BE-0103: added by someone else since the preview (or twice in this file): skipped, not added again.
            if (recruiterLeadService.contactTaken(collegeId, (String) f.get("contact"))) { skipped++; continue; }
            RecruiterLead recruiterLead = recruiterLeadService.addRecruiterLead(collegeId, (String) f.get("name"), (String) f.get("contact"), (String) f.get("company"), ownerId);
            String designation = s(row, "designation");
            String phone = s(row, "phone");
            String picked = TpoRecruiterLeadService.pickedSource(s(row, "source"));
            jdbc.update("UPDATE recruiter_lead SET designation = :d, source = :src, phone_norm = COALESCE(phone_norm, :p) WHERE id = :id",
                    new MapSqlParameterSource("d", designation).addValue("p", phone == null ? null : TpoRecruiterLeadService.normalizePhone(phone)).addValue("id", recruiterLead.getId())
                            .addValue("src", picked != null ? picked : TpoRecruiterLeadService.IMPORTED));
            ids.add(recruiterLead.getId());
        }
        audit.log(collegeId, "TPO", actorId, "RECRUITER_LEADS_IMPORTED", "RECRUITER_LEAD", null, ids.size() + " new recruiters");
        return Map.of("created", ids.size(), "recruiterLeadIds", ids, "skippedAlreadyThere", skipped);
    }

    private static String s(Map<String, Object> row, String k) {
        Object v = row.get(k);
        return v == null || String.valueOf(v).isBlank() ? null : String.valueOf(v).trim();
    }

    /** Company name guessed from a work email domain ("hr@infosys.com" -> "Infosys"); free-mail domains give nothing. */
    public static String companyFromEmail(String email) {
        if (email == null || !email.contains("@")) return null;
        String domain = email.substring(email.indexOf('@') + 1).trim().toLowerCase(Locale.ROOT);
        if (domain.isEmpty() || FREE_EMAIL.contains(domain)) return null;
        String base = domain.split("\\.")[0];
        return base.isEmpty() ? null : Character.toUpperCase(base.charAt(0)) + base.substring(1);
    }

    // ---------------------------------------------------------------- companies
    /** RecruiterLeads grouped by company, with people, drives and hires. */
    public List<Map<String, Object>> companies(Integer collegeId) {
        Facts facts = new Facts(collegeId);
        Map<String, Map<String, Object>> byCompany = new LinkedHashMap<>();
        java.util.function.BiFunction<String, String, Map<String, Object>> company = (key, name) -> byCompany.computeIfAbsent(key, k -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("key", k); m.put("name", name.trim()); m.put("logo", null); m.put("people", new ArrayList<Map<String, Object>>());
            m.put("names", new LinkedHashSet<String>());
            return m;
        });
        for (Map<String, Object> l : table(collegeId)) {
            String name = (String) l.get("companyName");
            if (name == null || name.isBlank()) continue;
            Map<String, Object> c = company.apply(companyKey(name), name);
            if (c.get("logo") == null) c.put("logo", l.get("companyLogo"));
            @SuppressWarnings("unchecked") List<Map<String, Object>> people = (List<Map<String, Object>>) c.get("people");
            people.add(Map.of("id", l.get("id"), "name", l.get("name"), "stage", l.get("stage")));
            ((Set<String>) c.get("names")).add(name.trim());
        }
        // Most drives are for companies that were never added as recruiter leads: they are companies too.
        for (Map<String, Object> j : facts.jobs) {
            String name = (String) j.get("companyName");
            if (name == null || name.isBlank()) continue;
            ((Set<String>) company.apply((String) j.get("key"), name).get("names")).add(name.trim());
        }
        Map<String, String> outreach = new java.util.HashMap<>();
        jdbc.query("SELECT company_key, status FROM tpo_company_outreach WHERE college_id = :c", new MapSqlParameterSource("c", collegeId),
                rs -> { outreach.put(rs.getString("company_key"), rs.getString("status")); });
        for (Map<String, Object> c : byCompany.values()) {
            List<Map<String, Object>> js = facts.ofCompany((String) c.get("key"));
            String saved = outreach.get((String) c.get("key"));
            @SuppressWarnings("unchecked") List<Map<String, Object>> who = (List<Map<String, Object>>) c.get("people");
            c.put("communication", saved != null ? saved : derivedCommunication(who, js.size()));
            c.put("communicationSet", saved != null);
            c.put("drives", facts.ran(js));
            c.put("studentsHired", facts.hired(js));
            // Typed more than one way ("Infosys", "Infosys Ltd"): shown so the TPO can tidy it, counted as one company.
            c.put("alsoTypedAs", ((Set<String>) c.get("names")).stream().filter(n -> !n.equals(c.get("name"))).toList());
            c.remove("names");
        }
        List<Map<String, Object>> out = new ArrayList<>(byCompany.values());
        out.sort(java.util.Comparator.comparing((Map<String, Object> m) -> String.valueOf(m.get("name")).toLowerCase(Locale.ROOT)));
        return out;
    }

    /** Communication status in Engage > Companies (recruiter phase 1, N11). */
    public static final List<String> COMMUNICATION = List.of("NOT_CONTACTED", "EMAILED", "REPLIED", "MEETING_SET", "NOT_INTERESTED");

    /** Until the placement cell sets it: what the recruiters and drives already say. */
    static String derivedCommunication(List<Map<String, Object>> people, int drives) {
        Set<String> stages = new HashSet<>();
        for (Map<String, Object> p : people) stages.add(String.valueOf(p.get("stage")));
        if (drives > 0 || stages.contains("JOINED") || stages.contains("DRIVE_PLANNED") || stages.contains("RECRUITED")) return "REPLIED";
        if (stages.contains("INVITED") || stages.contains("CONTACTED")) return "EMAILED";
        if (!stages.isEmpty() && stages.stream().allMatch("NOT_NOW"::equals)) return "NOT_INTERESTED";
        return "NOT_CONTACTED";
    }

    public Map<String, Object> setCommunication(Integer collegeId, String name, String status, Integer facultyId) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Company not found");
        if (!COMMUNICATION.contains(status)) throw new IllegalArgumentException("Pick a communication status");
        String key = companyKey(name);
        jdbc.update("INSERT INTO tpo_company_outreach (college_id, company_key, status, updated_by_faculty_id) VALUES (:c, :k, :s, :f) " +
                "ON DUPLICATE KEY UPDATE status = VALUES(status), updated_by_faculty_id = VALUES(updated_by_faculty_id)",
                new MapSqlParameterSource("c", collegeId).addValue("k", key).addValue("s", status).addValue("f", facultyId));
        return Map.of("key", key, "communication", status);
    }

    /** Every way this college typed the company (lowercased, trimmed), for the company page's queries. */
    private List<String> spellings(Integer collegeId, String name) {
        String key = companyKey(name);
        MapSqlParameterSource c = new MapSqlParameterSource("c", collegeId);
        Set<String> out = new LinkedHashSet<>();
        out.add(name.trim().toLowerCase(Locale.ROOT));
        for (String n : jdbc.queryForList("SELECT DISTINCT company_name FROM job WHERE college_id = :c AND company_name IS NOT NULL " +
                "UNION SELECT DISTINCT company_name FROM recruiter_lead WHERE college_id = :c AND company_name IS NOT NULL", c, String.class)) {
            if (key.equals(companyKey(n))) out.add(n.trim().toLowerCase(Locale.ROOT));
        }
        return new ArrayList<>(out);
    }

    /** The company page: people with stages, drives, hired per year, documents (share links) and the combined timeline. */
    public Map<String, Object> companyDetail(Integer collegeId, String name) {
        String n = name == null ? "" : name.trim();
        // Every way the college typed this company counts ("Infosys" and "Infosys Ltd" are one company page).
        List<String> names = spellings(collegeId, n);
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("n", n).addValue("names", names);
        String key = companyKey(n);
        List<Map<String, Object>> people = table(collegeId).stream().filter(l -> key.equals(companyKey((String) l.get("companyName")))).toList();
        Facts facts = new Facts(collegeId);
        List<Map<String, Object>> companyJobs = facts.ofCompany(key);
        // A company is real for this college if it has a contact OR a drive here (most drives are for companies never added as recruiter leads).
        if (people.isEmpty() && companyJobs.isEmpty()) throw new IllegalArgumentException("Not found");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("name", n);
        // The shared company behind this page (V202), for the join link and the trusted switch (recruiter phase 1, N5).
        List<Integer> companyIds = jdbc.queryForList("SELECT j.company_id FROM job j WHERE j.college_id = :c AND LOWER(TRIM(j.company_name)) IN (:names) " +
                "AND j.company_id IS NOT NULL UNION SELECT cc.company_id FROM college_company cc JOIN company co ON co.id = cc.company_id " +
                "WHERE cc.college_id = :c AND cc.is_deleted = 0 AND LOWER(TRIM(co.name)) IN (:names) LIMIT 1", p, Integer.class);
        out.put("companyId", companyIds.isEmpty() ? null : companyIds.get(0));
        out.put("people", people);
        out.put("drives", jdbc.queryForList("SELECT j.id, j.job_title AS jobTitle, j.lifecycle_status AS status, YEAR(j.created_at) AS year " +
                "FROM job j WHERE j.college_id = :c AND LOWER(TRIM(j.company_name)) IN (:names) " +
                "AND (j.is_deleted = 0 OR j.is_deleted IS NULL) ORDER BY j.id DESC", p));
        out.put("drivesRan", facts.ran(companyJobs));
        out.put("studentsHired", facts.hired(companyJobs));
        // Hiring history by year: students placed (the college's "counts as placed" rule), by the year of the drive.
        Map<String, Set<Integer>> perYear = new java.util.TreeMap<>();
        for (Map<String, Object> j : companyJobs) {
            LocalDateTime at = TpoTime.ldt(j.get("createdAt"));
            Set<Integer> placed = facts.placedByJob.getOrDefault(((Number) j.get("id")).intValue(), Set.of());
            if (at != null && !placed.isEmpty()) perYear.computeIfAbsent(String.valueOf(at.getYear()), y -> new HashSet<>()).addAll(placed);
        }
        List<Map<String, Object>> hired = new ArrayList<>();
        perYear.forEach((y, people2) -> hired.add(Map.of("year", y, "hired", (long) people2.size())));
        out.put("hiredPerYear", hired);
        out.put("timeline", jdbc.queryForList("SELECT a.id, a.type, a.outcome, a.note, a.is_system AS isSystem, a.created_at AS createdAt, l.name AS person " +
                "FROM recruiter_lead_activity a JOIN recruiter_lead l ON l.id = a.recruiter_lead_id WHERE l.college_id = :c AND LOWER(TRIM(l.company_name)) IN (:names) " +
                "ORDER BY a.created_at DESC LIMIT 200", p));
        out.put("documents", jdbc.queryForList("SELECT sl.id, sl.job_id AS jobId, sl.created_at AS createdAt, sl.expires_at AS expiresAt FROM tpo_share_link sl " +
                "JOIN job j ON j.id = sl.job_id WHERE sl.college_id = :c AND LOWER(TRIM(j.company_name)) IN (:names) ORDER BY sl.created_at DESC", p));
        out.put("savedShareColumns", java.util.List.of()); // industry_company.export_columns_json was never written; companies are shared now (V202)
        return out;
    }

    /**
     * "Company Memory" (Placements UX pass): when a TPO picks an existing company while creating a
     * new drive, surface its history at this college - past roles, CTC, how many were hired and
     * the last drive date - instead of making them dig through old drives to remember. Unlike
     * companyDetail() above, this never 404s on a company with no CRM recruiter lead contact: drives and
     * offers already on record are the only source of truth needed here.
     */
    public Map<String, Object> companyHistory(Integer collegeId, String name) {
        String n = name == null ? "" : name.trim();
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("names", spellings(collegeId, n));
        List<Map<String, Object>> drives = jdbc.queryForList(
                "SELECT j.job_title AS jobTitle, j.ctc_range AS ctcRange, j.created_at AS createdAt " +
                "FROM job j " +
                "WHERE j.college_id = :c AND LOWER(TRIM(j.company_name)) IN (:names) AND (j.is_deleted = 0 OR j.is_deleted IS NULL) " +
                "AND j.lifecycle_status IN ('PUBLISHED','CLOSED') ORDER BY j.created_at DESC", p);
        Facts facts = new Facts(collegeId);
        Integer hired = (int) facts.hired(facts.ofCompany(companyKey(n)));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("driveCount", drives.size());
        out.put("hired", hired == null ? 0 : hired);
        out.put("lastDriveAt", drives.isEmpty() ? null : drives.get(0).get("createdAt"));
        out.put("recentRoles", drives.stream().limit(5).toList());
        return out;
    }

    /** The audit line names the stage the way the board does, not its stored code. */
    static String stageWord(String stage) {
        if (stage == null) return "-";
        String w = stage.replace('_', ' ').toLowerCase(java.util.Locale.ROOT);
        return "\"" + Character.toUpperCase(w.charAt(0)) + w.substring(1) + "\"";
    }
}
