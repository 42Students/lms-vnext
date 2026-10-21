package com._42students.lms.service.impl;

import com._42students.lms.model.Learner;
import com._42students.lms.model._Class;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.util.JobVisibilityCache;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LearnerClassMoveServiceTest {

    @Mock private LearnerRepository learnerRepository;
    @Mock private _ClassRepository classRepository;
    @Mock private com._42students.lms.access.ScopeResolutionService scopeResolutionService;
    @Mock private JobVisibilityCache jobVisibilityCache;

    private LearnerServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new LearnerServiceImpl();
        ReflectionTestUtils.setField(service, "learnerRepository", learnerRepository);
        ReflectionTestUtils.setField(service, "classRepository", classRepository);
        ReflectionTestUtils.setField(service, "scopeResolutionService", scopeResolutionService);
        ReflectionTestUtils.setField(service, "jobVisibilityCache", jobVisibilityCache);
    }

    @Test
    void moveChangesOnlyAcademicPlacementAndPreservesProfile() {
        Learner learner = learner(10, 101, 7, 5, "Original address");
        _Class from = section(101, 7, 33, 60);
        _Class to = section(102, 7, 33, 60);

        when(learnerRepository.findById(10)).thenReturn(Optional.of(learner));
        when(classRepository.findByIdAndNotDeleted(101)).thenReturn(Optional.of(from));
        when(classRepository.findByIdForUpdate(102)).thenReturn(Optional.of(to));
        when(scopeResolutionService.resolveClassToCollegeId(102)).thenReturn(5);
        when(learnerRepository.getActiveStudentDetailsByClassId(102)).thenReturn(List.of());
        when(learnerRepository.save(any(Learner.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Learner moved = service.moveLearnerToClass(10, 102);

        assertEquals(102, moved.getClassId());
        assertEquals(7, moved.getProgramId());
        assertEquals("Original address", moved.getAddress());
        assertEquals("9999999999", moved.getContactMobile());
        assertEquals("Student", moved.getDescription());
    }

    @Test
    void moveRejectsCrossBatchDestination() {
        Learner learner = learner(10, 101, 7, 5, "A");
        when(learnerRepository.findById(10)).thenReturn(Optional.of(learner));
        when(classRepository.findByIdAndNotDeleted(101)).thenReturn(Optional.of(section(101, 7, 33, 60)));
        when(classRepository.findByIdForUpdate(202)).thenReturn(Optional.of(section(202, 7, 44, 60)));

        assertThrows(IllegalArgumentException.class, () -> service.moveLearnerToClass(10, 202));
        verify(learnerRepository, never()).save(any());
    }

    @Test
    void moveRejectsGroupBackedDestination() {
        Learner learner = learner(10, 101, 7, 5, "A");
        _Class groupBacked = section(102, 7, 33, 60);
        groupBacked.setClassType(_Class.TYPE_GROUP_BACKED);

        when(learnerRepository.findById(10)).thenReturn(Optional.of(learner));
        when(classRepository.findByIdAndNotDeleted(101)).thenReturn(Optional.of(section(101, 7, 33, 60)));
        when(classRepository.findByIdForUpdate(102)).thenReturn(Optional.of(groupBacked));

        assertThrows(IllegalArgumentException.class, () -> service.moveLearnerToClass(10, 102));
        verify(learnerRepository, never()).save(any());
    }

    @Test
    void moveRejectsFullDestinationClass() {
        Learner learner = learner(10, 101, 7, 5, "A");
        _Class target = section(102, 7, 33, 1);
        Learner occupant = learner(11, 102, 7, 5, "B");

        when(learnerRepository.findById(10)).thenReturn(Optional.of(learner));
        when(classRepository.findByIdAndNotDeleted(101)).thenReturn(Optional.of(section(101, 7, 33, 60)));
        when(classRepository.findByIdForUpdate(102)).thenReturn(Optional.of(target));
        when(scopeResolutionService.resolveClassToCollegeId(102)).thenReturn(5);
        when(learnerRepository.getActiveStudentDetailsByClassId(102)).thenReturn(List.of(occupant));

        assertThrows(IllegalStateException.class, () -> service.moveLearnerToClass(10, 102));
        verify(learnerRepository, never()).save(any());
    }

    private Learner learner(int id, int classId, int programId, int collegeId, String address) {
        Learner learner = new Learner();
        learner.setId(id);
        learner.setClassId(classId);
        learner.setProgramId(programId);
        learner.setCollegeId(collegeId);
        learner.setOrganizationId(2);
        learner.setAddress(address);
        learner.setContactMobile("9999999999");
        learner.setDescription("Student");
        return learner;
    }

    private _Class section(int id, int programId, int batchId, int upperLimit) {
        _Class value = new _Class();
        value.setId(id);
        value.setProgramId(programId);
        value.setBatchId(batchId);
        value.setUpperLimit(upperLimit);
        value.setClassType(_Class.TYPE_SECTION);
        return value;
    }
}
