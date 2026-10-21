package com._42students.lms.service.tpo;

import com._42students.lms.repository.tpo.PlacementSeasonRepository;
import com._42students.lms.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.util.Collection;
import java.util.List;

/**
 * Tenant isolation for /api/v1/tpo/**. The route is open to every TPO and every college ADMIN, so
 * holding the role says nothing about WHICH college: every id taken from a URL or body must be
 * resolved to its college here and compared with the caller's. A resource that is missing, belongs
 * to another college, or has no owning college (legacy org-wide job) all fail with the same
 * "Not found", so the API is not an enumeration oracle.
 *
 * Lookups are scalar JPQL, not entity loads, so there is no lazy-loading dependency on a session.
 */
@Component
public class TpoAccessGuard {

    private static final String NOT_FOUND = "Not found";

    @PersistenceContext
    private EntityManager em;

    private Integer one(String jpql, String param, Object value) {
        List<Integer> rows = em.createQuery(jpql, Integer.class).setParameter(param, value).setMaxResults(1).getResultList();
        return rows.isEmpty() ? null : rows.get(0);
    }

    private static Integer callerCollege(UserPrincipal p) {
        if (p == null || p.getCollegeId() == null) throw new IllegalArgumentException(NOT_FOUND);
        return p.getCollegeId();
    }

    private static void mustMatch(UserPrincipal p, Integer resourceCollege) {
        if (resourceCollege == null || !resourceCollege.equals(callerCollege(p))) {
            throw new IllegalArgumentException(NOT_FOUND);
        }
    }

    public void requireJob(UserPrincipal p, Integer jobId) {
        mustMatch(p, one("select j.collegeId from Job j where j.id = :id and j.isDeleted = false", "id", jobId));
    }

    /**
     * Same tenant check as {@link #requireJob}, plus: a drive that belongs to a season other than the college's current one is
     * read only (TPO V1 - Locked.docx: "a past season shows a read-only banner"). A drive with no season (legacy, or created before
     * a season existed) is never blocked by this.
     */
    @Autowired
    private PlacementSeasonRepository seasonRepository;

    /** The old "past season is read only" rule, off since batches replaced seasons (docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md). */
    static final boolean SEASON_READ_ONLY = false;

    /**
     * Same tenant check as {@link #requireJob}, plus: a drive tied to a season other than the college's current one is read only
     * (TPO V1 - Locked.docx: "a past season shows a read-only banner"). Several seasons can be marked current at once
     * (TpoSeasonService never un-marks one), so "current" here is the same thing TpoSeasonService.current and the frontend's season
     * chip use: the most recently started one among those still marked current. A job with no season (legacy, or predates seasons) is
     * never blocked by this.
     */
    public void requireJobWritable(UserPrincipal p, Integer jobId) {
        requireJob(p, jobId);
        // There is no season in the product any more (batches replaced it): a drive is never read only because of its season row.
        if (!SEASON_READ_ONLY) return;
        List<Object[]> rows = em.createQuery("select j.seasonId, j.collegeId from Job j where j.id = :id", Object[].class)
                .setParameter("id", jobId).setMaxResults(1).getResultList();
        if (rows.isEmpty()) return;
        Object seasonId = rows.get(0)[0];
        Integer collegeId = (Integer) rows.get(0)[1];
        if (seasonId == null) return;
        Long currentId = seasonRepository.findFirstByCollegeIdAndIsCurrentTrueOrderByStartDateDesc(collegeId)
                .map(s -> s.getId()).orElse(null);
        if (currentId != null && !currentId.equals(seasonId)) {
            throw new IllegalStateException("This drive belongs to a past season and is read only.");
        }
    }

    public void requireApplication(UserPrincipal p, Integer applicationId) {
        mustMatch(p, one("select j.collegeId from JobApplication a join a.job j where a.id = :id", "id", applicationId));
    }

    public void requireApplicationWritable(UserPrincipal p, Integer applicationId) {
        requireApplication(p, applicationId);
        Integer jobId = one("select a.job.id from JobApplication a where a.id = :id", "id", applicationId);
        requireJobWritable(p, jobId);
    }

    /** Every application must exist, belong to this job, and the job to the caller's college. */
    public void requireApplicationsInJob(UserPrincipal p, Integer jobId, Collection<Integer> applicationIds) {
        requireJob(p, jobId);
        if (applicationIds == null || applicationIds.isEmpty()) return;
        Long matching = em.createQuery("select count(a) from JobApplication a where a.id in :ids and a.job.id = :jobId", Long.class)
                .setParameter("ids", applicationIds).setParameter("jobId", jobId).getSingleResult();
        if (matching != applicationIds.stream().distinct().count()) throw new IllegalArgumentException(NOT_FOUND);
    }

    public void requireRound(UserPrincipal p, Long roundId) {
        mustMatch(p, one("select j.collegeId from JobRound r, Job j where r.id = :id and j.id = r.jobId", "id", roundId));
    }

    public void requireRoundWritable(UserPrincipal p, Long roundId) {
        requireRound(p, roundId);
        Integer jobId = one("select r.jobId from JobRound r where r.id = :id", "id", roundId);
        requireJobWritable(p, jobId);
    }

    /** The application must belong to the same job as the round. */
    public void requireApplicationInRoundJob(UserPrincipal p, Long roundId, Integer applicationId) {
        requireRoundWritable(p, roundId);
        Long ok = em.createQuery("select count(a) from JobApplication a, JobRound r where r.id = :r and a.id = :a and a.job.id = r.jobId", Long.class)
                .setParameter("r", roundId).setParameter("a", applicationId).getSingleResult();
        if (ok == 0) throw new IllegalArgumentException(NOT_FOUND);
    }

    public void requireOffer(UserPrincipal p, Long offerId) {
        mustMatch(p, one("select j.collegeId from JobOffer o, JobApplication a, Job j where o.id = :id and a.id = o.applicationId and j.id = a.job.id", "id", offerId));
    }

    public void requireOfferWritable(UserPrincipal p, Long offerId) {
        requireOffer(p, offerId);
        Integer jobId = one("select a.job.id from JobOffer o, JobApplication a where o.id = :id and a.id = o.applicationId", "id", offerId);
        requireJobWritable(p, jobId);
    }

    public void requireRecruiterLead(UserPrincipal p, Long recruiterLeadId) {
        mustMatch(p, one("select l.collegeId from RecruiterLead l where l.id = :id", "id", recruiterLeadId));
    }

    public void requireFollowUp(UserPrincipal p, Long followUpId) {
        mustMatch(p, one("select l.collegeId from FollowUp f, RecruiterLead l where f.id = :id and l.id = f.recruiterLeadId", "id", followUpId));
    }

    public void requireLearner(UserPrincipal p, Integer learnerId) {
        mustMatch(p, one("select l.collegeId from learner l where l.id = :id", "id", learnerId));
    }

    public void requireRequest(UserPrincipal p, Long requestId) {
        mustMatch(p, one("select ln.collegeId from StudentRequest r, learner ln where r.id = :id and ln.id = r.learnerId", "id", requestId));
    }

    public void requireDebarment(UserPrincipal p, Long debarmentId) {
        mustMatch(p, one("select ln.collegeId from PlacementDebarment d, learner ln where d.id = :id and ln.id = d.learnerId", "id", debarmentId));
    }

    public void requireSeason(UserPrincipal p, Long seasonId) {
        mustMatch(p, one("select s.collegeId from PlacementSeason s where s.id = :id", "id", seasonId));
    }

    /** Learner-side: the application must be the caller's own. */
    public void requireOwnApplication(Integer learnerId, Integer applicationId) {
        Long own = em.createQuery("select count(a) from JobApplication a where a.id = :a and a.learner.id = :l", Long.class)
                .setParameter("a", applicationId).setParameter("l", learnerId).getSingleResult();
        if (own == 0) throw new IllegalArgumentException(NOT_FOUND);
    }

    /** Learner-side: a job in the learner's college, or a legacy org-wide job (no owning college). */
    public void requireJobVisibleToLearner(UserPrincipal learner, Integer jobId) {
        List<Integer> rows = em.createQuery("select coalesce(j.collegeId, -1) from Job j where j.id = :id and j.isDeleted = false", Integer.class)
                .setParameter("id", jobId).setMaxResults(1).getResultList();
        if (rows.isEmpty()) throw new IllegalArgumentException(NOT_FOUND);
        Integer college = rows.get(0);
        if (college != -1 && !college.equals(learner.getCollegeId())) throw new IllegalArgumentException(NOT_FOUND);
    }

    public Integer jobIdOfRound(Long roundId) {
        return one("select r.jobId from JobRound r where r.id = :id", "id", roundId);
    }

    /** For tables the entities do not model: {@code sql} must select the owning college id for :id. */
    public void requireNative(UserPrincipal p, String sql, Object id) {
        @SuppressWarnings("unchecked")
        List<Object> rows = em.createNativeQuery(sql).setParameter("id", id).setMaxResults(1).getResultList();
        Integer college = rows.isEmpty() || rows.get(0) == null ? null : ((Number) rows.get(0)).intValue();
        mustMatch(p, college);
    }
}
