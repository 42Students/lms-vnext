package com._42students.lms.controller;

import com._42students.lms.dto.request.LessonContentsDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import java.lang.reflect.Method;
import java.lang.reflect.Type;

/**
 * Faculty requests bypass the admin controller's HTTP advice when its method is
 * called directly in Java. Apply the same receipt validation/consumption to the
 * faculty HTTP entry point rather than duplicating its security policy.
 */
@ControllerAdvice(assignableTypes = FacultyLessonContentController.class)
public class FacultyResourceUploadReceiptAdvice extends RequestBodyAdviceAdapter implements ResponseBodyAdvice<Object> {
    private static final Method ADMIN_CREATE = adminCreateMethod();

    @Autowired
    private ResourceUploadReceiptAdvice receipts;

    private static Method adminCreateMethod() {
        try {
            return LessonContentController.class.getMethod("createLessonContents", LessonContentsDTO.class);
        } catch (NoSuchMethodException e) {
            throw new IllegalStateException("Admin lesson content receipt validation entrypoint changed", e);
        }
    }

    private static boolean isFacultyCreate(MethodParameter parameter) {
        return parameter.getContainingClass() == FacultyLessonContentController.class
                && parameter.getMethod() != null
                && "create".equals(parameter.getMethod().getName());
    }

    @Override
    public boolean supports(MethodParameter parameter, Type targetType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        return isFacultyCreate(parameter)
                && LessonContentsDTO.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object afterBodyRead(Object body, HttpInputMessage inputMessage, MethodParameter parameter,
                                Type targetType, Class<? extends HttpMessageConverter<?>> converterType) {
        if (!isFacultyCreate(parameter) || !(body instanceof LessonContentsDTO)) return body;
        return receipts.afterBodyRead(body, inputMessage, new MethodParameter(ADMIN_CREATE, 0), targetType, converterType);
    }

    @Override
    public boolean supports(MethodParameter returnType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        return isFacultyCreate(returnType);
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest inputMessage, ServerHttpResponse outputMessage) {
        if (!isFacultyCreate(returnType)) return body;
        return receipts.beforeBodyWrite(body, new MethodParameter(ADMIN_CREATE, -1), selectedContentType,
                selectedConverterType, inputMessage, outputMessage);
    }
}
