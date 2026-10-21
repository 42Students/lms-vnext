package com._42students.lms.access;

import com._42students.lms.model.Batch;
import com._42students.lms.model.College;
import com._42students.lms.model.Course;
import com._42students.lms.model.Department;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.model.NewProgram;
import com._42students.lms.model._Class;
import com._42students.lms.repository.BatchRepository;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository._ClassRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Resolves entity IDs to the collegeId that owns the resource.
 * Used for scope checks: never trust client-provided college; always resolve from DB.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ScopeResolutionService {

    private final DepartmentRepository departmentRepository;
    private final NewProgramRepository newProgramRepository;
    private final _ClassRepository classRepository;
    private final BatchRepository batchRepository;
    private final LearnerRepository learnerRepository;
    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;
    private final CollegeRepository collegeRepository;

    /**
     * Resolve course to college via department. Returns null if course not found, soft-deleted, or dept has no college.
     */
    public Integer resolveCourseToCollegeId(Integer courseId) {
        if (courseId == null) return null;
        return courseRepository.findByIdAndNotDeleted(courseId)
                .map(Course::getDeptId)
                .map(this::resolveDepartmentToCollegeId)
                .orElse(null);
    }

    /**
     * Resolve department to college. Returns null if not found, soft-deleted, or inconsistent.
     */
    public Integer resolveDepartmentToCollegeId(Integer deptId) {
        if (deptId == null) return null;
        return departmentRepository.findByIdAndNotDeleted(deptId)
                .map(Department::getCollegeId)
                .orElse(null);
    }

    /**
     * Resolve program (NewProgram, id Integer) to college via dept. Excludes soft-deleted.
     */
    public Integer resolveProgramToCollegeId(Integer programId) {
        if (programId == null) return null;
        return newProgramRepository.findByIdAndNotDeleted(programId)
                .map(NewProgram::getDeptId)
                .map(this::resolveDepartmentToCollegeId)
                .orElse(null);
    }

    /**
     * Resolve program (NewProgram, id as Long e.g. from Batch) to college via dept. Excludes soft-deleted.
     */
    public Integer resolveProgramToCollegeId(Long programId) {
        if (programId == null) return null;
        return newProgramRepository.findByIdAndNotDeleted(programId.intValue())
                .map(NewProgram::getDeptId)
                .map(this::resolveDepartmentToCollegeId)
                .orElse(null);
    }

    /**
     * Resolve class to college: class -> program -> dept -> college. Excludes soft-deleted.
     */
    public Integer resolveClassToCollegeId(Integer classId) {
        if (classId == null) return null;
        return classRepository.findByIdAndNotDeleted(classId)
                .map(_Class::getProgramId)
                .map(this::resolveProgramToCollegeId)
                .orElse(null);
    }

    /** Resolve a class to its owning program, excluding soft-deleted classes. */
    public Integer resolveClassToProgramId(Integer classId) {
        if (classId == null) return null;
        return classRepository.findByIdAndNotDeleted(classId)
                .map(_Class::getProgramId)
                .orElse(null);
    }

    /**
     * Canonical current targeting predicate for course content. This intentionally answers a
     * different question from historical readability: an old class/content relationship may
     * remain readable after promotion even though this method returns false for new targeting.
     */
    public boolean isClassCurrentlyEligibleForCourse(Integer classId, Integer courseId) {
        if (classId == null || classId <= 0 || courseId == null || courseId <= 0) return false;
        return classRepository.isCurrentEligibleClassForCourse(classId, courseId);
    }

    /** Current targetable classes for a course, already tenant- and lifecycle-filtered in SQL. */
    public List<_Class> resolveCurrentEligibleClassesForCourse(Integer courseId) {
        if (courseId == null || courseId <= 0) return List.of();
        return classRepository.findCurrentEligibleClassesForCourse(courseId);
    }

    /**
     * Resolve batch to college: batch -> program (Long) -> dept -> college.
     */
    public Integer resolveBatchToCollegeId(Long batchId) {
        if (batchId == null) return null;
        return batchRepository.findById(batchId)
                .map(Batch::getProgramId)
                .map(this::resolveProgramToCollegeId)
                .orElse(null);
    }

    /**
     * Resolve learner to college. Falls back to class→program→dept→college if direct field is null.
     */
    public Integer resolveLearnerToCollegeId(Integer learnerId) {
        if (learnerId == null) return null;
        Optional<Learner> learnerOpt = learnerRepository.findByIdAndNotDeleted(learnerId);
        if (learnerOpt.isEmpty()) return null;
        Learner learner = learnerOpt.get();
        if (learner.getCollegeId() != null) return learner.getCollegeId();
        return resolveClassToCollegeId(learner.getClassId());
    }

    /**
     * Resolve learner to their class ID. Returns null if learner not found or soft-deleted.
     */
    public Integer resolveLearnerToClassId(Integer learnerId) {
        if (learnerId == null) return null;
        return learnerRepository.findByIdAndNotDeleted(learnerId)
                .map(Learner::getClassId)
                .orElse(null);
    }

    /**
     * Every class a learner belongs to: their own section first, then the GROUP_BACKED classes of
     * the live elective groups they are ACTIVE in. A learner with no electives gets a list of one,
     * which is why callers that switch from {@link #resolveLearnerToClassId} to this method behave
     * identically for everyone until an elective is allocated.
     */
    public List<Integer> resolveLearnerToClassIds(Integer learnerId) {
        if (learnerId == null) return List.of();
        Integer home = resolveLearnerToClassId(learnerId);
        List<Integer> ids = new java.util.ArrayList<>();
        if (home != null) ids.add(home);
        for (Integer backed : classRepository.findGroupBackedClassIdsForLearner(learnerId)) {
            if (backed != null && !ids.contains(backed)) ids.add(backed);
        }
        return ids;
    }

    /**
     * Resolve learner to their program ID. Excludes soft-deleted learner and class.
     */
    public Integer resolveLearnerToProgramId(Integer learnerId) {
        if (learnerId == null) return null;
        Optional<Learner> learnerOpt = learnerRepository.findByIdAndNotDeleted(learnerId);
        if (learnerOpt.isEmpty()) return null;
        Learner learner = learnerOpt.get();
        if (learner.getProgramId() != null) return learner.getProgramId();
        if (learner.getClassId() == null) return null;
        return classRepository.findByIdAndNotDeleted(learner.getClassId())
                .map(_Class::getProgramId)
                .orElse(null);
    }

    /**
     * Resolve college to organization. Returns null if college not found or has no org.
     */
    public Integer resolveCollegeToOrganizationId(Integer collegeId) {
        if (collegeId == null) return null;
        College college = collegeRepository.fetchCollege(collegeId);
        return college != null ? college.getOrgId() : null;
    }

    /**
     * Resolve faculty to college. Returns null if faculty not found or soft-deleted.
     */
    public Integer resolveFacultyToCollegeId(Integer facultyId) {
        if (facultyId == null) return null;
        return facultyRepository.findByIdAndNotDeleted(facultyId)
                .map(Faculty::getCollegeId)
                .orElse(null);
    }

    /**
     * Fully resolve a learner's position in the hierarchy. Returns a complete
     * {@link ResolvedLearnerScope} by walking class→program→dept→college→org for any null fields.
     * Safe: returns builder with null fields if learner not found.
     */
    public ResolvedLearnerScope resolveFullScope(Integer learnerId) {
        if (learnerId == null) {
            return ResolvedLearnerScope.builder().learnerId(learnerId).build();
        }

        Optional<Learner> learnerOpt = learnerRepository.findByIdAndNotDeleted(learnerId);
        if (learnerOpt.isEmpty()) {
            return ResolvedLearnerScope.builder().learnerId(learnerId).build();
        }
        return resolveFullScope(learnerOpt.get());
    }

    /**
     * Fully resolve from a Learner entity already in hand (avoids extra DB lookup).
     */
    public ResolvedLearnerScope resolveFullScope(Learner learner) {
        if (learner == null) {
            return ResolvedLearnerScope.builder().build();
        }

        Integer classId = learner.getClassId();
        Integer programId = learner.getProgramId();
        Integer collegeId = learner.getCollegeId();
        Integer organizationId = learner.getOrganizationId();
        Integer batchId = null;
        Integer departmentId = null;

        // Walk up from class when fields are missing
        if (classId != null) {
            Optional<_Class> clsOpt = classRepository.findByIdAndNotDeleted(classId);
            if (clsOpt.isPresent()) {
                _Class cls = clsOpt.get();
                batchId = cls.getBatchId();
                if (programId == null) {
                    programId = cls.getProgramId();
                }
            }
        }

        if (programId != null) {
            Optional<NewProgram> progOpt = newProgramRepository.findByIdAndNotDeleted(programId);
            if (progOpt.isPresent()) {
                NewProgram prog = progOpt.get();
                departmentId = prog.getDeptId();
                if (collegeId == null && departmentId != 0) {
                    Optional<Department> deptOpt = departmentRepository.findByIdAndNotDeleted(departmentId);
                    if (deptOpt.isPresent()) {
                        collegeId = deptOpt.get().getCollegeId();
                    }
                }
            }
        }

        if (organizationId == null && collegeId != null) {
            College college = collegeRepository.fetchCollege(collegeId);
            if (college != null) {
                organizationId = college.getOrgId();
            }
        }

        // Final fallback: use the existing hierarchy query
        if (organizationId == null) {
            organizationId = learnerRepository.findOrganizationIdByLearnerId(learner.getId()).orElse(null);
        }

        return ResolvedLearnerScope.builder()
                .learnerId(learner.getId())
                .organizationId(organizationId)
                .collegeId(collegeId)
                .programId(programId)
                .classId(classId)
                .batchId(batchId)
                .departmentId(departmentId)
                .build();
    }

    /**
     * Resolve hierarchy fields for a Learner entity and set them directly. Used by
     * create/update paths to ensure denormalized fields are always populated on save.
     * Mutates the learner in place; returns it for chaining.
     */
    public Learner enrichLearnerHierarchy(Learner learner) {
        if (learner == null) return null;
        ResolvedLearnerScope scope = resolveFullScope(learner);
        if (learner.getProgramId() == null && scope.getProgramId() != null) {
            learner.setProgramId(scope.getProgramId());
        }
        if (learner.getCollegeId() == null && scope.getCollegeId() != null) {
            learner.setCollegeId(scope.getCollegeId());
        }
        if (learner.getOrganizationId() == null && scope.getOrganizationId() != null) {
            learner.setOrganizationId(scope.getOrganizationId());
        }
        return learner;
    }
}

