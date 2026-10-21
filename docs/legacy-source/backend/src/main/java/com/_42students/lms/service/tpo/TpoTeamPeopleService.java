package com._42students.lms.service.tpo;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Team > People (Team module V1): who's doing what. One card per team member with the drives and companies they own, follow-ups
 * overdue, asks waiting on them and asks they're waiting on, and whether they're away; plus the work nobody owns and a way to assign
 * it. "Last active" is deliberately not shown (docs/tpo-team/TEAM-MODULE-DESIGN-2026-10-12.md, round 7).
 */
@Service
@RequiredArgsConstructor
public class TpoTeamPeopleService {

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoTeamService team;
    private final TpoTeamThreadService threads;
    private final TpoAuditService audit;

    /** Every team member (TPO admins and the college's TPO / college-admin accounts) with their numbers. */
    public Map<String, Object> people(Integer collegeId, int me) {
        Set<Integer> ids = threads.teamIds(collegeId);
        if (!ids.contains(me)) throw new IllegalArgumentException("Only the placement team can use Team");
        Map<Integer, String> kindOf = new LinkedHashMap<>();
        for (Map<String, Object> a : team.collegeAccounts(collegeId)) kindOf.put(((Number) a.get("facultyId")).intValue(), "TPO".equals(a.get("kind")) ? "TPO account" : "College admin account");
        for (Map<String, Object> m : team.team(collegeId)) kindOf.putIfAbsent(((Number) m.get("facultyId")).intValue(), "Team member");
        List<Map<String, Object>> people = new ArrayList<>();
        for (Integer id : ids) {
            MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId).addValue("f", id);
            Map<String, Object> row = new LinkedHashMap<>(jdbc.queryForMap(
                    "SELECT f.id AS facultyId, f.first_name AS firstName, f.last_name AS lastName, f.contact_mail AS email, " +
                    "(SELECT COUNT(*) FROM job j WHERE j.college_id = :c AND j.owner_faculty_id = f.id AND j.lifecycle_status = 'PUBLISHED' AND (j.is_deleted = 0 OR j.is_deleted IS NULL)) AS drivesLive, " +
                    "(SELECT COUNT(*) FROM job j WHERE j.college_id = :c AND j.owner_faculty_id = f.id AND j.lifecycle_status IN ('REQUEST','DRAFT') AND (j.is_deleted = 0 OR j.is_deleted IS NULL)) AS drivesReview, " +
                    "(SELECT COUNT(*) FROM follow_up fu JOIN recruiter_lead rl ON rl.id = fu.recruiter_lead_id WHERE rl.college_id = :c " +
                    "   AND COALESCE(fu.owner_faculty_id, rl.owner_faculty_id) = f.id AND fu.done_at IS NULL AND fu.due_at < NOW()) AS followUpsOverdue, " +
                    "(SELECT COUNT(*) FROM tpo_team_ask a WHERE a.college_id = :c AND a.assignee_faculty_id = f.id AND a.done_at IS NULL AND a.cancelled_at IS NULL) AS asksOn, " +
                    "(SELECT COUNT(*) FROM tpo_team_ask a WHERE a.college_id = :c AND a.assignee_faculty_id = f.id AND a.done_at IS NULL AND a.cancelled_at IS NULL " +
                    "   AND a.due_at IS NOT NULL AND a.due_at < UTC_TIMESTAMP()) AS asksOverdue, " +
                    "(SELECT COUNT(*) FROM tpo_team_ask a WHERE a.college_id = :c AND a.asked_by_faculty_id = f.id AND a.assignee_faculty_id <> f.id AND a.done_at IS NULL AND a.cancelled_at IS NULL) AS waitingOn, " +
                    "(SELECT DATE_FORMAT(w.away_until, '%Y-%m-%d') FROM tpo_team_away w WHERE w.college_id = :c AND w.faculty_id = f.id AND w.away_until >= CURDATE()) AS awayUntil " +
                    "FROM faculty f WHERE f.id = :f", p));
            row.put("kind", kindOf.getOrDefault(id, "Team member"));
            // Companies counted the way Engage groups them (companyKey): "Infosys" and "Infosys Ltd" are one.
            Set<String> owned = new LinkedHashSet<>();
            for (String nm : jdbc.queryForList("SELECT DISTINCT company_name FROM recruiter_lead WHERE college_id = :c AND owner_faculty_id = :f AND company_name IS NOT NULL AND TRIM(company_name) <> ''", p, String.class)) {
                owned.add(TpoRecruiterLeadsHubService.companyKey(nm));
            }
            row.put("companies", owned.size());
            row.put("me", id == me);
            // Their open asks, overdue first: the card's number opens this list. Only asks in conversations the viewer can read are listed
            // by text; a private one shows as "In a private conversation".
            List<Map<String, Object>> open = jdbc.queryForList("SELECT a.id, a.thread_id AS threadId, a.message_id AS messageId, m.body, a.due_at AS dueAt, " +
                    "(a.due_at IS NOT NULL AND a.due_at < UTC_TIMESTAMP()) AS overdue, t.title, " +
                    "(t.is_private = 0 OR EXISTS (SELECT 1 FROM tpo_team_thread_member x WHERE x.thread_id = t.id AND x.faculty_id = :me)) AS readable, " +
                    "TRIM(CONCAT(COALESCE(b.first_name, ''), ' ', COALESCE(b.last_name, ''))) AS askedByName FROM tpo_team_ask a JOIN tpo_team_message m ON m.id = a.message_id " +
                    "JOIN tpo_team_thread t ON t.id = a.thread_id LEFT JOIN faculty b ON b.id = a.asked_by_faculty_id " +
                    "WHERE a.college_id = :c AND a.assignee_faculty_id = :f AND a.done_at IS NULL AND a.cancelled_at IS NULL " +
                    "ORDER BY (a.due_at IS NOT NULL AND a.due_at < UTC_TIMESTAMP()) DESC, a.due_at IS NULL, a.due_at LIMIT 20", new MapSqlParameterSource("c", collegeId).addValue("f", id).addValue("me", me));
            for (Map<String, Object> o : open) {
                boolean readable = o.get("readable") instanceof Number n ? n.intValue() != 0 : Boolean.TRUE.equals(o.get("readable"));
                o.put("body", readable ? TpoTeamThreadService.preview(String.valueOf(o.get("body")), 100) : "In a private conversation");
                if (!readable) { o.put("title", null); o.put("threadId", null); o.put("messageId", null); }
                o.remove("readable");
            }
            row.put("openAsks", open);
            // What they asked others and are waiting on (the "Waiting on others" number opens this), private ones unnamed the same way.
            List<Map<String, Object>> waiting = jdbc.queryForList("SELECT a.id, a.thread_id AS threadId, a.message_id AS messageId, m.body, a.due_at AS dueAt, " +
                    "(a.due_at IS NOT NULL AND a.due_at < UTC_TIMESTAMP()) AS overdue, " +
                    "(t.is_private = 0 OR EXISTS (SELECT 1 FROM tpo_team_thread_member x WHERE x.thread_id = t.id AND x.faculty_id = :me)) AS readable, " +
                    "TRIM(CONCAT(COALESCE(w.first_name, ''), ' ', COALESCE(w.last_name, ''))) AS assigneeName FROM tpo_team_ask a JOIN tpo_team_message m ON m.id = a.message_id " +
                    "JOIN tpo_team_thread t ON t.id = a.thread_id LEFT JOIN faculty w ON w.id = a.assignee_faculty_id " +
                    "WHERE a.college_id = :c AND a.asked_by_faculty_id = :f AND a.assignee_faculty_id <> :f AND a.done_at IS NULL AND a.cancelled_at IS NULL " +
                    "ORDER BY (a.due_at IS NOT NULL AND a.due_at < UTC_TIMESTAMP()) DESC, a.due_at IS NULL, a.due_at LIMIT 20", new MapSqlParameterSource("c", collegeId).addValue("f", id).addValue("me", me));
            for (Map<String, Object> o : waiting) {
                boolean readable = o.get("readable") instanceof Number n ? n.intValue() != 0 : Boolean.TRUE.equals(o.get("readable"));
                o.put("body", readable ? TpoTeamThreadService.preview(String.valueOf(o.get("body")), 100) : "In a private conversation");
                if (!readable) { o.put("threadId", null); o.put("messageId", null); }
                o.remove("readable");
            }
            row.put("waitingAsks", waiting);
            people.add(row);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("people", people);
        out.put("unowned", unowned(collegeId));
        return out;
    }

    /** Live work with no owner: drives not over yet, and companies none of whose contacts has an owner. */
    public Map<String, Object> unowned(Integer collegeId) {
        MapSqlParameterSource p = new MapSqlParameterSource("c", collegeId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("drives", jdbc.queryForList("SELECT id, CONCAT(CASE WHEN company_name IS NULL OR company_name = '' THEN '' ELSE CONCAT(company_name, ' · ') END, job_title) AS label, " +
                "lifecycle_status AS status FROM job WHERE college_id = :c AND owner_faculty_id IS NULL AND lifecycle_status IN ('REQUEST','DRAFT','PUBLISHED') " +
                "AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY id DESC LIMIT 200", p));
        // Companies none of whose contacts has an owner, grouped the way Engage groups them (companyKey).
        Map<String, Map<String, Object>> byKey = new LinkedHashMap<>();
        Set<String> owned = new LinkedHashSet<>();
        for (Map<String, Object> r : jdbc.queryForList("SELECT TRIM(company_name) AS name, owner_faculty_id AS owner FROM recruiter_lead WHERE college_id = :c " +
                "AND company_name IS NOT NULL AND TRIM(company_name) <> '' ORDER BY company_name", p)) {
            String key = TpoRecruiterLeadsHubService.companyKey(String.valueOf(r.get("name")));
            if (r.get("owner") != null) owned.add(key);
            Map<String, Object> row = byKey.computeIfAbsent(key, k -> new LinkedHashMap<>(Map.of("key", k, "label", r.get("name"), "contacts", 0)));
            row.put("contacts", ((Number) row.get("contacts")).intValue() + 1);
        }
        List<Map<String, Object>> companies = new ArrayList<>();
        for (Map.Entry<String, Map<String, Object>> e : byKey.entrySet()) if (!owned.contains(e.getKey())) companies.add(e.getValue());
        out.put("companies", companies.size() > 500 ? companies.subList(0, 500) : companies);
        return out;
    }

    /** Give unowned drives and companies to a team member. Only what is still unowned changes (no taking work from someone). */
    @Transactional
    public Map<String, Object> assign(Integer collegeId, int me, List<Integer> driveIds, List<String> companyKeys, Integer to) {
        Set<Integer> ids = threads.teamIds(collegeId);
        if (!ids.contains(me)) throw new IllegalArgumentException("Only the placement team can use Team");
        if (to == null || !ids.contains(to)) throw new IllegalArgumentException("Choose someone from the placement team");
        int drives = 0;
        int companies = 0;
        if (driveIds != null && !driveIds.isEmpty()) {
            drives = jdbc.update("UPDATE job SET owner_faculty_id = :to WHERE college_id = :c AND id IN (:ids) AND owner_faculty_id IS NULL",
                    new MapSqlParameterSource("to", to).addValue("c", collegeId).addValue("ids", driveIds));
        }
        if (companyKeys != null && !companyKeys.isEmpty()) {
            Set<String> keys = new LinkedHashSet<>();
            for (String k : companyKeys) if (k != null && !k.isBlank()) keys.add(TpoRecruiterLeadsHubService.companyKey(k));
            List<Long> leads = new ArrayList<>();
            for (Map<String, Object> r : jdbc.queryForList("SELECT id, company_name AS name FROM recruiter_lead WHERE college_id = :c AND owner_faculty_id IS NULL AND company_name IS NOT NULL",
                    new MapSqlParameterSource("c", collegeId))) {
                if (keys.contains(TpoRecruiterLeadsHubService.companyKey(String.valueOf(r.get("name"))))) leads.add(((Number) r.get("id")).longValue());
            }
            if (!leads.isEmpty()) {
                companies = jdbc.update("UPDATE recruiter_lead SET owner_faculty_id = :to WHERE college_id = :c AND id IN (:ids) AND owner_faculty_id IS NULL",
                        new MapSqlParameterSource("to", to).addValue("c", collegeId).addValue("ids", leads));
            }
        }
        if (to != me && drives + companies > 0) {
            String what = (drives > 0 ? drives + (drives == 1 ? " drive" : " drives") : "") + (drives > 0 && companies > 0 ? " and " : "")
                    + (companies > 0 ? companies + (companies == 1 ? " company contact" : " company contacts") : "");
            audit.bellTo(collegeId, to, "TEAM_ASSIGNED", "You now own " + what, null, "/tpo/team?tab=people");
        }
        return Map.of("drives", drives, "companyContacts", companies);
    }

    /** Away until a date (a team member sets it for themselves or for a colleague); null = back now. */
    @Transactional
    public void setAway(Integer collegeId, int me, int facultyId, String until) {
        Set<Integer> ids = threads.teamIds(collegeId);
        if (!ids.contains(me) || !ids.contains(facultyId)) throw new IllegalArgumentException("Not found");
        if (until == null || until.isBlank()) {
            jdbc.update("DELETE FROM tpo_team_away WHERE college_id = :c AND faculty_id = :f", new MapSqlParameterSource("c", collegeId).addValue("f", facultyId));
            return;
        }
        LocalDate d;
        try { d = LocalDate.parse(until.trim().substring(0, Math.min(10, until.trim().length()))); } catch (Exception e) { throw new IllegalArgumentException("Give a date"); }
        if (d.isBefore(LocalDate.now())) throw new IllegalArgumentException("That date has passed");
        if (d.isAfter(LocalDate.now().plusYears(1))) throw new IllegalArgumentException("Pick a date within a year");
        jdbc.update("INSERT INTO tpo_team_away (college_id, faculty_id, away_until) VALUES (:c, :f, :d) ON DUPLICATE KEY UPDATE away_until = :d",
                new MapSqlParameterSource("c", collegeId).addValue("f", facultyId).addValue("d", d));
    }
}
