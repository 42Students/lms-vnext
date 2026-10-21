package com._42students.lms.service.impl;

import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.dto.request.ResourceMaterialDTO;
import com._42students.lms.enums.ContentType;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.LessonContentsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** The generic writer must accept a real RESOURCE (no legacy stand-in type) and reject retired shapes. */
class LessonContentsResourceWriteTest {
    private LessonContentsDTO resource(ContentDataDTO data) {
        LessonContentsDTO dto = new LessonContentsDTO();
        dto.setContentType(ContentType.RESOURCE);
        dto.setContentTitle("  Week 1 reading  ");
        dto.setLessonId(7);
        dto.setContentDataDTO(data);
        return dto;
    }

    @Test
    void notesOnlyResourceIsPersistedAsResourceWithItsContentIntact() {
        LessonContentsServiceImpl service = new LessonContentsServiceImpl();
        ContentDataDTO data = new ContentDataDTO();
        data.setHtmlContent("<p>Read chapter 1</p>");
        data.setResourceMaterials(List.of());
        LessonContents row = new LessonContents();
        ReflectionTestUtils.invokeMethod(service, "setLessonContents", resource(data), row);
        assertEquals("resource", row.getContentType());
        assertEquals("Week 1 reading", row.getContentTitle());
        assertSame(data, row.getContentDataDTO());
        assertEquals("<p>Read chapter 1</p>", row.getContentDataDTO().getHtmlContent());
    }

    @Test
    void linkResourceKeepsItsMaterialsAndDoesNotGainInjectedNotesHtml() {
        LessonContentsServiceImpl service = new LessonContentsServiceImpl();
        ResourceMaterialDTO link = new ResourceMaterialDTO();
        link.setKind("LINK");
        link.setUrl("https://example.org/reading");
        ContentDataDTO data = new ContentDataDTO();
        data.setResourceMaterials(List.of(link));
        LessonContents row = new LessonContents();
        ReflectionTestUtils.invokeMethod(service, "setLessonContents", resource(data), row);
        assertEquals("resource", row.getContentType());
        assertEquals(1, row.getContentDataDTO().getResourceMaterials().size());
        assertNull(row.getContentDataDTO().getHtmlContent());
    }

    @Test
    void missingContentTypeIsRejectedInsteadOfDefaultingToALegacyType() {
        LessonContentsServiceImpl service = new LessonContentsServiceImpl();
        LessonContentsDTO dto = resource(new ContentDataDTO());
        dto.setContentType(null);
        assertThrows(IllegalArgumentException.class,
                () -> ReflectionTestUtils.invokeMethod(service, "setLessonContents", dto, new LessonContents()));
    }

    @Test
    void assignmentIsStillRejectedByTheGenericWriter() {
        LessonContentsServiceImpl service = new LessonContentsServiceImpl();
        LessonContentsDTO dto = resource(new ContentDataDTO());
        dto.setContentType(ContentType.ASSIGNMENT);
        assertThrows(IllegalArgumentException.class,
                () -> ReflectionTestUtils.invokeMethod(service, "setLessonContents", dto, new LessonContents()));
    }

    @Test
    void existingAssignmentCannotBypassDedicatedWriterThroughGenericUpdateOrDelete() {
        LessonContentsServiceImpl service = new LessonContentsServiceImpl();
        LessonContentsRepository repository = mock(LessonContentsRepository.class);
        ReflectionTestUtils.setField(service, "lessonContentsRepository", repository);
        LessonContents assignment = new LessonContents();
        assignment.setId(44);
        assignment.setContentType("assignment");
        assignment.setLessonId(7);
        when(repository.findById(44)).thenReturn(java.util.Optional.of(assignment));

        ResponseStatusException update = assertThrows(ResponseStatusException.class,
                () -> service.updateLessonContent(44, new LessonContentsDTO()));
        ResponseStatusException delete = assertThrows(ResponseStatusException.class,
                () -> service.deleteLessonContent(44));

        assertEquals(HttpStatus.CONFLICT, update.getStatus());
        assertEquals(HttpStatus.CONFLICT, delete.getStatus());
        verify(repository, never()).save(any());
    }
}
