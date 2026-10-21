package com._42students.lms.service.recruiter;

import com._42students.lms.model.College;
import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.model.Recruiter;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.RecruiterCollegeAccessRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.security.UserPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * The single place that decides what a recruiter (industry) principal may reach. Every recruiter feature calls
 * {@link #requireCollege} before touching college data. Access is always read from the database,
 * never from the token: a revoked, expired or suspended grant takes effect on the next request.
 * See docs/recruiter-tpo/DESIGN.md.
 */
@Service
public class RecruiterAccessService {

    private final RecruiterRepository recruiterRepository;
    private final RecruiterCollegeAccessRepository accessRepository;
    private final CollegeRepository collegeRepository;

    public RecruiterAccessService(RecruiterRepository recruiterRepository,
                           RecruiterCollegeAccessRepository accessRepository,
                           CollegeRepository collegeRepository) {
        this.recruiterRepository = recruiterRepository;
        this.accessRepository = accessRepository;
        this.collegeRepository = collegeRepository;
    }

    /** The recruiter identity if it exists, is not deleted and is not suspended. */
    public Optional<Recruiter> findUsableRecruiter(Integer recruiterId) {
        if (recruiterId == null || recruiterId <= 0) return Optional.empty();
        return recruiterRepository.findActiveById(recruiterId).filter(Recruiter::isUsable);
    }

    /** Grants usable right now, for colleges that still exist, ordered by grant time. */
    public List<RecruiterCollegeAccess> activeGrants(Integer recruiterId) {
        if (recruiterId == null) return List.of();
        LocalDateTime now = LocalDateTime.now();
        return accessRepository.findAllForRecruiter(recruiterId).stream()
                .filter(grant -> grant.isActiveAt(now))
                .filter(grant -> collegeExists(grant.getCollegeId()))
                .collect(Collectors.toList());
    }

    public Optional<RecruiterCollegeAccess> activeGrant(Integer recruiterId, Integer collegeId) {
        if (recruiterId == null || collegeId == null) return Optional.empty();
        return accessRepository.findForRecruiterAndCollege(recruiterId, collegeId)
                .filter(grant -> grant.isActiveAt(LocalDateTime.now()))
                .filter(grant -> collegeExists(grant.getCollegeId()));
    }

    public boolean hasActiveGrant(Integer recruiterId, Integer collegeId) {
        return activeGrant(recruiterId, collegeId).isPresent();
    }

    /**
     * Require that this principal is a usable recruiter with an active grant for the college, holding the
     * capability (null = only membership is required). Throws AccessDeniedException otherwise.
     */
    public RecruiterCollegeAccess requireCollege(UserPrincipal principal, Integer collegeId, String capability) {
        if (principal == null || !principal.isRecruiter()) {
            throw new AccessDeniedException("Recruiter access required");
        }
        if (collegeId == null) {
            throw new AccessDeniedException("A college must be selected");
        }
        if (findUsableRecruiter(principal.getId()).isEmpty()) {
            throw new AccessDeniedException("Recruiter account is not active");
        }
        RecruiterCollegeAccess grant = activeGrant(principal.getId(), collegeId)
                .orElseThrow(() -> new AccessDeniedException("No access to this college"));
        if (capability != null && (grant.getCapabilities() == null || !grant.getCapabilities().contains(capability))) {
            throw new AccessDeniedException("Missing capability " + capability);
        }
        return grant;
    }

    /** Require the principal's currently selected college (college mode). */
    public RecruiterCollegeAccess requireSelectedCollege(UserPrincipal principal, String capability) {
        return requireCollege(principal, principal != null ? principal.getCollegeId() : null, capability);
    }

    private boolean collegeExists(Integer collegeId) {
        if (collegeId == null) return false;
        return collegeRepository.findById(collegeId)
                .map(College::getIsDeleted)
                .map(deleted -> !Boolean.TRUE.equals(deleted))
                .orElse(false);
    }

    /** Organization of a college, or null when unknown. */
    public Integer organizationOf(Integer collegeId) {
        if (collegeId == null) return null;
        return collegeRepository.findById(collegeId).map(College::getOrgId).orElse(null);
    }
}
