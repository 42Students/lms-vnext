package com._42students.lms.service.impl;

import com._42students.lms.dto.response.PageResponseDTO;
import com._42students.lms.model.Learner;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.service.LearnerService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LessonContentsServiceImplLearnerAssignmentsTest {

    @Test
    void pagedLearnerAssignmentsReturnEmptyPageForLearnerWithoutClass() throws Exception {
        LessonContentsServiceImpl service = new LessonContentsServiceImpl();
        LearnerService learnerService = mock(LearnerService.class);
        LessonContentsRepository repository = mock(LessonContentsRepository.class);
        ReflectionTestUtils.setField(service, "learnerService", learnerService);
        ReflectionTestUtils.setField(service, "lessonContentsRepository", repository);
        Learner learner = new Learner();
        learner.setId(42);
        learner.setClassId(null);
        when(learnerService.getLearnerDetails("42")).thenReturn(learner);

        PageResponseDTO<LessonContents> page = service.fetchAllAssignmentsByLearnerIdPaged(42, null, 0, 20);

        assertTrue(page.getContent().isEmpty());
        assertEquals(0, page.getTotalElements());
        assertEquals(0, page.getTotalPages());
        assertEquals(20, page.getSize());
        assertEquals(0, page.getNumber());
        assertTrue(page.isFirst());
        assertTrue(page.isLast());
        verify(repository, never()).fetchAllAssignmentsByLearnerIdPaged(org.mockito.ArgumentMatchers.anyInt(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }
}
