package com._42students.lms.service.electives;

import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.electives.ElectiveRequests.AllocateRequest;
import com._42students.lms.dto.electives.ElectiveRequests.OfferingRequest;
import com._42students.lms.dto.electives.ElectiveRequests.SlotRequest;
import com._42students.lms.dto.electives.ElectiveViews.AllocationResult;
import com._42students.lms.dto.electives.ElectiveViews.FacultyView;
import com._42students.lms.dto.electives.ElectiveViews.OfferingView;
import com._42students.lms.dto.electives.ElectiveViews.SlotView;
import com._42students.lms.dto.electives.ElectiveViews.UnallocatedRow;
import com._42students.lms.dto.groups.GroupMemberView;
import com._42students.lms.dto.groups.GroupUpsertRequest;
import com._42students.lms.model.Batch;
import com._42students.lms.model.Course;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.FacultyTeachingAssignment;
import com._42students.lms.model.Learner;
import com._42students.lms.model.NewProgram;
import com._42students.lms.model._Class;
import com._42students.lms.model.electives.ElectiveOffering;
import com._42students.lms.model.electives.ElectiveSlot;
import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.model.groups.LmsGroupMember;
import com._42students.lms.repository.BatchRepository;
import com._42students.lms.repository.ClassScheduleRepository;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.repository.electives.ElectiveOfferingRepository;
import com._42students.lms.repository.electives.ElectiveSlotRepository;
import com._42students.lms.repository.groups.LmsGroupRepository;
import com._42students.lms.service.groups.GroupActor;
import com._42students.lms.service.groups.GroupMembershipService;
import com._42students.lms.service.groups.GroupService;
import com._42students.lms.service.groups.GroupViewAssembler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Electives = slots (baskets) of offerings. An offering is a course + an lms_group (kind ELECTIVE)
 * + a GROUP_BACKED class. Allocation is done by the college (no student self-registration in this
 * version); enrolment is the group membership, so capacity, waitlist, locks and audit all come
 * from the kernel, and the slot rule comes from {@link ElectiveJoinPolicy}.
 */
@Service
public class ElectiveService {

    private static final Logger log = LoggerFactory.getLogger(ElectiveService.class);
    public static final String MODULE = "electives";

    private final ElectiveSlotRepository slotRepository;
    private final ElectiveOfferingRepository offeringRepository;
    private final GroupService groupService;
    private final GroupMembershipService membershipService;
    private final GroupViewAssembler viewAssembler;
    private final LmsGroupRepository groupRepository;
    private final _ClassRepository classRepository;
    private final CourseRepository courseRepository;
    private final NewProgramRepository programRepository;
    private final FacultyRepository facultyRepository;
    private final FacultyTeachingAssignmentRepository assignmentRepository;
    private final LearnerRepository learnerRepository;
    private final BatchRepository batchRepository;
    private final ClassScheduleRepository scheduleRepository;
    private final ScopeResolutionService scopeResolutionService;

    @PersistenceContext
    private EntityManager em;

    public ElectiveService(ElectiveSlotRepository slotRepository, ElectiveOfferingRepository offeringRepository,
                           GroupService groupService, GroupMembershipService membershipService, GroupViewAssembler viewAssembler,
                           LmsGroupRepository groupRepository, _ClassRepository classRepository, CourseRepository courseRepository,
                           NewProgramRepository programRepository, FacultyRepository facultyRepository,
                           FacultyTeachingAssignmentRepository assignmentRepository, LearnerRepository learnerRepository,
                           BatchRepository batchRepository, ClassScheduleRepository scheduleRepository,
                           ScopeResolutionService scopeResolutionService) {
        this.slotRepository = slotRepository;
        this.offeringRepository = offeringRepository;
        this.groupService = groupService;
        this.membershipService = membershipService;
        this.viewAssembler = viewAssembler;
        this.groupRepository = groupRepository;
        this.classRepository = classRepository;
        this.courseRepository = courseRepository;
        this.programRepository = programRepository;
        this.facultyRepository = facultyRepository;
        this.assignmentRepository = assignmentRepository;
        this.learnerRepository = learnerRepository;
        this.batchRepository = batchRepository;
        this.scheduleRepository = scheduleRepository;
        this.scopeResolutionService = scopeResolutionService;
    }

    // ------------------------------------------------------------------ lookups (tenant-checked)

    public ElectiveSlot requireSlot(Integer collegeId, Long slotId) {
        ElectiveSlot slot = slotId == null ? null : slotRepository.findByIdAndIsDeletedFalse(slotId).orElse(null);
        if (slot == null || !Objects.equals(slot.getCollegeId(), collegeId)) throw new IllegalArgumentException("Slot not found");
        return slot;
    }

    public ElectiveOffering requireOffering(Integer collegeId, Long offeringId) {
        ElectiveOffering offering = offeringId == null ? null : offeringRepository.findByIdAndIsDeletedFalse(offeringId).orElse(null);
        if (offering == null) throw new IllegalArgumentException("Offering not found");
        requireSlot(collegeId, offering.getSlotId());
        return offering;
    }

    // ------------------------------------------------------------------ slots

    public List<SlotView> listSlots(Integer collegeId, Integer programId, Integer semesterNumber, boolean includeArchived) {
        List<ElectiveSlot> slots = slotRepository.findByCollegeIdAndIsDeletedFalseOrderBySemesterNumberAscNameAsc(collegeId).stream()
                .filter(s -> programId == null || programId.equals(s.getProgramId()))
                .filter(s -> semesterNumber == null || semesterNumber.equals(s.getSemesterNumber()))
                .filter(s -> includeArchived || ElectiveSlot.STATUS_ACTIVE.equals(s.getStatus()))
                .collect(Collectors.toList());
        if (slots.isEmpty()) return List.of();
        Map<Long, List<ElectiveOffering>> offeringsBySlot = offeringRepository
                .findBySlotIdInAndIsDeletedFalse(slots.stream().map(ElectiveSlot::getId).collect(Collectors.toList()))
                .stream().collect(Collectors.groupingBy(ElectiveOffering::getSlotId));
        Map<Integer, String> programNames = new HashMap<>();
        List<SlotView> out = new ArrayList<>();
        for (ElectiveSlot slot : slots) {
            out.add(slotView(slot, offeringsBySlot.getOrDefault(slot.getId(), List.of()), programNames));
        }
        return out;
    }

    public SlotView slotDetail(ElectiveSlot slot) {
        return slotView(slot, offeringRepository.findBySlotIdAndIsDeletedFalseOrderByIdAsc(slot.getId()), new HashMap<>());
    }

    @Transactional
    public ElectiveSlot createSlot(Integer collegeId, SlotRequest r) {
        ElectiveSlot slot = new ElectiveSlot();
        slot.setCollegeId(collegeId);
        if (r.getProgramId() == null) throw new IllegalArgumentException("Program is required");
        Integer programCollege = scopeResolutionService.resolveProgramToCollegeId(r.getProgramId());
        NewProgram program = programRepository.findByIdAndNotDeleted(r.getProgramId()).orElse(null);
        if (programCollege == null || !programCollege.equals(collegeId) || program == null) {
            throw new IllegalArgumentException("Program not found");
        }
        validateSemesterForProgram(program, r.getSemesterNumber());
        slot.setProgramId(r.getProgramId());
        applySlotFields(slot, r);
        return slotRepository.save(slot);
    }

    @Transactional
    public ElectiveSlot updateSlot(ElectiveSlot slot, SlotRequest r) {
        if (ElectiveSlot.STATUS_ARCHIVED.equals(slot.getStatus())) throw new IllegalStateException("An archived slot cannot be edited");
        if (r.getProgramId() != null && !r.getProgramId().equals(slot.getProgramId())) {
            throw new IllegalArgumentException("Program cannot be changed once created");
        }
        NewProgram program = programRepository.findByIdAndNotDeleted(slot.getProgramId())
                .orElseThrow(() -> new IllegalStateException("Slot program no longer exists"));
        validateSemesterForProgram(program, r.getSemesterNumber());

        // Once a learner has ever been allocated or waitlisted, the academic identity of the
        // slot becomes history. Changing semester/year/credits/pick rules afterwards can make an
        // existing membership disappear from Courses or reinterpret an already-recorded elective.
        boolean hasHistory = hasAnyMembershipHistory(slot);
        if (hasHistory) {
            if (r.getSemesterNumber() != null && !r.getSemesterNumber().equals(slot.getSemesterNumber())) {
                throw new IllegalStateException("Semester cannot be changed after allocation history exists; create a new slot instead");
            }
            String requestedYear = normaliseAcademicYear(r.getAcademicYear());
            String requestedYearStart = academicYearStart(requestedYear);
            String currentYearStart = academicYearStart(slot.getAcademicYear());
            if (!Objects.equals(requestedYearStart, currentYearStart)) {
                throw new IllegalStateException("Academic year cannot be changed after allocation history exists; create a new slot instead");
            }
            Integer requestedCredits = r.getCredits() == null ? 3 : r.getCredits();
            Integer requestedMinPick = r.getMinPick() == null ? 1 : r.getMinPick();
            Integer requestedMaxPick = r.getMaxPick() == null ? Math.max(1, requestedMinPick) : r.getMaxPick();
            if (!Objects.equals(requestedCredits, slot.getCredits())
                    || !Objects.equals(requestedMinPick, slot.getMinPick())
                    || !Objects.equals(requestedMaxPick, slot.getMaxPick())) {
                throw new IllegalStateException(
                        "Credits and pick rules cannot be changed after allocation history exists; create a new slot instead");
            }
        }

        applySlotFields(slot, r);
        return slotRepository.save(slot);
    }

    private boolean hasAnyMembershipHistory(ElectiveSlot slot) {
        return hasAnyMembershipHistory(offeringRepository.findBySlotIdAndIsDeletedFalseOrderByIdAsc(slot.getId()));
    }

    private boolean hasAnyMembershipHistory(Collection<ElectiveOffering> offerings) {
        for (ElectiveOffering o : offerings) {
            if (!membershipService.members(o.getGroupId(), null).isEmpty()) return true;
        }
        return false;
    }

    /**
     * Archives the slot and every live offering as one transaction. A partial archive is worse
     * than a failed archive: it leaves some learners/faculty with access while the slot itself
     * claims to be closed. archiveOffering already tolerates an out-of-band archived/deleted
     * group, so any remaining exception is a real failure and must roll the whole operation back.
     */
    @Transactional
    public ElectiveSlot archiveSlot(ElectiveSlot slot) {
        for (ElectiveOffering offering : offeringRepository.findBySlotIdAndIsDeletedFalseOrderByIdAsc(slot.getId())) {
            if (!ElectiveOffering.STATUS_ACTIVE.equals(offering.getStatus())) continue;
            archiveOffering(offering);
        }
        slot.setStatus(ElectiveSlot.STATUS_ARCHIVED);
        return slotRepository.save(slot);
    }

    private static void applySlotFields(ElectiveSlot slot, SlotRequest r) {
        if (r.getSemesterNumber() == null || r.getSemesterNumber() < 1 || r.getSemesterNumber() > 12) {
            throw new IllegalArgumentException("Semester must be between 1 and 12");
        }
        String name = r.getName() == null ? "" : r.getName().trim();
        if (name.isEmpty()) throw new IllegalArgumentException("Name is required");
        if (name.length() > 150) throw new IllegalArgumentException("Name must be 150 characters or fewer");
        int credits = r.getCredits() == null ? 3 : r.getCredits();
        if (credits < 0 || credits > 30) throw new IllegalArgumentException("Credits must be between 0 and 30");
        int minPick = r.getMinPick() == null ? 1 : r.getMinPick();
        int maxPick = r.getMaxPick() == null ? Math.max(1, minPick) : r.getMaxPick();
        if (minPick < 0 || maxPick < 1 || minPick > maxPick) throw new IllegalArgumentException("Pick range is invalid");
        String year = normaliseAcademicYear(r.getAcademicYear());
        String description = r.getDescription() == null ? null : r.getDescription().trim();
        if (description != null && description.length() > 1000) throw new IllegalArgumentException("Description must be 1000 characters or fewer");
        slot.setSemesterNumber(r.getSemesterNumber());
        slot.setName(name);
        slot.setCredits(credits);
        slot.setMinPick(minPick);
        slot.setMaxPick(maxPick);
        slot.setAcademicYear(year == null || year.isEmpty() ? null : year);
        slot.setDescription(description == null || description.isEmpty() ? null : description);
    }

    private static String normaliseAcademicYear(String raw) {
        if (raw == null || raw.trim().isEmpty()) return null;
        String value = raw.trim();
        java.util.regex.Matcher bareForm = java.util.regex.Pattern.compile("^(\\d{4})$").matcher(value);
        java.util.regex.Matcher shortForm = java.util.regex.Pattern.compile("^(\\d{4})-(\\d{2})$").matcher(value);
        java.util.regex.Matcher longForm = java.util.regex.Pattern.compile("^(\\d{4})-(\\d{4})$").matcher(value);
        int start;
        int end;
        if (bareForm.matches()) {
            start = Integer.parseInt(bareForm.group(1));
            return start + "-" + String.format("%02d", (start + 1) % 100);
        }
        if (shortForm.matches()) {
            start = Integer.parseInt(shortForm.group(1));
            end = Integer.parseInt(shortForm.group(2));
            if (end != ((start + 1) % 100)) throw new IllegalArgumentException("Academic year must be consecutive, e.g. 2026-27");
            return start + "-" + String.format("%02d", end);
        }
        if (longForm.matches()) {
            start = Integer.parseInt(longForm.group(1));
            end = Integer.parseInt(longForm.group(2));
            if (end != start + 1) throw new IllegalArgumentException("Academic year must be consecutive, e.g. 2026-27");
            return start + "-" + String.format("%02d", end % 100);
        }
        throw new IllegalArgumentException("Academic year must use YYYY-YY format, e.g. 2026-27");
    }

    private static void validateSemesterForProgram(NewProgram program, Integer semesterNumber) {
        if (semesterNumber == null || semesterNumber < 1 || semesterNumber > 12) {
            throw new IllegalArgumentException("Semester must be between 1 and 12");
        }
        int durationYears = program == null ? 0 : program.getDurationYears();
        if (durationYears > 0 && semesterNumber > durationYears * 2) {
            throw new IllegalArgumentException(
                    "Semester " + semesterNumber + " is outside this program's " + (durationYears * 2) + "-semester duration");
        }
    }

    private static String academicYearStart(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.length() < 4) return null;
        String start = trimmed.substring(0, 4);
        return start.chars().allMatch(Character::isDigit) ? start : null;
    }

    // ------------------------------------------------------------------ offerings

    @Transactional
    public ElectiveOffering createOffering(ElectiveSlot slot, OfferingRequest r, GroupActor actor) {
        if (!ElectiveSlot.STATUS_ACTIVE.equals(slot.getStatus())) throw new IllegalStateException("Slot is archived");
        if (r.getCourseId() == null) throw new IllegalArgumentException("Course is required");
        Course course = courseRepository.findById(r.getCourseId())
                .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        Integer courseCollege = scopeResolutionService.resolveCourseToCollegeId(course.getId());
        if (courseCollege == null || !courseCollege.equals(slot.getCollegeId())) throw new IllegalArgumentException("Course not found");
        if (offeringRepository.existsBySlotIdAndCourseIdAndStatusAndIsDeletedFalse(slot.getId(), course.getId(), ElectiveOffering.STATUS_ACTIVE)) {
            throw new IllegalStateException("This course is already offered in the slot");
        }
        if (r.getCapacity() != null && r.getCapacity() < 1) throw new IllegalArgumentException("Capacity must be at least 1, or empty for unlimited");

        // 1. The group: enrolment, capacity, waitlist, locks, audit.
        GroupUpsertRequest g = new GroupUpsertRequest();
        g.setKind(ElectiveJoinPolicy.KIND);
        g.setName(slot.getName() + " — " + course.getCourseName());
        g.setDescription("Elective offering of " + course.getCourseName() + " in " + slot.getName());
        g.setCapacity(r.getCapacity());
        g.setSemesterNumber(slot.getSemesterNumber());
        g.setAcademicYear(slot.getAcademicYear());
        g.setConfigJson(Map.of("allowWaitlist", true, "allowSelfLeave", false, "electiveSlotId", slot.getId()));
        LmsGroup group = groupService.create(actor, slot.getCollegeId(), g);
        group = groupService.transition(group, LmsGroup.STATUS_ACTIVE);

        // 2. The class every content/timetable/attendance surface keys on. Its roster is the group.
        _Class backed = new _Class();
        backed.setName("[Elective] " + course.getCourseName() + " · " + slot.getName());
        backed.setDescription("Elective offering; roster comes from group " + group.getId());
        backed.setProgramId(slot.getProgramId());
        backed.setBatchId(null);
        backed.setUpperLimit(r.getCapacity() == null ? 0 : r.getCapacity());
        backed.setLowerLimit(0);
        backed.setClassType(_Class.TYPE_GROUP_BACKED);
        backed.setRosterGroupId(group.getId());
        backed.setIsDeleted(false);
        backed = classRepository.save(backed);

        // 3. The offering that ties them together.
        ElectiveOffering offering = new ElectiveOffering();
        offering.setSlotId(slot.getId());
        offering.setCourseId(course.getId());
        offering.setGroupId(group.getId());
        offering.setBackedClassId(backed.getId());
        offering.setCapacity(r.getCapacity());
        offering.setStatus(ElectiveOffering.STATUS_ACTIVE);
        return offeringRepository.save(offering);
    }

    @Transactional
    public ElectiveOffering updateOffering(ElectiveOffering offering, OfferingRequest r) {
        if (!ElectiveOffering.STATUS_ACTIVE.equals(offering.getStatus())) throw new IllegalStateException("Offering is archived");
        ElectiveSlot parent = slotRepository.findByIdAndIsDeletedFalse(offering.getSlotId())
                .orElseThrow(() -> new IllegalStateException("Elective slot not found"));
        if (!ElectiveSlot.STATUS_ACTIVE.equals(parent.getStatus())) throw new IllegalStateException("Elective slot is archived");
        if (r.getCapacity() != null && r.getCapacity() < 1) throw new IllegalArgumentException("Capacity must be at least 1, or empty for unlimited");
        LmsGroup group = groupService.get(offering.getGroupId());
        int active = group.getActiveCount() == null ? 0 : group.getActiveCount();
        if (r.getCapacity() != null && r.getCapacity() < active) {
            throw new IllegalStateException("Capacity cannot go below the current enrolled count (" + active + ")");
        }
        Integer previousCapacity = group.getCapacity();
        group.setCapacity(r.getCapacity());
        group = groupRepository.save(group);
        // This bypasses GroupService.update() (which has the same promotion logic) because
        // electives also has to keep the backed class's upperLimit in step; raising capacity
        // never promotes on its own (see GroupMembershipService#promoteWhileSeatsAvailable).
        if (GroupService.capacityIncreased(previousCapacity, group.getCapacity())) {
            membershipService.promoteWhileSeatsAvailable(group);
        }
        classRepository.findById(offering.getBackedClassId()).ifPresent(c -> {
            c.setUpperLimit(r.getCapacity() == null ? 0 : r.getCapacity());
            classRepository.save(c);
        });
        offering.setCapacity(r.getCapacity());
        return offeringRepository.save(offering);
    }

    /**
     * Stops the offering: no new enrolments, learners lose access, grades/attendance history
     * stays. Also releases its faculty (deactivates the backed class's teaching assignments) so
     * an archived elective stops appearing in "My Courses", the attendance picker and the class
     * schedule picker for faculty who taught it — those all read isActive=true indefinitely
     * otherwise, since nothing else ties a teaching assignment to the offering's lifecycle.
     */
    @Transactional
    public ElectiveOffering archiveOffering(ElectiveOffering offering) {
        // groupService.get() excludes soft-deleted rows: an admin can archive AND THEN soft-delete
        // an ELECTIVE-kind group from the generic Student Groups console (kernel groups aren't
        // hidden by kind), leaving this offering's group_id pointing at a row that "get" no longer
        // sees. Treat a missing group as already fully archived rather than throwing, so this one
        // desynced offering can't block archiveSlot()'s loop from finishing the rest of the slot.
        LmsGroup group = groupRepository.findById(offering.getGroupId()).orElse(null);
        if (group != null && !LmsGroup.STATUS_ARCHIVED.equals(group.getStatus())) {
            groupService.transition(group, LmsGroup.STATUS_ARCHIVED);
        }
        for (FacultyTeachingAssignment a : assignmentRepository.findByClassIdAndIsActive(offering.getBackedClassId(), true)) {
            a.setIsActive(false);
            assignmentRepository.save(a);
        }
        offering.setStatus(ElectiveOffering.STATUS_ARCHIVED);
        return offeringRepository.save(offering);
    }

    /**
     * Replaces the offering's teaching staff: first id PRIMARY, others CO_TEACHER, by position in
     * {@code facultyIds} every time this is called — including when the SET of faculty is
     * unchanged but the ORDER is (e.g. promoting a co-teacher to primary by moving them first).
     * The previous version only diffed membership and left an already-assigned faculty's role
     * untouched, so reordering silently did nothing.
     */
    @Transactional
    public List<FacultyView> setFaculty(ElectiveSlot slot, ElectiveOffering offering, List<Integer> facultyIds) {
        if (!ElectiveSlot.STATUS_ACTIVE.equals(slot.getStatus())) throw new IllegalStateException("Elective slot is archived");
        if (!ElectiveOffering.STATUS_ACTIVE.equals(offering.getStatus())) throw new IllegalStateException("Offering is archived");
        List<Integer> ordered = new ArrayList<>();
        if (facultyIds != null) {
            for (Integer id : facultyIds) {
                if (id != null && !ordered.contains(id)) ordered.add(id);
            }
        }
        for (Integer facultyId : ordered) {
            Integer facultyCollege = scopeResolutionService.resolveFacultyToCollegeId(facultyId);
            Faculty faculty = facultyRepository.findByIdAndNotDeleted(facultyId).orElse(null);
            if (facultyCollege == null || !facultyCollege.equals(slot.getCollegeId())
                    || faculty == null || faculty.getSuspendedAt() != null) {
                throw new IllegalArgumentException("Faculty not found or unavailable");
            }
        }
        Set<Integer> wanted = new LinkedHashSet<>(ordered);
        Map<Integer, FacultyTeachingAssignment> existingByFaculty = new HashMap<>();
        for (FacultyTeachingAssignment existing : assignmentRepository.findByClassIdAndIsActive(offering.getBackedClassId(), true)) {
            if (!wanted.contains(existing.getFacultyId()) || !Objects.equals(existing.getCourseId(), offering.getCourseId())) {
                existing.setIsActive(false);
                assignmentRepository.save(existing);
            } else {
                existingByFaculty.put(existing.getFacultyId(), existing);
            }
        }
        for (int i = 0; i < ordered.size(); i++) {
            Integer facultyId = ordered.get(i);
            FacultyTeachingAssignment.TeachingRole role = i == 0
                    ? FacultyTeachingAssignment.TeachingRole.PRIMARY : FacultyTeachingAssignment.TeachingRole.CO_TEACHER;
            FacultyTeachingAssignment existing = existingByFaculty.get(facultyId);
            if (existing != null) {
                if (existing.getRole() != role) {
                    existing.setRole(role);
                    assignmentRepository.save(existing);
                }
            } else {
                FacultyTeachingAssignment a = new FacultyTeachingAssignment(facultyId, offering.getCourseId(),
                        offering.getBackedClassId(), slot.getSemesterNumber(), slot.getAcademicYear());
                a.setBatchId(null);
                a.setRole(role);
                assignmentRepository.save(a);
            }
        }
        return facultyViews(offering);
    }

    // ------------------------------------------------------------------ allocation

    /**
     * Deliberately NOT @Transactional: each learner's join runs in membershipService.add's own
     * transaction so one refusal (slot rule, full, other college) is reported for that learner and
     * the rest still commit. Wrapping the loop in one transaction would mark it rollback-only on the
     * first caught exception and fail the whole batch at commit.
     */
    public AllocationResult allocate(ElectiveSlot slot, ElectiveOffering offering, AllocateRequest r, GroupActor actor) {
        if (!ElectiveSlot.STATUS_ACTIVE.equals(slot.getStatus())) throw new IllegalStateException("Elective slot is archived");
        if (!ElectiveOffering.STATUS_ACTIVE.equals(offering.getStatus())) throw new IllegalStateException("Offering is archived");
        LmsGroup group = groupService.get(offering.getGroupId());
        AllocationResult result = new AllocationResult();

        Set<Integer> learnerIds = new LinkedHashSet<>();
        if (r.getLearnerIds() != null) r.getLearnerIds().stream().filter(Objects::nonNull).forEach(learnerIds::add);
        if (r.getRollNumbers() != null && !r.getRollNumbers().isEmpty()) {
            Set<String> wanted = r.getRollNumbers().stream().filter(x -> x != null && !x.isBlank()).map(String::trim)
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            Map<String, Learner> found = new HashMap<>();
            for (Learner l : membershipService.resolveRollNumbers(slot.getCollegeId(), wanted)) found.put(l.getRollNumber(), l);
            for (String roll : wanted) {
                Learner l = found.get(roll);
                if (l == null) result.getErrors().add(entry(null, roll, null, null, "No student with this roll number in this college"));
                else learnerIds.add(l.getId());
            }
        }
        if (r.getFromClassId() != null) {
            _Class source = classRepository.findByIdAndNotDeleted(r.getFromClassId())
                    .filter(c -> !c.isGroupBacked())
                    .orElseThrow(() -> new IllegalArgumentException("Class not found"));
            if (!Objects.equals(scopeResolutionService.resolveClassToCollegeId(source.getId()), slot.getCollegeId())) {
                throw new IllegalArgumentException("Class not found");
            }
            String sourceError = classEligibilityError(slot, source);
            if (sourceError != null) throw new IllegalArgumentException(sourceError);
            for (Learner l : learnerRepository.getActiveStudentDetailsByClassId(source.getId())) learnerIds.add(l.getId());
        }
        if (learnerIds.size() > 2000) throw new IllegalArgumentException("At most 2000 learners per request");
        result.setRequested(learnerIds.size() + result.getErrors().size());

        Map<Integer, Learner> learners = new HashMap<>();
        if (!learnerIds.isEmpty()) learnerRepository.findAllById(learnerIds).forEach(l -> learners.put(l.getId(), l));
        for (Integer learnerId : learnerIds) {
            Learner learner = learners.get(learnerId);
            String roll = learner == null ? null : learner.getRollNumber();
            String name = learner == null ? null : fullName(learner.getFirstName(), learner.getLastName());
            try {
                String eligibilityError = learnerEligibilityError(slot, learner);
                if (eligibilityError != null) throw new IllegalArgumentException(eligibilityError);
                LmsGroupMember before = membershipService.membership(group.getId(), LmsGroupMember.TYPE_LEARNER, learnerId).orElse(null);
                boolean already = before != null && before.isCurrent();
                LmsGroupMember m = membershipService.add(group, learnerId, LmsGroupMember.SOURCE_MANUAL, actor, r.getNote());
                if (already) result.setUnchanged(result.getUnchanged() + 1);
                else if (LmsGroupMember.STATE_ACTIVE.equals(m.getState())) result.setAdded(result.getAdded() + 1);
                else result.setWaitlisted(result.getWaitlisted() + 1);
                result.getResults().add(entry(learnerId, roll, name, m.getState(), already ? "Already enrolled" : null));
                if (!already && learner != null && learner.getClassId() != null) {
                    long clashes = scheduleRepository.countFutureOverlaps(offering.getBackedClassId(), learner.getClassId());
                    if (clashes > 0) {
                        result.getWarnings().add(entry(learnerId, roll, name, m.getState(),
                                clashes + " upcoming session" + (clashes == 1 ? "" : "s") + " clash with the student's own section timetable"));
                    }
                }
            } catch (IllegalArgumentException | IllegalStateException e) {
                result.getErrors().add(entry(learnerId, roll, name, null, e.getMessage() == null ? "Rejected" : e.getMessage()));
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                // A genuine cross-request race on this exact learner (double-submit, a client
                // retry): the unique (group, member) key caught it. Report it for this one
                // learner instead of letting it escape the loop — every earlier iteration's write
                // already committed in its own transaction, and losing this result would discard
                // a correct batch outcome over one already-resolved duplicate.
                result.getErrors().add(entry(learnerId, roll, name, null, "Already being processed; refresh and check the roster"));
            }
        }
        return result;
    }

    // These reasons are listed per student in the admin's "N added, M skipped" report, so they are
    // written for that reader: what is wrong with this student, in the words the admin screens use.
    private String learnerEligibilityError(ElectiveSlot slot, Learner learner) {
        if (learner == null || Boolean.TRUE.equals(learner.getIsDeleted())) return "Student not found";
        if (!Objects.equals(slot.getCollegeId(), learner.getCollegeId())) return "Student not found";
        if (learner.getClassId() == null) return "Student is not in a section yet";
        _Class sourceClass = classRepository.findByIdAndNotDeleted(learner.getClassId()).orElse(null);
        if (sourceClass == null || sourceClass.isGroupBacked()) return "Student's section is not a regular section";
        return classEligibilityError(slot, sourceClass);
    }

    private String classEligibilityError(ElectiveSlot slot, _Class sourceClass) {
        if (!Objects.equals(sourceClass.getProgramId(), slot.getProgramId())) {
            return "Student is in a different program than this slot";
        }
        if (sourceClass.getBatchId() == null) return "Student's section has no batch";
        Batch batch = batchRepository.findById(sourceClass.getBatchId().longValue()).orElse(null);
        if (batch == null) return "Student's batch was not found";
        if (!Objects.equals(batch.getCurrentSemester(), slot.getSemesterNumber())) {
            return "Student's batch is in Semester " + batch.getCurrentSemester()
                    + "; this slot is for Semester " + slot.getSemesterNumber();
        }
        String slotYear = academicYearStart(slot.getAcademicYear());
        String batchYear = academicYearStart(batch.getAcademicYear());
        if (slotYear != null && batchYear != null && !slotYear.equals(batchYear)) {
            return "Student's batch is in " + batch.getAcademicYear()
                    + "; this slot is for " + slot.getAcademicYear();
        }
        return null;
    }

    @Transactional
    public GroupMemberView remove(ElectiveOffering offering, Integer learnerId, GroupActor actor, String reason, boolean lock) {
        if (!ElectiveOffering.STATUS_ACTIVE.equals(offering.getStatus())) {
            throw new IllegalStateException("Archived offering rosters are historical and cannot be changed");
        }
        ElectiveSlot slot = slotRepository.findByIdAndIsDeletedFalse(offering.getSlotId())
                .orElseThrow(() -> new IllegalStateException("Elective slot not found"));
        if (!ElectiveSlot.STATUS_ACTIVE.equals(slot.getStatus())) throw new IllegalStateException("Elective slot is archived");
        LmsGroup group = groupService.get(offering.getGroupId());
        LmsGroupMember m = membershipService.remove(group, learnerId, actor, reason == null ? "Removed from elective" : reason, lock);
        return viewAssembler.memberViews(List.of(m)).get(0);
    }

    /** Move within one slot: leave the old offering (freeing its seat) and join the new one. */
    @Transactional
    public LmsGroupMember move(ElectiveOffering from, ElectiveOffering to, Integer learnerId, GroupActor actor) {
        if (!Objects.equals(from.getSlotId(), to.getSlotId())) throw new IllegalArgumentException("Both offerings must be in the same slot");
        if (from.getId().equals(to.getId())) throw new IllegalArgumentException("Student is already in that offering");
        ElectiveSlot slot = slotRepository.findByIdAndIsDeletedFalse(from.getSlotId())
                .orElseThrow(() -> new IllegalStateException("Elective slot not found"));
        if (!ElectiveSlot.STATUS_ACTIVE.equals(slot.getStatus())) throw new IllegalStateException("Elective slot is archived");
        if (!ElectiveOffering.STATUS_ACTIVE.equals(from.getStatus())) {
            throw new IllegalStateException("Archived offering rosters are historical and cannot be changed");
        }
        if (!ElectiveOffering.STATUS_ACTIVE.equals(to.getStatus())) throw new IllegalStateException("Target offering is archived");
        LmsGroup fromGroup = groupService.get(from.getGroupId());
        LmsGroup toGroup = groupService.get(to.getGroupId());
        membershipService.membership(fromGroup.getId(), LmsGroupMember.TYPE_LEARNER, learnerId)
                .filter(LmsGroupMember::isCurrent)
                .orElseThrow(() -> new IllegalArgumentException("Student is not in the source offering"));
        membershipService.remove(fromGroup, learnerId, actor, "Moved to offering " + to.getId(), false);
        return membershipService.add(toGroup, learnerId, LmsGroupMember.SOURCE_MANUAL, actor, "Moved from offering " + from.getId());
    }

    public List<GroupMemberView> roster(ElectiveOffering offering, String state) {
        return viewAssembler.memberViews(membershipService.members(offering.getGroupId(), state));
    }

    /**
     * Learners of the slot's program whose batch is in the slot's semester and who hold fewer
     * than {@code slot.maxPick} current offerings of this slot. For the common maxPick=1 case
     * that's "holds none yet"; for a "pick 2 of these 6" slot a student who has made only their
     * first pick still belongs here until they've made all of them.
     */
    @SuppressWarnings("unchecked")
    public List<UnallocatedRow> unallocated(ElectiveSlot slot) {
        List<Long> groupIds = offeringRepository.findBySlotIdAndIsDeletedFalseOrderByIdAsc(slot.getId()).stream()
                .filter(o -> ElectiveOffering.STATUS_ACTIVE.equals(o.getStatus()))
                .map(ElectiveOffering::getGroupId).collect(Collectors.toList());
        int maxPick = slot.getMaxPick() == null ? 1 : slot.getMaxPick();
        String slotYearStart = academicYearStart(slot.getAcademicYear());
        String sql = "SELECT l.* FROM learner l JOIN class c ON c.id = l.class_id JOIN batch b ON b.id = c.batch_id "
                + "WHERE c.program_id = :programId AND b.current_semester = :semester "
                + "AND (l.is_deleted = false OR l.is_deleted IS NULL) AND (c.is_deleted = false OR c.is_deleted IS NULL) "
                + "AND c.class_type = 'SECTION' "
                + (slotYearStart == null ? "" : "AND (b.academic_year IS NULL OR TRIM(b.academic_year) = '' OR LEFT(TRIM(b.academic_year), 4) = :yearStart) ")
                + (groupIds.isEmpty() ? "" : "AND (SELECT COUNT(*) FROM lms_group_member m WHERE m.member_type = 'LEARNER' "
                + "AND m.member_id = l.id AND m.state IN ('ACTIVE','WAITLISTED') AND m.group_id IN (:groupIds)) < :maxPick ")
                + "ORDER BY l.class_id, l.roll_number";
        javax.persistence.Query q = em.createNativeQuery(sql, Learner.class)
                .setParameter("programId", slot.getProgramId())
                .setParameter("semester", slot.getSemesterNumber());
        if (slotYearStart != null) q.setParameter("yearStart", slotYearStart);
        if (!groupIds.isEmpty()) {
            q.setParameter("groupIds", groupIds);
            q.setParameter("maxPick", maxPick);
        }
        List<Learner> learners = q.getResultList();

        Map<Integer, Integer> currentPickCounts = new HashMap<>();
        for (Long groupId : groupIds) {
            for (LmsGroupMember member : membershipService.members(groupId, null)) {
                if (LmsGroupMember.TYPE_LEARNER.equals(member.getMemberType())
                        && (LmsGroupMember.STATE_ACTIVE.equals(member.getState())
                        || LmsGroupMember.STATE_WAITLISTED.equals(member.getState()))) {
                    currentPickCounts.merge(member.getMemberId(), 1, Integer::sum);
                }
            }
        }

        Map<Integer, String> classNames = new HashMap<>();
        Set<Integer> classIds = learners.stream().map(Learner::getClassId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (!classIds.isEmpty()) {
            classRepository.findAllById(classIds).forEach(c -> classNames.put(c.getId(), c.getName()));
        }

        List<UnallocatedRow> out = new ArrayList<>();
        for (Learner l : learners) {
            UnallocatedRow row = new UnallocatedRow();
            row.setLearnerId(l.getId());
            row.setName(fullName(l.getFirstName(), l.getLastName()));
            row.setRollNumber(l.getRollNumber());
            row.setDepartment(l.getDepartment());
            row.setClassId(l.getClassId());
            row.setClassName(l.getClassId() == null ? null : classNames.get(l.getClassId()));
            row.setCurrentPickCount(currentPickCounts.getOrDefault(l.getId(), 0));
            out.add(row);
        }
        return out;
    }

    // ------------------------------------------------------------------ views

    private SlotView slotView(ElectiveSlot slot, Collection<ElectiveOffering> offerings, Map<Integer, String> programNames) {
        SlotView v = new SlotView();
        v.setId(slot.getId());
        v.setCollegeId(slot.getCollegeId());
        v.setProgramId(slot.getProgramId());
        v.setProgramName(programNames.computeIfAbsent(slot.getProgramId(), id ->
                programRepository.findById(id).map(NewProgram::getName).orElse(null)));
        v.setSemesterNumber(slot.getSemesterNumber());
        v.setAcademicYear(slot.getAcademicYear());
        v.setName(slot.getName());
        v.setDescription(slot.getDescription());
        v.setCredits(slot.getCredits());
        v.setMinPick(slot.getMinPick());
        v.setMaxPick(slot.getMaxPick());
        v.setStatus(slot.getStatus());
        v.setCreatedAt(slot.getCreatedAt());
        int allocated = 0;
        Set<Integer> currentLearners = new java.util.HashSet<>();
        for (ElectiveOffering o : offerings) {
            OfferingView ov = offeringView(o);
            v.getOfferings().add(ov);
            if (ElectiveOffering.STATUS_ACTIVE.equals(ov.getStatus())) {
                allocated += ov.getActiveCount() == null ? 0 : ov.getActiveCount();
                for (LmsGroupMember member : membershipService.members(o.getGroupId(), null)) {
                    if (LmsGroupMember.TYPE_LEARNER.equals(member.getMemberType())
                            && (LmsGroupMember.STATE_ACTIVE.equals(member.getState())
                            || LmsGroupMember.STATE_WAITLISTED.equals(member.getState()))) {
                        currentLearners.add(member.getMemberId());
                    }
                }
            }
        }
        v.setOfferingCount(v.getOfferings().size());
        v.setAllocatedCount(allocated);
        v.setCurrentStudentCount(currentLearners.size());
        v.setHasEnrollmentHistory(hasAnyMembershipHistory(offerings));
        return v;
    }

    /**
     * Self-heals a desync: if the underlying group was archived out-of-band (e.g. an admin
     * archived it directly from the generic Student Groups console instead of
     * {@link #archiveOffering}), bring the offering row's status back in line so the admin UI
     * never shows "ACTIVE" for something that no longer grants access, and so every other check
     * that reads {@code elective_offering.status} (not {@code lms_group.status}) agrees.
     */
    @Transactional
    public OfferingView offeringView(ElectiveOffering o) {
        if (!ElectiveOffering.STATUS_ARCHIVED.equals(o.getStatus())) {
            LmsGroup group = groupRepository.findById(o.getGroupId()).orElse(null);
            if (group == null || LmsGroup.STATUS_ARCHIVED.equals(group.getStatus())) {
                // Converge the whole elective lifecycle, not just the status row: faculty
                // assignments must be released too or the archived elective remains visible to
                // faculty in My Courses / attendance / scheduling.
                o = archiveOffering(o);
            }
        }
        OfferingView v = new OfferingView();
        v.setId(o.getId());
        v.setSlotId(o.getSlotId());
        v.setCourseId(o.getCourseId());
        courseRepository.findById(o.getCourseId()).ifPresent(c -> {
            v.setCourseName(c.getCourseName());
            String code = c.getShortTitle();
            if (c.getMetaData() != null && c.getMetaData().getCourseCode() != null && !c.getMetaData().getCourseCode().isBlank()) {
                code = c.getMetaData().getCourseCode();
            }
            v.setCourseCode(code);
        });
        v.setGroupId(o.getGroupId());
        v.setBackedClassId(o.getBackedClassId());
        classRepository.findById(o.getBackedClassId()).ifPresent(c -> v.setBackedClassName(c.getName()));
        v.setCapacity(o.getCapacity());
        groupRepository.findById(o.getGroupId()).ifPresent(g -> {
            v.setActiveCount(g.getActiveCount());
            v.setSeatsLeft(g.seatsLeft());
        });
        v.setWaitlistedCount((int) membershipService.members(o.getGroupId(), LmsGroupMember.STATE_WAITLISTED).size());
        v.setStatus(o.getStatus());
        v.setFaculty(facultyViews(o));
        return v;
    }

    private List<FacultyView> facultyViews(ElectiveOffering o) {
        List<FacultyTeachingAssignment> assignments = assignmentRepository.findByClassIdAndIsActive(o.getBackedClassId(), true).stream()
                .filter(a -> Objects.equals(a.getCourseId(), o.getCourseId()))
                .sorted((a, b) -> Integer.compare(a.getRole() == null ? 9 : a.getRole().ordinal(), b.getRole() == null ? 9 : b.getRole().ordinal()))
                .collect(Collectors.toList());
        if (assignments.isEmpty()) return List.of();
        Map<Integer, Faculty> faculties = new HashMap<>();
        facultyRepository.findAllById(assignments.stream().map(FacultyTeachingAssignment::getFacultyId).filter(Objects::nonNull)
                .collect(Collectors.toList())).forEach(f -> faculties.put(f.getId(), f));
        List<FacultyView> out = new ArrayList<>();
        for (FacultyTeachingAssignment a : assignments) {
            Faculty f = faculties.get(a.getFacultyId());
            if (f == null) continue;
            FacultyView fv = new FacultyView();
            fv.setId(f.getId());
            fv.setName(fullName(f.getFirstName(), f.getLastName()));
            fv.setRole(a.getRole() == null ? "PRIMARY" : a.getRole().name());
            out.add(fv);
        }
        return out;
    }

    private static AllocationResult.Entry entry(Integer learnerId, String roll, String name, String state, String message) {
        AllocationResult.Entry e = new AllocationResult.Entry();
        e.setLearnerId(learnerId);
        e.setRollNumber(roll);
        e.setName(name);
        e.setState(state);
        e.setMessage(message);
        return e;
    }

    private static String fullName(String first, String last) {
        return ((first == null ? "" : first) + " " + (last == null ? "" : last)).trim();
    }
}
