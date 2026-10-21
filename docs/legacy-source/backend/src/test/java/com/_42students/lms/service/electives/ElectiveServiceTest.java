package com._42students.lms.service.electives;

import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.electives.ElectiveRequests.AllocateRequest;
import com._42students.lms.dto.electives.ElectiveRequests.OfferingRequest;
import com._42students.lms.dto.electives.ElectiveRequests.SlotRequest;
import com._42students.lms.dto.electives.ElectiveViews.AllocationResult;
import com._42students.lms.dto.groups.GroupUpsertRequest;
import com._42students.lms.model.Course;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.FacultyTeachingAssignment;
import com._42students.lms.model.Batch;
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
import com._42students.lms.dto.electives.ElectiveViews.OfferingView;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Creating an offering wires the three parts (ELECTIVE group activated, GROUP_BACKED class with
 * the group as roster, the offering row), and allocation reports every learner's outcome without
 * aborting the batch.
 */
class ElectiveServiceTest {

    private static final int COLLEGE = 6;

    private final ElectiveSlotRepository slotRepo = mock(ElectiveSlotRepository.class);
    private final ElectiveOfferingRepository offeringRepo = mock(ElectiveOfferingRepository.class);
    private final GroupService groupService = mock(GroupService.class);
    private final GroupMembershipService membership = mock(GroupMembershipService.class);
    private final GroupViewAssembler assembler = mock(GroupViewAssembler.class);
    private final LmsGroupRepository groupRepo = mock(LmsGroupRepository.class);
    private final _ClassRepository classRepo = mock(_ClassRepository.class);
    private final CourseRepository courseRepo = mock(CourseRepository.class);
    private final NewProgramRepository programRepo = mock(NewProgramRepository.class);
    private final FacultyRepository facultyRepo = mock(FacultyRepository.class);
    private final FacultyTeachingAssignmentRepository assignmentRepo = mock(FacultyTeachingAssignmentRepository.class);
    private final LearnerRepository learnerRepo = mock(LearnerRepository.class);
    private final BatchRepository batchRepo = mock(BatchRepository.class);
    private final ClassScheduleRepository scheduleRepo = mock(ClassScheduleRepository.class);
    private final ScopeResolutionService scope = mock(ScopeResolutionService.class);
    private final EntityManager em = mock(EntityManager.class);
    private final Query query = mock(Query.class);
    private final GroupActor actor = GroupActor.system();

    private ElectiveService service;

    @BeforeEach
    void setUp() {
        service = new ElectiveService(slotRepo, offeringRepo, groupService, membership, assembler, groupRepo, classRepo,
                courseRepo, programRepo, facultyRepo, assignmentRepo, learnerRepo, batchRepo, scheduleRepo, scope);
        ReflectionTestUtils.setField(service, "em", em);
        when(slotRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(offeringRepo.save(any())).thenAnswer(i -> {
            ElectiveOffering o = i.getArgument(0);
            if (o.getId() == null) o.setId(77L);
            return o;
        });
        when(groupRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(classRepo.save(any())).thenAnswer(i -> {
            _Class c = i.getArgument(0);
            c.setId(900);
            return c;
        });
    }

    private static ElectiveSlot slot() {
        ElectiveSlot s = new ElectiveSlot();
        s.setId(5L);
        s.setCollegeId(COLLEGE);
        s.setProgramId(3);
        s.setSemesterNumber(5);
        s.setAcademicYear("2026-27");
        s.setName("PE-1");
        s.setCredits(3);
        s.setStatus(ElectiveSlot.STATUS_ACTIVE);
        return s;
    }

    private static Course course(int id) {
        Course c = new Course();
        c.setId(id);
        c.setCourseName("Machine Learning");
        c.setIsDeleted(false);
        return c;
    }

    @Test void moduleSettingKeyResolvesInTheCatalog() {
        // The controller gates on the catalog's setting key; a typo here would 400 every request.
        assertEquals("module.electives.enabled", com._42students.lms.service.ModuleFeatureCatalog.settingKeyFor(ElectiveService.MODULE));
    }

    @Test void createSlotRequiresAProgramOfTheCollege() {
        SlotRequest r = new SlotRequest();
        r.setProgramId(3);
        r.setSemesterNumber(5);
        r.setName("PE-1");
        when(scope.resolveProgramToCollegeId(3)).thenReturn(COLLEGE + 1);
        assertThrows(IllegalArgumentException.class, () -> service.createSlot(COLLEGE, r));

        when(scope.resolveProgramToCollegeId(3)).thenReturn(COLLEGE);
        NewProgram program = new NewProgram();
        program.setId(3);
        program.setDurationYears(4);
        when(programRepo.findByIdAndNotDeleted(3)).thenReturn(Optional.of(program));
        ElectiveSlot created = service.createSlot(COLLEGE, r);
        assertEquals(3, created.getCredits(), "default credits");
        assertEquals(1, created.getMaxPick(), "default pick");
    }

    @Test void createOfferingWiresGroupClassAndOffering() {
        when(courseRepo.findById(42)).thenReturn(Optional.of(course(42)));
        when(scope.resolveCourseToCollegeId(42)).thenReturn(COLLEGE);
        when(offeringRepo.existsBySlotIdAndCourseIdAndStatusAndIsDeletedFalse(5L, 42, ElectiveOffering.STATUS_ACTIVE)).thenReturn(false);
        LmsGroup group = new LmsGroup();
        group.setId(300L);
        group.setKind("ELECTIVE");
        when(groupService.create(eq(actor), eq(COLLEGE), any())).thenReturn(group);
        when(groupService.transition(group, LmsGroup.STATUS_ACTIVE)).thenReturn(group);
        OfferingRequest r = new OfferingRequest();
        r.setCourseId(42);
        r.setCapacity(30);

        ElectiveOffering offering = service.createOffering(slot(), r, actor);

        ArgumentCaptor<GroupUpsertRequest> groupReq = ArgumentCaptor.forClass(GroupUpsertRequest.class);
        verify(groupService).create(eq(actor), eq(COLLEGE), groupReq.capture());
        assertEquals("ELECTIVE", groupReq.getValue().getKind());
        assertEquals(30, groupReq.getValue().getCapacity());
        assertEquals(5, groupReq.getValue().getSemesterNumber());
        verify(groupService).transition(group, LmsGroup.STATUS_ACTIVE);

        ArgumentCaptor<_Class> classCaptor = ArgumentCaptor.forClass(_Class.class);
        verify(classRepo).save(classCaptor.capture());
        _Class backed = classCaptor.getValue();
        assertEquals(_Class.TYPE_GROUP_BACKED, backed.getClassType());
        assertEquals(300L, backed.getRosterGroupId());
        assertEquals(3, backed.getProgramId());
        assertNull(backed.getBatchId());

        assertEquals(300L, offering.getGroupId());
        assertEquals(900, offering.getBackedClassId());
        assertEquals(42, offering.getCourseId());
        assertEquals(ElectiveOffering.STATUS_ACTIVE, offering.getStatus());
    }

    @Test void createOfferingRefusesACourseFromAnotherCollegeOrADuplicate() {
        when(courseRepo.findById(42)).thenReturn(Optional.of(course(42)));
        when(scope.resolveCourseToCollegeId(42)).thenReturn(COLLEGE + 1);
        OfferingRequest r = new OfferingRequest();
        r.setCourseId(42);
        assertThrows(IllegalArgumentException.class, () -> service.createOffering(slot(), r, actor));

        when(scope.resolveCourseToCollegeId(42)).thenReturn(COLLEGE);
        when(offeringRepo.existsBySlotIdAndCourseIdAndStatusAndIsDeletedFalse(5L, 42, ElectiveOffering.STATUS_ACTIVE)).thenReturn(true);
        assertThrows(IllegalStateException.class, () -> service.createOffering(slot(), r, actor));
    }

    @Test void allocateReportsPerLearnerOutcomesAndClashWarnings() {
        ElectiveOffering offering = new ElectiveOffering();
        offering.setId(77L);
        offering.setSlotId(5L);
        offering.setGroupId(300L);
        offering.setBackedClassId(900);
        offering.setStatus(ElectiveOffering.STATUS_ACTIVE);
        LmsGroup group = new LmsGroup();
        group.setId(300L);
        when(groupService.get(300L)).thenReturn(group);

        Learner a = learner(1, "R1", 10);
        Learner b = learner(2, "R2", 10);
        Learner c = learner(3, "R3", 11);
        when(learnerRepo.findAllById(any())).thenReturn(List.of(a, b, c));
        stubEligibleClass(10, 100);
        stubEligibleClass(11, 101);
        when(membership.membership(anyLong(), anyString(), anyInt())).thenReturn(Optional.empty());
        LmsGroupMember active = new LmsGroupMember(); active.setState(LmsGroupMember.STATE_ACTIVE);
        LmsGroupMember waiting = new LmsGroupMember(); waiting.setState(LmsGroupMember.STATE_WAITLISTED);
        when(membership.add(eq(group), eq(1), anyString(), eq(actor), any())).thenReturn(active);
        when(membership.add(eq(group), eq(2), anyString(), eq(actor), any())).thenThrow(new IllegalStateException("Already allocated to 1 offering of PE-1"));
        when(membership.add(eq(group), eq(3), anyString(), eq(actor), any())).thenReturn(waiting);
        when(scheduleRepo.countFutureOverlaps(900, 10)).thenReturn(2L);
        when(scheduleRepo.countFutureOverlaps(900, 11)).thenReturn(0L);

        AllocateRequest r = new AllocateRequest();
        r.setLearnerIds(List.of(1, 2, 3));
        AllocationResult result = service.allocate(slot(), offering, r, actor);

        assertEquals(3, result.getRequested());
        assertEquals(1, result.getAdded());
        assertEquals(1, result.getWaitlisted());
        assertEquals(1, result.getErrors().size());
        assertEquals(2, result.getErrors().get(0).getLearnerId());
        assertEquals(1, result.getWarnings().size(), "only A's section clashes");
        assertEquals(1, result.getWarnings().get(0).getLearnerId());
        assertTrue(result.getWarnings().get(0).getMessage().contains("2 upcoming sessions"));
    }

    @Test void archiveOfferingArchivesTheGroupAndReleasesFaculty() {
        ElectiveOffering offering = new ElectiveOffering();
        offering.setId(77L);
        offering.setGroupId(300L);
        offering.setBackedClassId(900);
        offering.setStatus(ElectiveOffering.STATUS_ACTIVE);
        LmsGroup group = new LmsGroup();
        group.setId(300L);
        group.setStatus(LmsGroup.STATUS_ACTIVE);
        when(groupRepo.findById(300L)).thenReturn(Optional.of(group));
        FacultyTeachingAssignment primary = new FacultyTeachingAssignment(15, 42, 900, 5, "2026-27");
        primary.setIsActive(true);
        when(assignmentRepo.findByClassIdAndIsActive(900, true)).thenReturn(List.of(primary));

        ElectiveOffering archived = service.archiveOffering(offering);

        assertEquals(ElectiveOffering.STATUS_ARCHIVED, archived.getStatus());
        verify(groupService).transition(group, LmsGroup.STATUS_ARCHIVED);
        ArgumentCaptor<FacultyTeachingAssignment> saved = ArgumentCaptor.forClass(FacultyTeachingAssignment.class);
        verify(assignmentRepo).save(saved.capture());
        assertEquals(false, saved.getValue().getIsActive(), "faculty must be released so My Courses/attendance/schedule pickers stop listing it");
    }

    @Test void archiveOfferingSkipsGroupTransitionWhenAlreadyArchivedButStillReleasesFaculty() {
        ElectiveOffering offering = new ElectiveOffering();
        offering.setId(77L);
        offering.setGroupId(300L);
        offering.setBackedClassId(900);
        offering.setStatus(ElectiveOffering.STATUS_ACTIVE); // desynced: group already archived, row wasn't
        LmsGroup group = new LmsGroup();
        group.setId(300L);
        group.setStatus(LmsGroup.STATUS_ARCHIVED);
        when(groupRepo.findById(300L)).thenReturn(Optional.of(group));
        when(assignmentRepo.findByClassIdAndIsActive(900, true)).thenReturn(List.of());

        service.archiveOffering(offering);

        verify(groupService, never()).transition(any(), anyString());
    }

    @Test void archiveOfferingToleratesAGroupThatWasSoftDeletedOutOfBand() {
        // A group can be archived AND THEN soft-deleted from the generic Student Groups console
        // (a two-step admin action, but reachable): groupService.get() would 404 on it, so
        // archiveOffering must not depend on that lookup succeeding.
        ElectiveOffering offering = new ElectiveOffering();
        offering.setId(77L);
        offering.setGroupId(300L);
        offering.setBackedClassId(900);
        offering.setStatus(ElectiveOffering.STATUS_ACTIVE);
        when(groupRepo.findById(300L)).thenReturn(Optional.empty());
        when(assignmentRepo.findByClassIdAndIsActive(900, true)).thenReturn(List.of());

        ElectiveOffering archived = service.archiveOffering(offering);

        assertEquals(ElectiveOffering.STATUS_ARCHIVED, archived.getStatus());
        verify(groupService, never()).transition(any(), anyString());
    }

    @Test void archiveSlotFailsAtomicallyWhenAnyOfferingCannotBeArchived() {
        ElectiveSlot slot = slot();
        ElectiveOffering broken = new ElectiveOffering();
        broken.setId(1L); broken.setGroupId(300L); broken.setBackedClassId(900); broken.setStatus(ElectiveOffering.STATUS_ACTIVE);
        ElectiveOffering fine = new ElectiveOffering();
        fine.setId(2L); fine.setGroupId(301L); fine.setBackedClassId(901); fine.setStatus(ElectiveOffering.STATUS_ACTIVE);
        when(offeringRepo.findBySlotIdAndIsDeletedFalseOrderByIdAsc(5L)).thenReturn(List.of(broken, fine));
        LmsGroup group1 = new LmsGroup();
        group1.setId(300L);
        group1.setStatus(LmsGroup.STATUS_ACTIVE);
        when(groupRepo.findById(300L)).thenReturn(Optional.of(group1));
        when(assignmentRepo.findByClassIdAndIsActive(900, true)).thenThrow(new RuntimeException("simulated failure"));

        assertThrows(RuntimeException.class, () -> service.archiveSlot(slot));
        assertEquals(ElectiveSlot.STATUS_ACTIVE, slot.getStatus());
        verify(slotRepo, never()).save(slot);
    }

    @Test void offeringViewSelfHealsWhenTheGroupWasArchivedOutOfBand() {
        // Simulates an admin archiving the elective's group directly from the generic Student
        // Groups console: elective_offering.status is left ACTIVE while lms_group.status is not.
        ElectiveOffering offering = new ElectiveOffering();
        offering.setId(77L);
        offering.setGroupId(300L);
        offering.setBackedClassId(900);
        offering.setCourseId(42);
        offering.setStatus(ElectiveOffering.STATUS_ACTIVE);
        LmsGroup group = new LmsGroup();
        group.setId(300L);
        group.setStatus(LmsGroup.STATUS_ARCHIVED);
        group.setActiveCount(0);
        when(groupRepo.findById(300L)).thenReturn(Optional.of(group));
        when(assignmentRepo.findByClassIdAndIsActive(900, true)).thenReturn(List.of());
        when(membership.members(300L, LmsGroupMember.STATE_WAITLISTED)).thenReturn(List.of());

        OfferingView view = service.offeringView(offering);

        assertEquals(ElectiveOffering.STATUS_ARCHIVED, view.getStatus(), "the admin UI must not show ACTIVE for something access-blocked");
        assertEquals(ElectiveOffering.STATUS_ARCHIVED, offering.getStatus(), "the row itself is repaired, not just the view");
        verify(offeringRepo, times(1)).save(offering);
        verify(assignmentRepo, times(2)).findByClassIdAndIsActive(900, true);
    }

    @Test void offeringViewDoesNotWriteWhenAlreadyConsistent() {
        ElectiveOffering offering = new ElectiveOffering();
        offering.setId(77L);
        offering.setGroupId(300L);
        offering.setBackedClassId(900);
        offering.setCourseId(42);
        offering.setStatus(ElectiveOffering.STATUS_ACTIVE);
        LmsGroup group = new LmsGroup();
        group.setId(300L);
        group.setStatus(LmsGroup.STATUS_ACTIVE);
        when(groupRepo.findById(300L)).thenReturn(Optional.of(group));
        when(assignmentRepo.findByClassIdAndIsActive(900, true)).thenReturn(List.of());
        when(membership.members(300L, LmsGroupMember.STATE_WAITLISTED)).thenReturn(List.of());

        service.offeringView(offering);

        verify(offeringRepo, never()).save(any());
    }

    @Test void moveRequiresSameSlotAndCurrentMembership() {
        ElectiveOffering from = new ElectiveOffering(); from.setId(1L); from.setSlotId(5L); from.setGroupId(300L); from.setStatus("ACTIVE");
        ElectiveOffering other = new ElectiveOffering(); other.setId(2L); other.setSlotId(6L); other.setGroupId(301L); other.setStatus("ACTIVE");
        assertThrows(IllegalArgumentException.class, () -> service.move(from, other, 1, actor));

        ElectiveOffering to = new ElectiveOffering(); to.setId(3L); to.setSlotId(5L); to.setGroupId(302L); to.setStatus("ACTIVE");
        when(slotRepo.findByIdAndIsDeletedFalse(5L)).thenReturn(Optional.of(slot()));
        LmsGroup g1 = new LmsGroup(); g1.setId(300L);
        LmsGroup g2 = new LmsGroup(); g2.setId(302L);
        when(groupService.get(300L)).thenReturn(g1);
        when(groupService.get(302L)).thenReturn(g2);
        when(membership.membership(300L, "LEARNER", 1)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.move(from, to, 1, actor));
    }

    @Test void setFacultyUpdatesRoleWhenOnlyTheOrderChanges() {
        ElectiveSlot slot = slot();
        ElectiveOffering offering = new ElectiveOffering();
        offering.setBackedClassId(900);
        offering.setCourseId(42);
        offering.setStatus(ElectiveOffering.STATUS_ACTIVE);
        when(scope.resolveFacultyToCollegeId(10)).thenReturn(COLLEGE);
        when(scope.resolveFacultyToCollegeId(11)).thenReturn(COLLEGE);
        Faculty f10 = new Faculty(); f10.setId(10); f10.setCollegeId(COLLEGE);
        Faculty f11 = new Faculty(); f11.setId(11); f11.setCollegeId(COLLEGE);
        when(facultyRepo.findByIdAndNotDeleted(10)).thenReturn(Optional.of(f10));
        when(facultyRepo.findByIdAndNotDeleted(11)).thenReturn(Optional.of(f11));
        FacultyTeachingAssignment wasPrimary = new FacultyTeachingAssignment(10, 42, 900, 5, "2026-27");
        wasPrimary.setRole(FacultyTeachingAssignment.TeachingRole.PRIMARY);
        FacultyTeachingAssignment wasCoTeacher = new FacultyTeachingAssignment(11, 42, 900, 5, "2026-27");
        wasCoTeacher.setRole(FacultyTeachingAssignment.TeachingRole.CO_TEACHER);
        when(assignmentRepo.findByClassIdAndIsActive(900, true)).thenReturn(List.of(wasPrimary, wasCoTeacher));
        when(facultyRepo.findAllById(any())).thenReturn(List.of());

        // Same two faculty, order flipped: 11 should become PRIMARY, 10 should become CO_TEACHER.
        service.setFaculty(slot, offering, List.of(11, 10));

        assertEquals(FacultyTeachingAssignment.TeachingRole.PRIMARY, wasCoTeacher.getRole(), "moved to position 0 -> now primary");
        assertEquals(FacultyTeachingAssignment.TeachingRole.CO_TEACHER, wasPrimary.getRole(), "moved to position 1 -> now co-teacher");
        verify(assignmentRepo, never()).save(argThat(a -> a != wasPrimary && a != wasCoTeacher));
    }

    @Test void setFacultyDeactivatesAnyoneDroppedFromTheList() {
        ElectiveSlot slot = slot();
        ElectiveOffering offering = new ElectiveOffering();
        offering.setBackedClassId(900);
        offering.setCourseId(42);
        offering.setStatus(ElectiveOffering.STATUS_ACTIVE);
        FacultyTeachingAssignment existing = new FacultyTeachingAssignment(10, 42, 900, 5, "2026-27");
        existing.setIsActive(true);
        when(assignmentRepo.findByClassIdAndIsActive(900, true)).thenReturn(List.of(existing));
        when(facultyRepo.findAllById(any())).thenReturn(List.of());

        service.setFaculty(slot, offering, List.of());

        assertEquals(false, existing.getIsActive());
    }

    @Test void allocateReportsAConcurrentDuplicateAsAPerLearnerErrorRatherThanAbortingTheBatch() {
        ElectiveOffering offering = new ElectiveOffering();
        offering.setId(77L);
        offering.setSlotId(5L);
        offering.setGroupId(300L);
        offering.setBackedClassId(900);
        offering.setStatus(ElectiveOffering.STATUS_ACTIVE);
        LmsGroup group = new LmsGroup();
        group.setId(300L);
        when(groupService.get(300L)).thenReturn(group);
        Learner a = learner(1, "R1", 10);
        Learner b = learner(2, "R2", 10);
        when(learnerRepo.findAllById(any())).thenReturn(List.of(a, b));
        stubEligibleClass(10, 100);
        when(membership.membership(anyLong(), anyString(), anyInt())).thenReturn(Optional.empty());
        LmsGroupMember active = new LmsGroupMember(); active.setState(LmsGroupMember.STATE_ACTIVE);
        when(membership.add(eq(group), eq(1), anyString(), eq(actor), any())).thenReturn(active);
        when(membership.add(eq(group), eq(2), anyString(), eq(actor), any()))
                .thenThrow(new org.springframework.dao.DataIntegrityViolationException("duplicate key"));

        AllocateRequest r = new AllocateRequest();
        r.setLearnerIds(List.of(1, 2));

        AllocationResult result = service.allocate(slot(), offering, r, actor);

        assertEquals(1, result.getAdded(), "learner 1's already-committed result must not be lost");
        assertEquals(1, result.getErrors().size());
        assertEquals(2, result.getErrors().get(0).getLearnerId());
    }

    @Test void updateOfferingPromotesTheWaitlistWhenCapacityIsRaised() {
        ElectiveOffering offering = new ElectiveOffering();
        offering.setId(77L);
        offering.setGroupId(300L);
        offering.setBackedClassId(900);
        offering.setStatus(ElectiveOffering.STATUS_ACTIVE);
        offering.setCapacity(5);
        LmsGroup group = new LmsGroup();
        group.setId(300L);
        group.setCapacity(5);
        group.setActiveCount(5);
        when(groupService.get(300L)).thenReturn(group);
        when(slotRepo.findByIdAndIsDeletedFalse(5L)).thenReturn(Optional.of(slot()));
        offering.setSlotId(5L);
        OfferingRequest r = new OfferingRequest();
        r.setCapacity(10);

        service.updateOffering(offering, r);

        verify(membership).promoteWhileSeatsAvailable(group);
    }

    @Test void updateOfferingDoesNotPromoteOnCapacityDecrease() {
        ElectiveOffering offering = new ElectiveOffering();
        offering.setId(77L);
        offering.setGroupId(300L);
        offering.setBackedClassId(900);
        offering.setStatus(ElectiveOffering.STATUS_ACTIVE);
        offering.setCapacity(10);
        LmsGroup group = new LmsGroup();
        group.setId(300L);
        group.setCapacity(10);
        group.setActiveCount(5);
        when(groupService.get(300L)).thenReturn(group);
        when(slotRepo.findByIdAndIsDeletedFalse(5L)).thenReturn(Optional.of(slot()));
        offering.setSlotId(5L);
        OfferingRequest r = new OfferingRequest();
        r.setCapacity(6);

        service.updateOffering(offering, r);

        verify(membership, never()).promoteWhileSeatsAvailable(any());
    }

    @Test void updateSlotRefusesASemesterChangeOnceAnyoneIsEnrolled() {
        ElectiveSlot slot = slot();
        ElectiveOffering offering = new ElectiveOffering();
        offering.setGroupId(300L);
        when(offeringRepo.findBySlotIdAndIsDeletedFalseOrderByIdAsc(5L)).thenReturn(List.of(offering));
        LmsGroupMember historical = new LmsGroupMember();
        historical.setState(LmsGroupMember.STATE_WAITLISTED);
        when(membership.members(300L, null)).thenReturn(List.of(historical));
        NewProgram program = new NewProgram(); program.setId(3); program.setDurationYears(4);
        when(programRepo.findByIdAndNotDeleted(3)).thenReturn(Optional.of(program));
        SlotRequest r = new SlotRequest();
        r.setSemesterNumber(6);
        r.setAcademicYear("2026-27");
        r.setCredits(3);
        r.setMinPick(1);
        r.setMaxPick(1);
        r.setName("PE-1");

        assertThrows(IllegalStateException.class, () -> service.updateSlot(slot, r));
    }

    @Test void updateSlotAllowsASemesterChangeBeforeAnyoneIsEnrolled() {
        ElectiveSlot slot = slot();
        ElectiveOffering offering = new ElectiveOffering();
        offering.setGroupId(300L);
        when(offeringRepo.findBySlotIdAndIsDeletedFalseOrderByIdAsc(5L)).thenReturn(List.of(offering));
        when(membership.members(300L, null)).thenReturn(List.of());
        NewProgram program = new NewProgram(); program.setId(3); program.setDurationYears(4);
        when(programRepo.findByIdAndNotDeleted(3)).thenReturn(Optional.of(program));
        SlotRequest r = new SlotRequest();
        r.setSemesterNumber(6);
        r.setAcademicYear("2026-27");
        r.setCredits(3);
        r.setMinPick(1);
        r.setMaxPick(1);
        r.setName("PE-1");

        assertEquals(6, service.updateSlot(slot, r).getSemesterNumber());
    }

    @Test void archivedOfferingMembershipDoesNotInflateActiveSlotAllocationCount() {
        ElectiveSlot slot = slot();
        ElectiveOffering archived = new ElectiveOffering();
        archived.setId(77L); archived.setSlotId(5L); archived.setGroupId(300L); archived.setBackedClassId(900);
        archived.setCourseId(42); archived.setStatus(ElectiveOffering.STATUS_ARCHIVED);
        LmsGroup group = new LmsGroup(); group.setId(300L); group.setStatus(LmsGroup.STATUS_ARCHIVED); group.setActiveCount(9);
        when(groupRepo.findById(300L)).thenReturn(Optional.of(group));
        when(membership.members(300L, LmsGroupMember.STATE_WAITLISTED)).thenReturn(List.of());
        when(membership.members(300L, null)).thenReturn(List.of(new LmsGroupMember()));

        com._42students.lms.dto.electives.ElectiveViews.SlotView view = invokeSlotView(slot, List.of(archived));

        assertEquals(0, view.getAllocatedCount());
        assertTrue(view.isHasEnrollmentHistory());
    }

    @Test void allocationRejectsLearnerOutsideTheSlotSemesterBeforeCreatingMembership() {
        ElectiveOffering offering = new ElectiveOffering();
        offering.setId(77L); offering.setSlotId(5L); offering.setGroupId(300L); offering.setBackedClassId(900);
        offering.setStatus(ElectiveOffering.STATUS_ACTIVE);
        LmsGroup group = new LmsGroup(); group.setId(300L);
        when(groupService.get(300L)).thenReturn(group);

        Learner learner = learner(1, "R1", 10);
        when(learnerRepo.findAllById(any())).thenReturn(List.of(learner));
        _Class clazz = new _Class(); clazz.setId(10); clazz.setProgramId(3); clazz.setBatchId(100); clazz.setClassType(_Class.TYPE_SECTION);
        when(classRepo.findByIdAndNotDeleted(10)).thenReturn(Optional.of(clazz));
        Batch batch = new Batch(); batch.setId(100L); batch.setProgramId(3L); batch.setCurrentSemester(4); batch.setAcademicYear("2026-27");
        when(batchRepo.findById(100L)).thenReturn(Optional.of(batch));

        AllocateRequest request = new AllocateRequest();
        request.setLearnerIds(List.of(1));
        AllocationResult result = service.allocate(slot(), offering, request, actor);

        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).getMessage().contains("Semester 4"));
        verify(membership, never()).add(any(), anyInt(), anyString(), any(), any());
    }

    @Test void legacyBareAcademicYearCanBeCanonicalizedWithoutChangingItsYear() {
        ElectiveSlot slot = slot();
        slot.setAcademicYear("2026");
        ElectiveOffering offering = new ElectiveOffering(); offering.setGroupId(300L);
        when(offeringRepo.findBySlotIdAndIsDeletedFalseOrderByIdAsc(5L)).thenReturn(List.of(offering));
        LmsGroupMember historical = new LmsGroupMember(); historical.setState(LmsGroupMember.STATE_ACTIVE);
        when(membership.members(300L, null)).thenReturn(List.of(historical));
        NewProgram program = new NewProgram(); program.setId(3); program.setDurationYears(4);
        when(programRepo.findByIdAndNotDeleted(3)).thenReturn(Optional.of(program));

        SlotRequest r = new SlotRequest();
        r.setSemesterNumber(5);
        r.setAcademicYear("2026-27");
        r.setCredits(3);
        r.setMinPick(1);
        r.setMaxPick(1);
        r.setName("PE-1");

        assertEquals("2026-27", service.updateSlot(slot, r).getAcademicYear());
    }

    @Test void unallocatedRowsExposePickProgressAndHumanSectionNames() {
        ElectiveSlot slot = slot();
        slot.setMinPick(2);
        slot.setMaxPick(3);

        ElectiveOffering first = new ElectiveOffering();
        first.setId(1L); first.setGroupId(300L); first.setStatus(ElectiveOffering.STATUS_ACTIVE);
        ElectiveOffering second = new ElectiveOffering();
        second.setId(2L); second.setGroupId(301L); second.setStatus(ElectiveOffering.STATUS_ACTIVE);
        when(offeringRepo.findBySlotIdAndIsDeletedFalseOrderByIdAsc(5L)).thenReturn(List.of(first, second));

        Learner learner = learner(1, "R1", 10);
        when(em.createNativeQuery(anyString(), eq(Learner.class))).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of(learner));

        LmsGroupMember active = new LmsGroupMember();
        active.setMemberType(LmsGroupMember.TYPE_LEARNER);
        active.setMemberId(1);
        active.setState(LmsGroupMember.STATE_ACTIVE);
        LmsGroupMember waiting = new LmsGroupMember();
        waiting.setMemberType(LmsGroupMember.TYPE_LEARNER);
        waiting.setMemberId(1);
        waiting.setState(LmsGroupMember.STATE_WAITLISTED);
        when(membership.members(300L, null)).thenReturn(List.of(active));
        when(membership.members(301L, null)).thenReturn(List.of(waiting));

        _Class section = new _Class();
        section.setId(10);
        section.setName("CSE A");
        when(classRepo.findAllById(any())).thenReturn(List.of(section));

        List<com._42students.lms.dto.electives.ElectiveViews.UnallocatedRow> rows = service.unallocated(slot);

        assertEquals(1, rows.size());
        assertEquals(2, rows.get(0).getCurrentPickCount());
        assertEquals("CSE A", rows.get(0).getClassName());
    }

    @Test void slotViewCountsUniqueCurrentStudentsSeparatelyFromSeatEnrolments() {
        ElectiveSlot slot = slot();
        ElectiveOffering first = new ElectiveOffering();
        first.setId(1L); first.setGroupId(300L); first.setBackedClassId(900); first.setCourseId(42);
        first.setStatus(ElectiveOffering.STATUS_ACTIVE);
        ElectiveOffering second = new ElectiveOffering();
        second.setId(2L); second.setGroupId(301L); second.setBackedClassId(901); second.setCourseId(43);
        second.setStatus(ElectiveOffering.STATUS_ACTIVE);

        LmsGroup g1 = new LmsGroup(); g1.setId(300L); g1.setStatus(LmsGroup.STATUS_ACTIVE); g1.setActiveCount(1);
        LmsGroup g2 = new LmsGroup(); g2.setId(301L); g2.setStatus(LmsGroup.STATUS_ACTIVE); g2.setActiveCount(1);
        when(groupRepo.findById(300L)).thenReturn(Optional.of(g1));
        when(groupRepo.findById(301L)).thenReturn(Optional.of(g2));

        LmsGroupMember firstPick = new LmsGroupMember();
        firstPick.setMemberType(LmsGroupMember.TYPE_LEARNER); firstPick.setMemberId(1); firstPick.setState(LmsGroupMember.STATE_ACTIVE);
        LmsGroupMember secondPick = new LmsGroupMember();
        secondPick.setMemberType(LmsGroupMember.TYPE_LEARNER); secondPick.setMemberId(1); secondPick.setState(LmsGroupMember.STATE_ACTIVE);
        when(membership.members(300L, LmsGroupMember.STATE_WAITLISTED)).thenReturn(List.of());
        when(membership.members(301L, LmsGroupMember.STATE_WAITLISTED)).thenReturn(List.of());
        when(membership.members(300L, null)).thenReturn(List.of(firstPick));
        when(membership.members(301L, null)).thenReturn(List.of(secondPick));
        when(assignmentRepo.findByClassIdAndIsActive(anyInt(), eq(true))).thenReturn(List.of());

        com._42students.lms.dto.electives.ElectiveViews.SlotView view = invokeSlotView(slot, List.of(first, second));

        assertEquals(2, view.getAllocatedCount(), "two active seat enrolments");
        assertEquals(1, view.getCurrentStudentCount(), "one learner holds both picks");
    }

    @Test void slotAcademicIdentityIsLockedEvenWhenOnlyAWaitlistRecordExists() {
        ElectiveSlot slot = slot();
        ElectiveOffering offering = new ElectiveOffering(); offering.setGroupId(300L);
        when(offeringRepo.findBySlotIdAndIsDeletedFalseOrderByIdAsc(5L)).thenReturn(List.of(offering));
        LmsGroupMember waiting = new LmsGroupMember(); waiting.setState(LmsGroupMember.STATE_WAITLISTED);
        when(membership.members(300L, null)).thenReturn(List.of(waiting));
        NewProgram program = new NewProgram(); program.setId(3); program.setDurationYears(4);
        when(programRepo.findByIdAndNotDeleted(3)).thenReturn(Optional.of(program));

        SlotRequest r = new SlotRequest();
        r.setSemesterNumber(5);
        r.setAcademicYear("2027-28");
        r.setCredits(3);
        r.setMinPick(1);
        r.setMaxPick(1);
        r.setName("PE-1");

        assertThrows(IllegalStateException.class, () -> service.updateSlot(slot, r));
    }

    private Learner learner(int id, String roll, int classId) {
        Learner learner = new Learner();
        learner.setId(id);
        learner.setRollNumber(roll);
        learner.setFirstName("Learner " + id);
        learner.setCollegeId(COLLEGE);
        learner.setProgramId(3);
        learner.setClassId(classId);
        return learner;
    }

    private void stubEligibleClass(int classId, int batchId) {
        _Class clazz = new _Class();
        clazz.setId(classId);
        clazz.setProgramId(3);
        clazz.setBatchId(batchId);
        clazz.setClassType(_Class.TYPE_SECTION);
        when(classRepo.findByIdAndNotDeleted(classId)).thenReturn(Optional.of(clazz));
        Batch batch = new Batch();
        batch.setId((long) batchId);
        batch.setProgramId(3L);
        batch.setCurrentSemester(5);
        batch.setAcademicYear("2026-27");
        when(batchRepo.findById((long) batchId)).thenReturn(Optional.of(batch));
    }

    private com._42students.lms.dto.electives.ElectiveViews.SlotView invokeSlotView(
            ElectiveSlot slot, List<ElectiveOffering> offerings) {
        when(offeringRepo.findBySlotIdAndIsDeletedFalseOrderByIdAsc(slot.getId())).thenReturn(offerings);
        return service.slotDetail(slot);
    }

}
