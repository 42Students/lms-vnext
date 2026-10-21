package com._42students.lms.controller;

import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.enums.ContentType;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;

import java.lang.reflect.Type;

/**
 * Requires an explicit content_type on both lesson-content create endpoints. Without it the
 * generic writer would have to guess a default type; the retired types themselves are rejected
 * earlier, when ContentType.fromString binds the request body.
 */
@ControllerAdvice(assignableTypes = {LessonContentController.class, FacultyLessonContentController.class})
public class LessonContentTypeRequiredAdvice extends RequestBodyAdviceAdapter {
    @Override
    public boolean supports(MethodParameter parameter, Type targetType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        if (!LessonContentsDTO.class.isAssignableFrom(parameter.getParameterType())
                || parameter.getMethod() == null) return false;
        Class<?> controller = parameter.getContainingClass();
        String method = parameter.getMethod().getName();
        return (controller == LessonContentController.class && "createLessonContents".equals(method))
                || (controller == FacultyLessonContentController.class && "create".equals(method));
    }

    @Override
    public Object afterBodyRead(Object body, HttpInputMessage inputMessage,
                                MethodParameter parameter, Type targetType,
                                Class<? extends HttpMessageConverter<?>> converterType) {
        if (body instanceof LessonContentsDTO) {
            requireContentType(((LessonContentsDTO) body).getContentType());
        }
        return body;
    }

    public static void requireContentType(ContentType type) {
        if (type == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content_type is required");
        }
    }
}
