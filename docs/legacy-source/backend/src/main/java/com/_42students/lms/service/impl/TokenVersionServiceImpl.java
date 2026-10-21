package com._42students.lms.service.impl;

import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.RecruiterRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.security.PrincipalType;
import com._42students.lms.service.TokenVersionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Increments JWT token version for learners and faculty so that all existing tokens are invalidated.
 * Call on password change, role/tenant change, or "revoke all sessions".
 */
@Slf4j
@Service
public class TokenVersionServiceImpl implements TokenVersionService {

    @Autowired
    private LearnerRepository learnerRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired(required = false)
    private RecruiterRepository recruiterRepository;

    @Override
    @Transactional
    public Integer incrementTokenVersionForLearner(int learnerId) {
        return learnerRepository.findById(learnerId)
            .map(learner -> {
                int next = (learner.getTokenVersion() != null ? learner.getTokenVersion() : 0) + 1;
                learner.setTokenVersion(next);
                learnerRepository.save(learner);
                log.info("Token version incremented for learner {} to {}", learnerId, next);
                return next;
            })
            .orElse(null);
    }

    @Override
    @Transactional
    public Integer incrementTokenVersionForFaculty(int facultyId) {
        return facultyRepository.findById(facultyId)
            .map(faculty -> {
                int next = (faculty.getTokenVersion() != null ? faculty.getTokenVersion() : 0) + 1;
                faculty.setTokenVersion(next);
                facultyRepository.save(faculty);
                log.info("Token version incremented for faculty {} to {}", facultyId, next);
                return next;
            })
            .orElse(null);
    }

    @Override
    @Transactional
    public Integer incrementTokenVersionForRecruiter(int recruiterId) {
        if (recruiterRepository == null) return null;
        return recruiterRepository.findById(recruiterId)
            .map(recruiter -> {
                int next = (recruiter.getTokenVersion() != null ? recruiter.getTokenVersion() : 0) + 1;
                recruiter.setTokenVersion(next);
                recruiterRepository.save(recruiter);
                log.info("Token version incremented for HR {} to {}", recruiterId, next);
                return next;
            })
            .orElse(null);
    }

    @Override
    @Transactional
    public Integer incrementTokenVersion(int userId, String userType) {
        PrincipalType type = PrincipalType.parse(userType).orElse(null);
        if (type == null) return null;
        switch (type) {
            case LEARNER:
                return incrementTokenVersionForLearner(userId);
            case FACULTY:
                return incrementTokenVersionForFaculty(userId);
            case RECRUITER:
                return incrementTokenVersionForRecruiter(userId);
            default:
                return null;
        }
    }
}

