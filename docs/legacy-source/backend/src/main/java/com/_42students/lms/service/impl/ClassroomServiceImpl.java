package com._42students.lms.service.impl;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.ClassroomMessageCreateDTO;
import com._42students.lms.model.ClassroomMessage;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.ClassroomMessageRepository;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ClassroomService;
import com._42students.lms.service.FacultyService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ClassroomServiceImpl implements ClassroomService {

    private final ClassroomMessageRepository classroomMessageRepository;
    private final AccessControlService accessControlService;
    private final SecurityContextUtil securityContextUtil;
    private final FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;
    private final LearnerService learnerService;
    private final FacultyService facultyService;

    public ClassroomServiceImpl(ClassroomMessageRepository classroomMessageRepository,
                                AccessControlService accessControlService,
                                SecurityContextUtil securityContextUtil,
                                FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository,
                                LearnerService learnerService,
                                FacultyService facultyService) {
        this.classroomMessageRepository = classroomMessageRepository;
        this.accessControlService = accessControlService;
        this.securityContextUtil = securityContextUtil;
        this.facultyTeachingAssignmentRepository = facultyTeachingAssignmentRepository;
        this.learnerService = learnerService;
        this.facultyService = facultyService;
    }

    @Override
    public List<ClassroomMessage> fetchMessages(Integer courseId, Integer classId) {
        // Reads need the same teaching assignment as post/pin (F-094): browse scope let any same-college faculty read.
        enforceFacultyTeachingScope(validateScope(courseId, classId), courseId, classId);
        return classroomMessageRepository.findAllActiveForCourseAndClass(courseId, classId);
    }

    @Override
    public List<ClassroomMessage> fetchMessagesChangedSince(Integer courseId, Integer classId, java.time.LocalDateTime since) {
        enforceFacultyTeachingScope(validateScope(courseId, classId), courseId, classId);
        return classroomMessageRepository.findChangedSince(courseId, classId, since).stream()
                .map(ClassroomServiceImpl::withoutDeletedContent)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * A deleted message travels only as "this id is gone", so the client can drop it. Its text and sender stayed in the
     * row, and a poll with an old "since" handed every removed message back to the whole class (release audit 2026-10-09).
     * A copy, so the managed row is never changed.
     */
    static ClassroomMessage withoutDeletedContent(ClassroomMessage m) {
        if (m == null || !Boolean.TRUE.equals(m.getIsDeleted())) return m;
        ClassroomMessage gone = new ClassroomMessage();
        gone.setId(m.getId());
        gone.setCourseId(m.getCourseId());
        gone.setClassId(m.getClassId());
        gone.setIsDeleted(true);
        gone.setCreatedAt(m.getCreatedAt());
        gone.setUpdatedAt(m.getUpdatedAt());
        gone.setPinned(false);
        return gone;
    }

    @Override
    public ClassroomMessage createMessage(ClassroomMessageCreateDTO dto) {
        Integer courseId = dto.getCourseId();
        Integer classId = dto.getClassId();
        UserPrincipal principal = validateScope(courseId, classId);
        // Posting is a mutation, not a browse — unlike read access (college-wide for faculty by
        // design elsewhere in this app), a faculty member must actually teach this course/class
        // to post into its chat as "Faculty".
        enforceFacultyTeachingScope(principal, courseId, classId);

        String text = dto.getMessageText() != null ? dto.getMessageText().trim() : "";
        if (text.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Message cannot be empty");
        }

        ClassroomMessage message = new ClassroomMessage();
        message.setCourseId(courseId);
        message.setClassId(classId);
        message.setMessageText(text);
        message.setSenderId(principal.getId());
        message.setSenderName(resolveSenderName(principal));
        message.setSenderRole(senderRoleOf(principal));
        message.setPinned(false);
        return classroomMessageRepository.save(message);
    }

    @Override
    public ClassroomMessage togglePin(Integer messageId) {
        ClassroomMessage existing = classroomMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Message not found"));
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            throw new ResponseStatusException(FORBIDDEN, "Authentication required");
        }
        if (!principal.isFaculty() && !"ADMIN".equalsIgnoreCase(principal.getUserType())) {
            throw new ResponseStatusException(FORBIDDEN, "Only faculty or admin can pin messages");
        }
        validateScope(existing.getCourseId(), existing.getClassId());
        // Same teaching-scope requirement as posting — pinning is moderation, not browsing.
        enforceFacultyTeachingScope(principal, existing.getCourseId(), existing.getClassId());
        existing.setPinned(!Boolean.TRUE.equals(existing.getPinned()));
        return classroomMessageRepository.save(existing);
    }

    @Override
    public void deleteMessage(Integer messageId) {
        ClassroomMessage existing = classroomMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Message not found"));
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            throw new ResponseStatusException(FORBIDDEN, "Authentication required");
        }
        // LRN-DISC-01: learner and faculty ids are separate number ranges, so the id alone let learner 21
        // "own" (and delete) faculty 21's message. The sender's role has to match too.
        boolean isOwnMessage = principal.getId() != null && principal.getId().equals(existing.getSenderId())
                && senderRoleOf(principal).equalsIgnoreCase(String.valueOf(existing.getSenderRole()));
        boolean isModerator = principal.isFaculty() || "ADMIN".equalsIgnoreCase(principal.getUserType());
        if (!isOwnMessage && !isModerator) {
            throw new ResponseStatusException(FORBIDDEN, "You can only delete your own messages");
        }
        validateScope(existing.getCourseId(), existing.getClassId());
        // A moderator removing someone else's message is the same class of mutation as pin/post —
        // requires an actual teaching assignment for this course/class, not just browse access.
        // Deleting your own message never needs this (you're already scoped by validateScope).
        if (isModerator && !isOwnMessage) {
            enforceFacultyTeachingScope(principal, existing.getCourseId(), existing.getClassId());
        }
        existing.setIsDeleted(true);
        classroomMessageRepository.save(existing);
    }

    private UserPrincipal validateScope(Integer courseId, Integer classId) {
        if (courseId == null || classId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "courseId and classId are required");
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            throw new ResponseStatusException(FORBIDDEN, "Authentication required");
        }
        accessControlService.requireAccessCourse(principal, courseId);
        accessControlService.requireAccessClass(principal, classId);
        return principal;
    }

    /**
     * Mutations (post/pin) require an actual active teaching assignment for this course+class,
     * not just college-wide browse access. Admins (pure ADMIN userType, or faculty with
     * facultyType=ADMIN) and non-faculty principals (learners — already scoped to their own class
     * by validateScope) are exempt.
     */
    private void enforceFacultyTeachingScope(UserPrincipal principal, Integer courseId, Integer classId) {
        if (principal == null || !principal.isFaculty()) return;
        boolean isAdminFaculty = principal.getFacultyType() != null
                && "ADMIN".equalsIgnoreCase(principal.getFacultyType());
        if (isAdminFaculty) return;

        Integer facultyId = principal.getId();
        if (facultyId == null || facultyId <= 0) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Valid faculty id is required");
        }
        if (facultyTeachingAssignmentRepository == null ||
                !facultyTeachingAssignmentRepository.existsByFacultyIdAndCourseIdAndClassIdAndIsActive(
                        facultyId, courseId, classId, true)) {
            throw new ResponseStatusException(FORBIDDEN, "Faculty is not assigned to this course/class");
        }
    }

    /** "Faculty" for staff, "Learner" otherwise; stored on each message and part of its identity. */
    static String senderRoleOf(UserPrincipal principal) {
        return principal.isFaculty() || "ADMIN".equalsIgnoreCase(principal.getUserType()) ? "Faculty" : "Learner";
    }

    private String resolveSenderName(UserPrincipal principal) {
        try {
            if (principal.isFaculty()) {
                Faculty faculty = facultyService.getFacultyDetails(String.valueOf(principal.getId()));
                String name = faculty != null ? joinName(faculty.getFirstName(), faculty.getLastName()) : null;
                if (name != null) return name;
            } else {
                Learner learner = learnerService.getLearnerDetails(String.valueOf(principal.getId()));
                String name = learner != null ? joinName(learner.getFirstName(), learner.getLastName()) : null;
                if (name != null) return name;
            }
        } catch (Exception ignored) {
            // fall through to default below — a name-lookup failure must never block posting
        }
        return "User";
    }

    private static String joinName(String firstName, String lastName) {
        String combined = ((firstName != null ? firstName.trim() : "") + " " + (lastName != null ? lastName.trim() : "")).trim();
        return combined.isEmpty() ? null : combined;
    }
}
