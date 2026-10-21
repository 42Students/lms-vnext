package com._42students.lms.controller;

import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.enums.ContentType;
import com._42students.lms.model.Lesson;
import com._42students.lms.repository.LessonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.MethodParameter;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Type;

/**
 * Validate actual lesson/course ownership before the upload-receipt advice sees
 * client-provided course hints. Covers faculty and admin Resource creation,
 * including notes-only and link-only Resources with no FILE materials.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@ControllerAdvice(assignableTypes = {LessonContentController.class, FacultyLessonContentController.class})
public class ResourceLessonCourseRequestGuard extends RequestBodyAdviceAdapter {
    @Autowired private LessonRepository lessonRepository;
    @Autowired private ScopeResolutionService scopeResolutionService;

    @Override
    public boolean supports(MethodParameter parameter, Type targetType,
                            Class<? extends HttpMessageConverter<?>> converterType) {
        if (!LessonContentsDTO.class.isAssignableFrom(parameter.getParameterType())
                || parameter.getMethod() == null) return false;
        String method = parameter.getMethod().getName();
        return "create".equals(method) || "createLessonContents".equals(method);
    }

    @Override
    public Object afterBodyRead(Object body, HttpInputMessage inputMessage, MethodParameter parameter,
                                Type targetType, Class<? extends HttpMessageConverter<?>> converterType) {
        if (body instanceof LessonContentsDTO && ((LessonContentsDTO) body).getContentType() == ContentType.RESOURCE) {
            validateCreate((LessonContentsDTO) body);
        }
        return body;
    }

    void validateCreate(LessonContentsDTO dto) {
        Integer lessonId = dto.getLessonId();
        if (lessonId == null || lessonId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid Resource lesson is required");
        }
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource lesson not found"));
        Integer actualCourseId = lesson.getCourseId();
        if (actualCourseId == null || actualCourseId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource lesson has no valid course");
        }
        if (dto.getCourseId() != null && dto.getCourseId() > 0
                && !actualCourseId.equals(dto.getCourseId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Resource course must match the selected lesson's course");
        }
        Integer classId = dto.getClassId();
        if (classId != null && classId > 0) {
            Integer classCollege = scopeResolutionService.resolveClassToCollegeId(classId);
            Integer courseCollege = scopeResolutionService.resolveCourseToCollegeId(actualCourseId);
            if (classCollege == null || courseCollege == null || !classCollege.equals(courseCollege)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Resource class and lesson course must belong to the same college");
            }
        }
        // Populate the verified course before receipt scope validation and persistence.
        dto.setCourseId(actualCourseId);
    }
}
