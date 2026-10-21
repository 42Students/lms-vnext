package com._42students.lms.service.recruiter;

import com._42students.lms.model.College;
import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.service.tpo.TpoMessagesService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Placements UX pass: the recruiter portal's two biggest structural gaps were no cross-college
 * dashboard and no unified inbox (messaging only ever existed drive-by-drive, buried inside
 * each individual drive page - see the round-1 gap audit,
 * audits/lms-full-audit-2026/10-placements-v2-tpo-hr-student-findings.md). A recruiter working
 * 10 colleges had to open each one separately to find anything needing attention.
 *
 * <p>This composes existing per-college read models ({@link TpoMessagesService#threadsForRecruiter},
 * plain counts scoped the same way {@link com._42students.lms.controller.RecruiterDriveController}
 * already scopes a recruiter's own drives) across every college the recruiter has an active grant for,
 * rather than a second hand-written copy of any of that per-college logic. recruiter college counts are
 * naturally small (a recruiter juggling a handful of institutions, not thousands), so one query
 * per college per number is the right trade-off here over a single mega-join.
 */
@Service
@RequiredArgsConstructor
public class RecruiterDashboardService {

    private final RecruiterAccessService accessService;
    private final CollegeRepository collegeRepository;

    /** The one college logo (Branding, falling back to the college record). */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.CollegeLogoService collegeLogoService;
    private final TpoMessagesService messages;
    private final NamedParameterJdbcTemplate jdbc;

    private static long n(Object o) { return o == null ? 0 : ((Number) o).longValue(); }

    private Map<String, Object> collegeSummary(RecruiterCollegeAccess grant, College college, Integer recruiterId) {
        MapSqlParameterSource p = new MapSqlParameterSource("c", college.getId()).addValue("h", recruiterId);
        long applicationsThisWeek = n(jdbc.queryForObject(
                "SELECT COUNT(*) FROM job_application a JOIN job j ON j.id = a.job_id " +
                "WHERE j.college_id = :c AND j.recruiter_id = :h AND a.applied_at >= NOW() - INTERVAL 7 DAY " +
                "AND (a.is_deleted = 0 OR a.is_deleted IS NULL)", p, Long.class));
        long activeDrives = n(jdbc.queryForObject(
                "SELECT COUNT(*) FROM job WHERE college_id = :c AND recruiter_id = :h AND lifecycle_status = 'PUBLISHED' " +
                "AND (is_deleted = 0 OR is_deleted IS NULL)", p, Long.class));
        long interviewsUpcoming = n(jdbc.queryForObject(
                "SELECT COUNT(*) FROM round_slot s JOIN job_round r ON r.id = s.round_id JOIN job j ON j.id = r.job_id " +
                "WHERE j.college_id = :c AND j.recruiter_id = :h AND s.status = 'CONFIRMED' AND s.starts_at >= NOW()", p, Long.class));
        List<Map<String, Object>> threads = messages.threadsForRecruiter(college.getId(), recruiterId.longValue());
        long unread = threads.stream().mapToLong(t -> n(t.get("unread"))).sum();

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("collegeId", college.getId());
        row.put("collegeName", college.getName());
        row.put("logoUrl", com._42students.lms.service.CollegeLogoService.logoOf(collegeLogoService, college));
        row.put("applicationsThisWeek", applicationsThisWeek);
        row.put("activeDrives", activeDrives);
        row.put("interviewsUpcoming", interviewsUpcoming);
        row.put("unreadMessages", unread);
        row.put("membershipKey", RecruiterAuthService.membershipKey(recruiterId, college.getId()));
        row.put("threads", threads.stream().map(t -> withCollege(t, college)).toList());
        return row;
    }

    private Map<String, Object> withCollege(Map<String, Object> thread, College college) {
        Map<String, Object> out = new LinkedHashMap<>(thread);
        out.put("collegeId", college.getId());
        out.put("collegeName", college.getName());
        out.put("logoUrl", com._42students.lms.service.CollegeLogoService.logoOf(collegeLogoService, college));
        return out;
    }

    /** Grants for this one college only: a session never reaches past the college it was issued for. */
    private List<RecruiterCollegeAccess> grantsIn(Integer recruiterId, Integer collegeId) {
        return accessService.activeGrant(recruiterId, collegeId).map(List::of).orElse(List.of());
    }

    /** The Home summary for the session's college: counts, and the most recent message threads. */
    public Map<String, Object> home(Integer recruiterId, Integer collegeId) {
        List<Map<String, Object>> perCollege = new ArrayList<>();
        for (RecruiterCollegeAccess grant : grantsIn(recruiterId, collegeId)) {
            College college = collegeRepository.findById(grant.getCollegeId()).orElse(null);
            if (college == null) continue;
            perCollege.add(collegeSummary(grant, college, recruiterId));
        }

        long totalApplications = perCollege.stream().mapToLong(c -> n(c.get("applicationsThisWeek"))).sum();
        long totalDrives = perCollege.stream().mapToLong(c -> n(c.get("activeDrives"))).sum();
        long totalInterviews = perCollege.stream().mapToLong(c -> n(c.get("interviewsUpcoming"))).sum();
        long totalUnread = perCollege.stream().mapToLong(c -> n(c.get("unreadMessages"))).sum();

        List<Map<String, Object>> allThreads = new ArrayList<>();
        for (Map<String, Object> c : perCollege) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> threads = (List<Map<String, Object>>) c.get("threads");
            allThreads.addAll(threads);
        }
        allThreads.sort(Comparator.comparing((Map<String, Object> t) -> String.valueOf(t.get("lastMessageAt"))).reversed());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("colleges", perCollege.stream().map(c -> {
            Map<String, Object> copy = new LinkedHashMap<>(c);
            copy.remove("threads"); // full thread list belongs to the Messages page, not the Home summary
            return copy;
        }).toList());
        out.put("totals", Map.of(
                "colleges", perCollege.size(),
                "activeDrives", totalDrives,
                "applicationsThisWeek", totalApplications,
                "interviewsUpcoming", totalInterviews,
                "unreadMessages", totalUnread));
        out.put("recentThreads", allThreads.stream().limit(8).toList());
        return out;
    }

    /** The Messages inbox for the session's college, newest first. */
    public List<Map<String, Object>> allThreads(Integer recruiterId, Integer collegeId) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (RecruiterCollegeAccess grant : grantsIn(recruiterId, collegeId)) {
            College college = collegeRepository.findById(grant.getCollegeId()).orElse(null);
            if (college == null) continue;
            for (Map<String, Object> t : messages.threadsForRecruiter(college.getId(), recruiterId.longValue())) {
                out.add(withCollege(t, college));
            }
        }
        out.sort(Comparator.comparing((Map<String, Object> t) -> String.valueOf(t.get("lastMessageAt"))).reversed());
        return out;
    }
}
