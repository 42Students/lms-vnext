package com._42students.lms.controller;

import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.dto.response.Response;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class FacultyResourceUploadReceiptAdviceTest {
    @Test
    void facultyCreateReusesAdminReceiptChecksOnBothRequestAndResponse() throws Exception {
        FacultyResourceUploadReceiptAdvice advice = new FacultyResourceUploadReceiptAdvice();
        ResourceUploadReceiptAdvice canonical = mock(ResourceUploadReceiptAdvice.class);
        ReflectionTestUtils.setField(advice, "receipts", canonical);
        Method facultyCreate = FacultyLessonContentController.class.getMethod("create", LessonContentsDTO.class);
        MethodParameter request = new MethodParameter(facultyCreate, 0);
        MethodParameter response = new MethodParameter(facultyCreate, -1);
        assertTrue(advice.supports(request, LessonContentsDTO.class, MappingJackson2HttpMessageConverter.class));
        assertTrue(advice.supports(response, MappingJackson2HttpMessageConverter.class));

        LessonContentsDTO dto = new LessonContentsDTO();
        when(canonical.afterBodyRead(same(dto), isNull(), any(MethodParameter.class), eq(LessonContentsDTO.class),
                eq(MappingJackson2HttpMessageConverter.class))).thenReturn(dto);
        assertSame(dto, advice.afterBodyRead(dto, null, request, LessonContentsDTO.class,
                MappingJackson2HttpMessageConverter.class));
        org.mockito.ArgumentCaptor<MethodParameter> incoming = org.mockito.ArgumentCaptor.forClass(MethodParameter.class);
        verify(canonical).afterBodyRead(same(dto), isNull(), incoming.capture(), eq(LessonContentsDTO.class),
                eq(MappingJackson2HttpMessageConverter.class));
        assertEquals("createLessonContents", incoming.getValue().getMethod().getName());

        Response<String> body = new Response<>("OK", "OK", "resource");
        when(canonical.beforeBodyWrite(same(body), any(MethodParameter.class), eq(MediaType.APPLICATION_JSON),
                eq(MappingJackson2HttpMessageConverter.class), isNull(), isNull())).thenReturn(body);
        assertSame(body, advice.beforeBodyWrite(body, response, MediaType.APPLICATION_JSON,
                MappingJackson2HttpMessageConverter.class, null, null));
        org.mockito.ArgumentCaptor<MethodParameter> outgoing = org.mockito.ArgumentCaptor.forClass(MethodParameter.class);
        verify(canonical).beforeBodyWrite(same(body), outgoing.capture(), eq(MediaType.APPLICATION_JSON),
                eq(MappingJackson2HttpMessageConverter.class), isNull(), isNull());
        assertEquals("createLessonContents", outgoing.getValue().getMethod().getName());
    }
}
