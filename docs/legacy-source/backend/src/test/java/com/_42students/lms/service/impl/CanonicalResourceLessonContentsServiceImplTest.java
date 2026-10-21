package com._42students.lms.service.impl;

import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.FileDTO;
import com._42students.lms.dto.request.ResourceMaterialDTO;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CanonicalResourceLessonContentsServiceImplTest {
    @Test
    void onlyAcceptsHttpsLinksWithoutCredentialsOrControlCharacters() {
        assertTrue(CanonicalResourceLessonContentsServiceImpl.validHttpsLink("https://example.org/file.pdf"));
        assertFalse(CanonicalResourceLessonContentsServiceImpl.validHttpsLink("http://example.org/file.pdf"));
        assertFalse(CanonicalResourceLessonContentsServiceImpl.validHttpsLink("https://name:secret@example.org/file"));
        assertFalse(CanonicalResourceLessonContentsServiceImpl.validHttpsLink("https://example.org/evil\nheader"));
        assertFalse(CanonicalResourceLessonContentsServiceImpl.validHttpsLink("javascript:alert(1)"));
        assertFalse(CanonicalResourceLessonContentsServiceImpl.validHttpsLink("https://example.org/a b"));
        assertFalse(CanonicalResourceLessonContentsServiceImpl.validHttpsLink("https://"));
    }

    @Test
    void resourceMaterialsRoundTripThroughExistingSnakeCaseContentJson() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        FileDTO file = new FileDTO();
        file.setOriginalName("slides.pptx");
        file.setMimetype("application/vnd.openxmlformats-officedocument.presentationml.presentation");
        file.setCloudStorageObject("org-1/college-2/lesson-content/slides.pptx");
        file.setSize(1200);
        ResourceMaterialDTO document = new ResourceMaterialDTO();
        document.setKind("FILE");
        document.setTitle("Slides");
        document.setFileDTO(file);
        ResourceMaterialDTO link = new ResourceMaterialDTO();
        link.setKind("LINK");
        link.setUrl("https://example.org/reading");
        ContentDataDTO data = new ContentDataDTO();
        data.setResourceMaterials(new ArrayList<>(List.of(document, link)));
        data.setText("Class notes");
        String json = mapper.writeValueAsString(data);
        assertTrue(json.contains("resource_materials"));
        assertTrue(json.contains("cloud_storage_object"));
        ContentDataDTO restored = mapper.readValue(json, ContentDataDTO.class);
        assertEquals(2, restored.getResourceMaterials().size());
        assertEquals("slides.pptx", restored.getResourceMaterials().get(0).getFileDTO().getOriginalName());
        assertEquals("https://example.org/reading", restored.getResourceMaterials().get(1).getUrl());
        assertEquals("Class notes", restored.getText());
    }

    @Test
    void emptyResourceAndUnexpectedKindAreRejectedBeforeSave() {
        CanonicalResourceLessonContentsServiceImpl service = new CanonicalResourceLessonContentsServiceImpl();
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        UserPrincipal principal = mock(UserPrincipal.class);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(principal);
        ReflectionTestUtils.setField(service, "securityContextUtil", security);
        ContentDataDTO empty = new ContentDataDTO();
        empty.setResourceMaterials(List.of());
        ResponseStatusException noData = assertThrows(ResponseStatusException.class,
                () -> ReflectionTestUtils.invokeMethod(service, "validateResource", empty));
        assertEquals(HttpStatus.BAD_REQUEST, noData.getStatus());
        ResourceMaterialDTO unknown = new ResourceMaterialDTO();
        unknown.setKind("EXECUTABLE");
        empty.setResourceMaterials(List.of(unknown));
        ResponseStatusException invalidKind = assertThrows(ResponseStatusException.class,
                () -> ReflectionTestUtils.invokeMethod(service, "validateResource", empty));
        assertEquals(HttpStatus.BAD_REQUEST, invalidKind.getStatus());
    }
}
