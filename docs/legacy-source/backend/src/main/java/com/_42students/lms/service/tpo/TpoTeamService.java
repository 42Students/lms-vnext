package com._42students.lms.service.tpo;

import com._42students.lms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Who runs placements at a college (TPO V1 - Locked.docx §9 Team): the TPO admins. A TPO admin is faculty with the TPO
 * type, the college admin, or a faculty member the placement cell added on Settings -> Team.
 *
 * There are no other placement roles. Faculty coordinators (department-limited) and student coordinators (drive-day
 * attendance) were removed on 9 Oct 2026: they were never planned, and will be designed properly later. Old rows in
 * tpo_team_member with another role grant nothing; tpo_coordinator_assignment is no longer read (both tables are dropped
 * in a later migration once prod is confirmed empty).
 */
@Service
@RequiredArgsConstructor
public class TpoTeamService {

    public static final String TPO_ADMIN = "TPO_ADMIN";

    private final NamedParameterJdbcTemplate jdbc;
    private final TpoAuditService audit;

    private static boolean has(UserPrincipal p, String role) {
        org.springframework.security.core.Authentication a = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (a == null) return false;
        for (GrantedAuthority g : a.getAuthorities()) if (role.equals(g.getAuthority())) return true;
        return false;
    }

    /** TPO_ADMIN, or null for anyone without a placement role. */
    public String roleOf(UserPrincipal p) {
        if (p == null) return null;
        if (has(p, "ROLE_ADMIN") || has(p, "ROLE_TPO")) return TPO_ADMIN;
        if (has(p, "ROLE_FACULTY")) {
            Long n = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_team_member WHERE college_id = :c AND faculty_id = :f AND role = :r",
                    new MapSqlParameterSource("c", p.getCollegeId()).addValue("f", p.getId()).addValue("r", TPO_ADMIN), Long.class);
            return n != null && n > 0 ? TPO_ADMIN : null;
        }
        return null;
    }

    // ---------------------------------------------------------------- team management
    public List<Map<String, Object>> team(Integer collegeId) {
        return jdbc.queryForList("SELECT t.id, t.faculty_id AS facultyId, t.role, f.first_name AS firstName, f.last_name AS lastName, " +
                        "f.contact_mail AS email FROM tpo_team_member t JOIN faculty f ON f.id = t.faculty_id " +
                        "WHERE t.college_id = :c AND t.role = :r ORDER BY f.first_name",
                new MapSqlParameterSource("c", collegeId).addValue("r", TPO_ADMIN));
    }

    /** Existing faculty accounts the TPO can pick from (team members are never invented). */
    public List<Map<String, Object>> facultyDirectory(Integer collegeId, String q) {
        String like = "%" + (q == null ? "" : q.trim().toLowerCase()) + "%";
        return jdbc.queryForList("SELECT f.id AS facultyId, f.first_name AS firstName, f.last_name AS lastName, f.department, f.contact_mail AS email " +
                        "FROM faculty f WHERE f.college_id = :c AND (f.is_deleted = 0 OR f.is_deleted IS NULL) " +
                        "AND (LOWER(CONCAT(f.first_name, ' ', COALESCE(f.last_name,''))) LIKE :q OR LOWER(COALESCE(f.contact_mail,'')) LIKE :q) " +
                        "ORDER BY f.first_name LIMIT 30",
                new MapSqlParameterSource("c", collegeId).addValue("q", like));
    }

    /** Adds a faculty member as a TPO admin (the only team role). */
    @Transactional
    public void setMember(Integer collegeId, Integer facultyId, String role, Integer actorId) {
        if (role != null && !role.isBlank() && !TPO_ADMIN.equals(role)) throw new IllegalArgumentException("A team member is a TPO admin");
        Long exists = jdbc.queryForObject("SELECT COUNT(*) FROM faculty WHERE id = :f AND college_id = :c",
                new MapSqlParameterSource("f", facultyId).addValue("c", collegeId), Long.class);
        if (exists == null || exists == 0) throw new IllegalArgumentException("Not found");
        jdbc.update("INSERT INTO tpo_team_member (college_id, faculty_id, role) VALUES (:c, :f, :r) ON DUPLICATE KEY UPDATE role = VALUES(role)",
                new MapSqlParameterSource("c", collegeId).addValue("f", facultyId).addValue("r", TPO_ADMIN));
        audit.log(collegeId, "TPO", actorId, "TEAM_MEMBER_SET", "SETTINGS", facultyId.longValue(), TPO_ADMIN);
    }

    /** The college's TPO and college-admin accounts: always TPO admins (roleOf), so they are listed beside the team, and can take over. */
    public List<Map<String, Object>> collegeAccounts(Integer collegeId) {
        return jdbc.queryForList("SELECT f.id AS facultyId, f.first_name AS firstName, f.last_name AS lastName, f.contact_mail AS email, " +
                        "CASE WHEN f.faculty_type = 14 THEN 'TPO' ELSE 'COLLEGE_ADMIN' END AS kind FROM faculty f " + // faculty_type ordinals: 4 ADMIN, 14 TPO
                        "WHERE f.college_id = :c AND f.faculty_type IN (4, 14) AND (f.is_deleted = 0 OR f.is_deleted IS NULL) ORDER BY f.faculty_type DESC, f.first_name",
                new MapSqlParameterSource("c", collegeId));
    }

    /** Removing someone lists their open recruiter leads and drives so the TPO can reassign them (they are not silently orphaned). */
    public Map<String, Object> removalImpact(Integer collegeId, Integer facultyId) {
        Long recruiterLeads = jdbc.queryForObject("SELECT COUNT(*) FROM recruiter_lead WHERE college_id = :c AND owner_faculty_id = :f",
                new MapSqlParameterSource("c", collegeId).addValue("f", facultyId), Long.class);
        Long drives = jdbc.queryForObject("SELECT COUNT(*) FROM job WHERE college_id = :c AND owner_faculty_id = :f AND lifecycle_status IN ('DRAFT','PUBLISHED','REQUEST')",
                new MapSqlParameterSource("c", collegeId).addValue("f", facultyId), Long.class);
        // Team module V1: open asks on them move too, so nobody is left waiting on someone who has gone.
        Long asks = jdbc.queryForObject("SELECT COUNT(*) FROM tpo_team_ask WHERE college_id = :c AND assignee_faculty_id = :f AND done_at IS NULL AND cancelled_at IS NULL",
                new MapSqlParameterSource("c", collegeId).addValue("f", facultyId), Long.class);
        return Map.of("recruiterLeads", recruiterLeads == null ? 0 : recruiterLeads, "drives", drives == null ? 0 : drives, "asks", asks == null ? 0 : asks);
    }

    @Transactional
    public void removeMember(Integer collegeId, Integer facultyId, Integer reassignToFacultyId, Integer actorId) {
        if (facultyId.equals(actorId)) throw new IllegalStateException("You can't remove yourself. Ask another TPO admin.");
        if (reassignToFacultyId != null) {
            // Only someone who runs placements here can take them over: a TPO admin on the team, or the college's TPO / college admin.
            Long ok = jdbc.queryForObject("SELECT COUNT(*) FROM faculty f WHERE f.id = :to AND f.college_id = :c AND f.id <> :f AND " +
                    "(EXISTS (SELECT 1 FROM tpo_team_member t WHERE t.college_id = :c AND t.faculty_id = f.id AND t.role = :r) OR f.faculty_type IN (4, 14))", // faculty_type ordinals: 4 ADMIN, 14 TPO
                    new MapSqlParameterSource("to", reassignToFacultyId).addValue("c", collegeId).addValue("f", facultyId).addValue("r", TPO_ADMIN), Long.class);
            if (ok == null || ok == 0) throw new IllegalArgumentException("Choose someone from the placement team to take them over");
            jdbc.update("UPDATE recruiter_lead SET owner_faculty_id = :to WHERE college_id = :c AND owner_faculty_id = :f",
                    new MapSqlParameterSource("to", reassignToFacultyId).addValue("c", collegeId).addValue("f", facultyId));
            jdbc.update("UPDATE job SET owner_faculty_id = :to WHERE college_id = :c AND owner_faculty_id = :f",
                    new MapSqlParameterSource("to", reassignToFacultyId).addValue("c", collegeId).addValue("f", facultyId));
            jdbc.update("UPDATE tpo_team_ask SET assignee_faculty_id = :to WHERE college_id = :c AND assignee_faculty_id = :f AND done_at IS NULL AND cancelled_at IS NULL",
                    new MapSqlParameterSource("to", reassignToFacultyId).addValue("c", collegeId).addValue("f", facultyId));
        } else {
            Map<String, Object> impact = removalImpact(collegeId, facultyId);
            if (((Number) impact.get("recruiterLeads")).longValue() + ((Number) impact.get("drives")).longValue() + ((Number) impact.get("asks")).longValue() > 0) {
                throw new IllegalStateException("They still own recruiters or drives, or have open asks. Choose who takes them over.");
            }
        }
        // They can't read the team's conversations any more (private ones included); what they wrote stays, marked "left the team".
        jdbc.update("DELETE x FROM tpo_team_thread_member x JOIN tpo_team_thread t ON t.id = x.thread_id WHERE t.college_id = :c AND x.faculty_id = :f",
                new MapSqlParameterSource("c", collegeId).addValue("f", facultyId));
        jdbc.update("DELETE FROM tpo_team_away WHERE college_id = :c AND faculty_id = :f", new MapSqlParameterSource("c", collegeId).addValue("f", facultyId));
        jdbc.update("DELETE FROM tpo_team_member WHERE college_id = :c AND faculty_id = :f",
                new MapSqlParameterSource("c", collegeId).addValue("f", facultyId));
        audit.log(collegeId, "TPO", actorId, "TEAM_MEMBER_REMOVED", "SETTINGS", facultyId.longValue(), null);
    }
}
