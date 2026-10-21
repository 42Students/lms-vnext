package com._42students.lms.service.tpo;

import com._42students.lms.model.College;
import com._42students.lms.model.Job;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * What a recruiter may see of a college before any student has applied (Recruiter V1 - Locked.docx §4): counts
 * and bands only, never a name, roll number or contact.
 *
 * Privacy rules applied here, not left to the caller:
 *  - every count is rounded to the nearest 5;
 *  - a branch or band with fewer than {@link #MIN_GROUP} students is left out of the breakdown (it
 *    still counts toward the total), so a group small enough to point at one person is never shown;
 *  - no cross-tabs (branch x CGPA) exist, so two views cannot be subtracted to isolate someone;
 *  - CGPA appears only as bands and only from VERIFIED academic records, never self-reported ones.
 */
@Service
@RequiredArgsConstructor
public class RecruiterCollegeOverviewService {

    static final int MIN_GROUP = 10;
    private static final String[] BAND_LABELS = {"Below 6", "6 to 7", "7 to 8", "8 to 9", "9 and above"};

    private final CollegeRepository collegeRepository;
    private final JobRepository jobRepository;
    private final NamedParameterJdbcTemplate jdbc;
    private final EligibilityService eligibilityService;

    @PersistenceContext
    private EntityManager em;

    static int roundToFive(long n) {
        return (int) (Math.round(n / 5.0) * 5);
    }

    public Map<String, Object> overview(Integer collegeId) {
        return overview(collegeId, null);
    }

    /**
     * With a recruiterId: adds the registered count (once a batch has been invited to register — before that it would
     * just be noise) and, if this recruiter has a drive at this college, the eligible count for its rules (recruiter V1 - Locked
     * .docx §4 "eligible count for your last job description") and how many past drives they have run here.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> overview(Integer collegeId, Integer recruiterId) {
        College college = collegeRepository.findById(collegeId).orElseThrow(() -> new IllegalArgumentException("Not found"));

        List<Object[]> byDepartment = em.createQuery(
                "select l.department, count(l) from learner l where l.collegeId = :c "
                        + "and (l.isDeleted = false or l.isDeleted is null) and l.suspendedAt is null group by l.department")
                .setParameter("c", collegeId).getResultList();
        long total = 0;
        List<Map<String, Object>> branches = new ArrayList<>();
        for (Object[] row : byDepartment) {
            long n = (Long) row[1];
            total += n;
            String name = row[0] == null || String.valueOf(row[0]).isBlank() ? null : String.valueOf(row[0]).trim();
            if (name != null && n >= MIN_GROUP) {
                Map<String, Object> b = new LinkedHashMap<>();
                b.put("branch", name);
                b.put("count", roundToFive(n));
                branches.add(b);
            }
        }
        branches.sort((a, b) -> ((Integer) b.get("count")).compareTo((Integer) a.get("count")));

        List<BigDecimal> cgpas = em.createQuery(
                "select ar.cgpa from LearnerAcademicRecord ar, learner l where l.id = ar.learnerId and l.collegeId = :c "
                        + "and ar.source = 'VERIFIED' and ar.cgpa is not null "
                        + "and (l.isDeleted = false or l.isDeleted is null) and l.suspendedAt is null")
                .setParameter("c", collegeId).getResultList();
        long[] bands = new long[BAND_LABELS.length];
        for (BigDecimal g : cgpas) {
            double v = g.doubleValue();
            bands[v < 6 ? 0 : v < 7 ? 1 : v < 8 ? 2 : v < 9 ? 3 : 4]++;
        }
        List<Map<String, Object>> cgpaBands = new ArrayList<>();
        if (cgpas.size() >= MIN_GROUP) {
            for (int i = 0; i < bands.length; i++) {
                if (bands[i] >= MIN_GROUP) {
                    Map<String, Object> b = new LinkedHashMap<>();
                    b.put("band", BAND_LABELS[i]);
                    b.put("count", roundToFive(bands[i]));
                    cgpaBands.add(b);
                }
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("collegeId", collegeId);
        out.put("collegeName", college.getName());
        out.put("studentsTotal", roundToFive(total));
        out.put("byBranch", branches);
        out.put("cgpaBands", cgpaBands);
        out.put("cgpaBasedOn", cgpas.size() >= MIN_GROUP ? "verified academic records" : null);
        out.put("asOf", LocalDateTime.now());

        if (recruiterId != null) {
            // Registration is per batch: the count is shown once any batch has been invited to register.
            Long invitedBatches = jdbc.queryForObject("SELECT COUNT(*) FROM placement_batch WHERE college_id = :c AND invited_at IS NOT NULL",
                    new MapSqlParameterSource("c", collegeId), Long.class);
            boolean registrationOpen = invitedBatches != null && invitedBatches > 0;
            if (registrationOpen) {
                Long registered = jdbc.queryForObject(
                        "SELECT COUNT(*) FROM learner l WHERE l.college_id = :c AND (l.is_deleted = 0 OR l.is_deleted IS NULL) AND l.suspended_at IS NULL AND (" +
                        "  COALESCE((SELECT pr.choice FROM placement_registration pr WHERE pr.learner_id = l.id ORDER BY pr.id DESC LIMIT 1), " +
                        "    " + RegistrationRule.APPLIED_EARLIER + "" +
                        "  ) = 'PLACEMENTS')",
                        new MapSqlParameterSource("c", collegeId), Long.class);
                out.put("registered", roundToFive(registered == null ? 0 : registered));
            }

            List<Job> ownJobs = jobRepository.findRecruiterRequests(recruiterId.longValue(), collegeId);
            out.put("pastDrives", (int) ownJobs.stream().filter(j -> "CLOSED".equals(j.getLifecycleStatus()) || "CANCELLED".equals(j.getLifecycleStatus())).count());
            Optional<Job> lastJob = ownJobs.stream().max(java.util.Comparator.comparing(Job::getCreatedAt, java.util.Comparator.nullsFirst(java.util.Comparator.naturalOrder())).thenComparing(Job::getId, java.util.Comparator.nullsFirst(java.util.Comparator.naturalOrder())));
            if (lastJob.isPresent()) { // no eligibility_json at all means "no rules set", which EligibilityService already treats as everyone eligible
                Job job = lastJob.get();
                List<Map<String, Object>> learners = jdbc.queryForList(
                        "SELECT id, department FROM learner WHERE college_id = :c AND (is_deleted = 0 OR is_deleted IS NULL) AND suspended_at IS NULL",
                        new MapSqlParameterSource("c", collegeId));
                Map<Integer, String> branchById = new java.util.LinkedHashMap<>();
                for (Map<String, Object> l : learners) branchById.put(((Number) l.get("id")).intValue(), (String) l.get("department"));
                long eligible = eligibilityService.evaluateAll(job, branchById).values().stream().filter(r -> r.eligible).count();
                if (eligible >= MIN_GROUP) {
                    out.put("eligibleForLastJob", roundToFive(eligible));
                    out.put("eligibleForLastJobTitle", job.getJobTitle());
                }
            }
        }
        return out;
    }
}
